import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import { Bell, Check, ArrowRight } from "lucide-react";

export function ClientNotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  /**
   * Resolve stale generic links (e.g. /quotes/:id, /bookings/:id, /messages/:id)
   * into proper client-prefixed routes.
   */
  const resolveClientLink = (n) => {
    const rawLink = n?.link || n?.relatedEntity?.link;
    if (rawLink) {
      if (
        rawLink.startsWith("/client/") ||
        rawLink.startsWith("/company/") ||
        rawLink.startsWith("/admin/")
      )
        return rawLink;
      if (rawLink.startsWith("/quotes/"))
        return `/client/quotes/${rawLink.replace("/quotes/", "")}`;
      if (rawLink === "/quotes") return `/client/quotes`;
      if (rawLink.startsWith("/bookings/"))
        return `/client/bookings/${rawLink.replace("/bookings/", "")}`;
      if (rawLink === "/bookings") return `/client/bookings`;
      if (rawLink.startsWith("/messages/"))
        return `/client/messages/${rawLink.replace("/messages/", "")}`;
      if (rawLink === "/messages") return `/client/messages`;
      if (rawLink.startsWith("/requests/"))
        return `/client/requests/${rawLink.replace("/requests/", "")}`;
      if (rawLink === "/requests") return `/client/requests`;
      return rawLink;
    }
    const eType = n?.entityType || n?.type || "";
    const eId = n?.entityId;
    if (eType.includes("quote")) return eId ? `/client/quotes/${eId}` : "/client/quotes";
    if (eType.includes("message")) return eId ? `/client/messages/${eId}` : "/client/messages";
    if (eType.includes("booking") || eType.includes("payment")) return eId ? `/client/bookings/${eId}` : "/client/bookings";
    if (eType.includes("request")) return eId ? `/client/requests/${eId}` : "/client/requests";
    return "/client/dashboard";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500">Mises à jour sur vos devis, messages et réservations</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
        >
          <Check className="w-4 h-4" />
          <span>Tout marquer comme lu</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle divide-y divide-slate-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Vous n'avez aucune notification pour le moment.
          </div>
        ) : (
          notifications.map((n) => {
            const nId = n._id || n.id;
            const isRead = n.read ?? n.isRead;
            const resolvedLink = resolveClientLink(n);
            return (
              <div
                key={nId}
                onClick={() => {
                  markAsRead(nId);
                  if (resolvedLink) navigate(resolvedLink);
                }}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${!isRead ? "bg-brand-50/20" : ""
                  }`}
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${!isRead ? "bg-brand-600" : "bg-slate-300"
                      }`}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {n.createdAt
                        ? new Date(n.createdAt).toLocaleDateString("fr-TN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : n.date || ""}
                    </span>
                  </div>
                </div>

                {resolvedLink && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(nId);
                      navigate(resolvedLink);
                    }}
                    className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 flex-shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
