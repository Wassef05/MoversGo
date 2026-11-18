import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { getLogoUrl } from "../../utils/cn";
import {
  Bell,
  Search,
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ExternalLink,
  Check,
  ShieldCheck
} from "lucide-react";

export function DashboardHeader({ onMenuClick, title, subtitle }) {
  const { currentUser, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getProfileLink = () => {
    if (currentUser?.role === "admin") return "/admin/profile";
    if (currentUser?.role === "company") return "/company/profile";
    return "/client/profile";
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between transition-all">
      {/* Left: Mobile trigger & Page Titles */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          {title && <h1 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h1>}
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Right: Actions, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Search input (desktop) */}
        {/* <div className="relative hidden md:block w-56 lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher une demande, devis..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
          />
        </div> */}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfile(false);
            }}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-2 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] font-semibold text-brand-600 hover:text-brand-700"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Aucune notification.</p>
                ) : (
                  notifications.map((notif) => {
                    const notifId = notif._id || notif.id;
                    const isUnread = !notif.isRead && !notif.read;
                    const rawLink = notif.relatedEntity?.link || notif.link || "";
                    const userRole = currentUser?.role || "client";
                    // Fix stale/generic notification links to be role-prefixed and direct
                    const destLink = (() => {
                      if (rawLink) {
                        if (rawLink.startsWith("/client/") || rawLink.startsWith("/company/") || rawLink.startsWith("/admin/")) return rawLink;
                        if (rawLink.startsWith("/quotes/")) return `/${userRole}/quotes/${rawLink.replace("/quotes/", "")}`;
                        if (rawLink === "/quotes") return `/${userRole}/quotes`;
                        if (rawLink.startsWith("/bookings/")) return `/${userRole}/bookings/${rawLink.replace("/bookings/", "")}`;
                        if (rawLink === "/bookings") return `/${userRole}/bookings`;
                        if (rawLink.startsWith("/messages/")) return `/${userRole}/messages/${rawLink.replace("/messages/", "")}`;
                        if (rawLink === "/messages") return `/${userRole}/messages`;
                        if (rawLink.startsWith("/requests/")) return `/${userRole}/requests/${rawLink.replace("/requests/", "")}`;
                        if (rawLink === "/requests") return `/${userRole}/requests`;
                        return rawLink;
                      }

                      // Infer target if link is omitted
                      const eType = notif.entityType || notif.type || "";
                      const eId = notif.entityId || notif.quoteId || notif.bookingId || notif.conversationId;
                      if (eType === "quote" || eType === "new_quote") {
                        return eId ? `/${userRole}/quotes/${eId}` : `/${userRole}/quotes`;
                      }
                      if (eType === "message" || eType === "new_message") {
                        return eId ? `/${userRole}/messages/${eId}` : `/${userRole}/messages`;
                      }
                      if (eType.includes("booking") || eType.includes("payment")) {
                        return eId ? `/${userRole}/bookings/${eId}` : `/${userRole}/bookings`;
                      }
                      if (eType.includes("request")) {
                        return eId ? `/${userRole}/requests/${eId}` : `/${userRole}/requests`;
                      }
                      return `/${userRole}/dashboard`;
                    })();
                    const dateDisplay = notif.createdAt
                      ? new Date(notif.createdAt).toLocaleDateString("fr-TN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : notif.date || "";

                    return (
                      <div
                        key={notifId}
                        onClick={() => {
                          markAsRead(notifId);
                          if (destLink) {
                            navigate(destLink);
                            setShowNotifications(false);
                          }
                        }}
                        className={`p-3 text-xs hover:bg-slate-50 transition-colors cursor-pointer flex items-start gap-2.5 ${isUnread ? "bg-brand-50/40" : ""
                          }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isUnread ? "bg-brand-600" : "bg-slate-300"
                            }`}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900">{notif.title}</p>
                          <p className="text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                          {dateDisplay && (
                            <span className="text-[10px] text-slate-400 mt-1 block font-medium">
                              {dateDisplay}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          {(() => {
            const userAvatar =
              (currentUser?.role === "company" && currentUser?.company?.logo
                ? getLogoUrl(currentUser.company.logo)
                : null) ||
              (currentUser?.profileImage ? getLogoUrl(currentUser.profileImage) : null) ||
              currentUser?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                `${currentUser?.firstName || "U"} ${currentUser?.lastName || ""}`
              )}&background=0f172a&color=fff`;

            return (
              <button
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <img
                  src={userAvatar}
                  alt={currentUser?.firstName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-200 bg-white"
                  onError={(e) => {
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      `${currentUser?.firstName || "U"} ${currentUser?.lastName || ""}`
                    )}&background=0f172a&color=fff`;
                  }}
                />
                <div className="hidden md:block text-left">
                  <p className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                    {currentUser?.role === "company" && currentUser?.company?.companyName
                      ? currentUser.company.companyName
                      : currentUser?.role}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden md:block" />
              </button>
            );
          })()}

          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">
                  {currentUser?.firstName} {currentUser?.lastName}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
              </div>

              <div className="py-1">
                <Link
                  to={getProfileLink()}
                  onClick={() => setShowProfile(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mon profil</span>
                </Link>
                <Link
                  to="/"
                  className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  <span>Voir le site public</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

