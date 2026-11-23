import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { notificationService } from "../services/api/notificationService";
import { useAuth } from "./AuthContext";
import { initSocket, disconnectSocket } from "../services/api/socket";
import { toast } from "sonner";

const NotificationContext = createContext(null);

/**
 * Synthesizes a clean, pleasant notification chime ("bip-bip" / "ding-dong")
 * using standard Web Audio API without needing external sound files.
 */
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;

    // First soft ping (E5 -> A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, t);
    osc1.frequency.exponentialRampToValueAtTime(880, t + 0.08);

    gain1.gain.setValueAtTime(0.001, t);
    gain1.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.26);

    // Second bright ping (C#6 -> E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1108.73, t + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1318.51, t + 0.22);

    gain2.gain.setValueAtTime(0.001, t + 0.1);
    gain2.gain.linearRampToValueAtTime(0.25, t + 0.13);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.48);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.1);
    osc2.stop(t + 0.5);
  } catch (err) {
    console.debug("Audio notification suppressed:", err);
  }
}

// Map notification types to emojis / styles
const TYPE_CONFIG = {
  payment_requested: { emoji: "💳", color: "#2563eb" },
  payment_completed: { emoji: "✅", color: "#16a34a" },
  quote_accepted:    { emoji: "🎉", color: "#7c3aed" },
  booking_cancelled: { emoji: "❌", color: "#dc2626" },
  new_message:       { emoji: "💬", color: "#0891b2" },
  review_approved:   { emoji: "⭐", color: "#d97706" },
  moving_reminder:   { emoji: "🚛", color: "#059669" },
  new_request:       { emoji: "📦", color: "#cf0000" },
  system:            { emoji: "🔔", color: "#64748b" },
};

const ACTION_LABEL = {
  payment_requested: "→ Payer l'acompte maintenant",
  payment_completed: "→ Voir la réservation",
  new_message:       "→ Voir les messages",
  quote_accepted:    "→ Voir la réservation",
  booking_cancelled: "→ Voir le détail",
  new_request:       "→ Consulter & Déposer un devis",
};

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  // Per-booking listeners: Map<bookingId, Set<callback>>
  const bookingListenersRef = useRef(new Map());

  // Marketplace request listeners: Set<callback>
  const requestListenersRef = useRef(new Set());

  // Quote listeners: Set<callback>
  const quoteListenersRef = useRef(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const res = await notificationService.getNotifications({ limit: 40 });
      const resData = res?.data || res;
      const list = Array.isArray(resData?.notifications)
        ? resData.notifications
        : Array.isArray(resData)
        ? resData
        : [];
      const count =
        typeof resData?.unreadCount === "number"
          ? resData.unreadCount
          : list.filter((n) => !n.isRead && !n.read).length;
      setNotifications(list);
      setUnreadCount(count);
    } catch (e) {
      console.warn("Erreur chargement notifications:", e.message);
    }
  }, [currentUser]);

  /**
   * Register a callback for real-time booking updates.
   * Called by ClientBookingDetailPage / CompanyBookingDetailPage.
   * Returns an unregister function to call on unmount.
   */
  const onBookingUpdate = useCallback((bookingId, callback) => {
    if (!bookingId || typeof callback !== "function") return () => {};
    const id = String(bookingId);
    if (!bookingListenersRef.current.has(id)) {
      bookingListenersRef.current.set(id, new Set());
    }
    bookingListenersRef.current.get(id).add(callback);
    return () => {
      const set = bookingListenersRef.current.get(id);
      if (set) {
        set.delete(callback);
        if (set.size === 0) bookingListenersRef.current.delete(id);
      }
    };
  }, []);

  /**
   * Register a callback for real-time moving request broadcasts.
   * Called by CompanyRequestsPage / CompanyDashboardPage.
   * Returns an unregister function to call on unmount.
   */
  const onRequestUpdate = useCallback((callback) => {
    if (typeof callback !== "function") return () => {};
    requestListenersRef.current.add(callback);
    return () => {
      requestListenersRef.current.delete(callback);
    };
  }, []);

  /**
   * Register a callback for real-time quote reception and updates.
   * Called by ClientDashboardPage / ClientQuotesPage / ClientRequestDetailPage.
   * Returns an unregister function to call on unmount.
   */
  const onQuoteUpdate = useCallback((callback) => {
    if (typeof callback !== "function") return () => {};
    quoteListenersRef.current.add(callback);
    return () => {
      quoteListenersRef.current.delete(callback);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      if (socketRef.current) {
        disconnectSocket();
        socketRef.current = null;
      }
      return;
    }

    fetchNotifications();
    const socket = initSocket();
    socketRef.current = socket;

    if (!socket) return;

    // ── notification:new ────────────────────────────────────────────
    const handleNewNotification = (data) => {
      // Play audible chime sound alert
      playNotificationChime();

      let notif = data?.notification || data;
      if (!notif) return;

      // Assign fallback ID if missing to prevent dropping notification
      if (!notif._id && !notif.id) {
        if (notif.title || notif.message || notif.type) {
          notif._id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        } else {
          return;
        }
      }

      setNotifications((prev) => {
        const notifId = notif._id || notif.id;
        if (prev.some((n) => (n._id || n.id) === notifId)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount((c) =>
        typeof data?.unreadCount === "number" ? data.unreadCount : c + 1
      );

      // Instantly trigger booking listeners if this notification relates to a booking
      const relBookingId =
        notif.meta?.bookingId ||
        (notif.relatedEntity?.entityType === "booking"
          ? String(notif.relatedEntity.entityId)
          : null);
      if (relBookingId) {
        handleBookingUpdated({
          bookingId: relBookingId,
          type: notif.type,
          meta: notif.meta,
        });
      }

      // Instantly trigger request listeners if this notification relates to a new request
      if (notif.type === "new_request") {
        handleRequestNew({
          request: notif.relatedEntity || null,
          requestId:
            notif.meta?.requestId ||
            notif.relatedEntity?.entityId ||
            notif.requestId ||
            null,
        });
      }

      // Instantly trigger quote listeners if this notification relates to a quote
      if (
        notif.type === "new_quote" ||
        notif.relatedEntity?.entityType === "quote" ||
        notif.entityType === "quote"
      ) {
        handleQuoteNew({
          quoteId:
            notif.meta?.quoteId ||
            notif.relatedEntity?.entityId ||
            notif.entityId ||
            null,
          requestId:
            notif.meta?.requestId ||
            notif.relatedEntity?.requestId ||
            null,
          quote: notif.quote || null,
          type: notif.type,
        });
      }

      // Enriched toast with action link
      const type = notif.type || "system";
      const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.system;
      const link =
        notif.relatedEntity?.link ||
        notif.link ||
        (notif.requestId ? `/company/requests/${notif.requestId}` : null) ||
        (notif.type === "new_request" && notif.relatedEntity?.entityId
          ? `/company/requests/${notif.relatedEntity.entityId}`
          : null);
      const actionLabel = ACTION_LABEL[type];

      toast(
        React.createElement(
          "div",
          { style: { display: "flex", flexDirection: "column", gap: "4px" } },
          // Title row
          React.createElement(
            "div",
            { style: { display: "flex", alignItems: "center", gap: "8px" } },
            React.createElement("span", { style: { fontSize: "16px" } }, cfg.emoji),
            React.createElement(
              "span",
              { style: { fontWeight: "700", fontSize: "13px", color: "#0f172a" } },
              notif.title || "Nouvelle notification"
            )
          ),
          // Message
          React.createElement(
            "p",
            { style: { fontSize: "12px", color: "#475569", margin: "0 0 0 24px", lineHeight: "1.5" } },
            notif.message || ""
          ),
          // Action button
          link && actionLabel
            ? React.createElement(
                "button",
                {
                  onClick: () => {
                    if (type === "payment_requested" && location.pathname.includes(link)) {
                      window.dispatchEvent(new CustomEvent("open-virtual-payment-modal"));
                    } else {
                      navigate(link);
                    }
                  },
                  style: {
                    marginTop: "6px",
                    marginLeft: "24px",
                    padding: "5px 14px",
                    borderRadius: "8px",
                    background: cfg.color,
                    color: "#fff",
                    border: "none",
                    fontSize: "11px",
                    fontWeight: "700",
                    cursor: "pointer",
                    display: "inline-block",
                  },
                },
                actionLabel
              )
            : null
        ),
        {
          duration: type === "payment_requested" ? 15000 : 8000,
          unstyled: false,
        }
      );
    };

    // ── booking:updated ─────────────────────────────────────────────
    // Dispatched by backend when a payment event happens on a booking
    const handleBookingUpdated = (data) => {
      const bookingId = data?.bookingId ? String(data.bookingId) : null;
      if (!bookingId) return;

      const listeners = bookingListenersRef.current.get(bookingId);
      if (listeners && listeners.size > 0) {
        listeners.forEach((cb) => {
          try { cb(data); } catch (_) {}
        });
      }

      const allListeners = bookingListenersRef.current.get("*");
      if (allListeners && allListeners.size > 0) {
        allListeners.forEach((cb) => {
          try { cb(data); } catch (_) {}
        });
      }
    };

    // ── request:new ─────────────────────────────────────────────────
    // Dispatched when a client posts a new moving request
    const handleRequestNew = (data) => {
      if (requestListenersRef.current.size > 0) {
        requestListenersRef.current.forEach((cb) => {
          try { cb(data); } catch (_) {}
        });
      }
    };

    // ── quote:new ───────────────────────────────────────────────────
    // Dispatched when a company submits a new quote for a client's request
    const handleQuoteNew = (data) => {
      if (quoteListenersRef.current.size > 0) {
        quoteListenersRef.current.forEach((cb) => {
          try { cb(data); } catch (_) {}
        });
      }
    };

    socket.on("notification:new", handleNewNotification);
    socket.on("booking:updated", handleBookingUpdated);
    socket.on("request:new", handleRequestNew);
    socket.on("quote:new", handleQuoteNew);
    socket.on("connect", fetchNotifications);

    return () => {
      socket.off("notification:new", handleNewNotification);
      socket.off("booking:updated", handleBookingUpdated);
      socket.off("request:new", handleRequestNew);
      socket.off("quote:new", handleQuoteNew);
      socket.off("connect", fetchNotifications);
    };
  }, [currentUser, fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          (n._id || n.id) === id ? { ...n, isRead: true, read: true } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, read: true }))
      );
      setUnreadCount(0);
    } catch (e) {
      console.error("Error marking all notifications as read:", e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications,
        onBookingUpdate,
        onRequestUpdate,
        onQuoteUpdate,
        playNotificationSound: playNotificationChime,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
