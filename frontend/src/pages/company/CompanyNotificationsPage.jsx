import React from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import { Bell, Check, ArrowRight, Building2, FileText, MessageSquare, CalendarCheck2, Star, ShieldCheck } from "lucide-react";

function resolveCompanyLink(n) {
  const rawLink = n?.link || n?.relatedEntity?.link;
  if (rawLink) {
    if (
      rawLink.startsWith("/client/") ||
      rawLink.startsWith("/company/") ||
      rawLink.startsWith("/admin/")
    )
      return rawLink;
    if (rawLink.startsWith("/quotes/"))
      return `/company/quotes/${rawLink.replace("/quotes/", "")}`;
    if (rawLink === "/quotes") return `/company/quotes`;
    if (rawLink.startsWith("/bookings/"))
      return `/company/bookings/${rawLink.replace("/bookings/", "")}`;
    if (rawLink === "/bookings") return `/company/bookings`;
    if (rawLink.startsWith("/messages/"))
      return `/company/messages/${rawLink.replace("/messages/", "")}`;
    if (rawLink === "/messages") return `/company/messages`;
    if (rawLink.startsWith("/requests/"))
      return `/company/requests/${rawLink.replace("/requests/", "")}`;
    if (rawLink === "/requests") return `/company/requests`;
    if (rawLink === "/company/reviews") return `/company/reviews`;
    return rawLink;
  }
  const eType = n?.entityType || n?.type || "";
  const eId = n?.entityId;
  if (eType.includes("quote")) return eId ? `/company/quotes/${eId}` : "/company/quotes";
  if (eType.includes("message")) return eId ? `/company/messages/${eId}` : "/company/messages";
  if (eType.includes("booking") || eType.includes("payment"))
    return eId ? `/company/bookings/${eId}` : "/company/bookings";
  if (eType.includes("request")) return eId ? `/company/requests/${eId}` : "/company/requests";
  if (eType.includes("review")) return "/company/reviews";
  return "/company/dashboard";
}

function getNotifIcon(type) {
  if (!type) return <Bell className="w-4 h-4 text-brand-500" />;
  if (type.includes("quote")) return <FileText className="w-4 h-4 text-indigo-500" />;
  if (type.includes("booking") || type.includes("payment")) return <CalendarCheck2 className="w-4 h-4 text-emerald-500" />;
  if (type.includes("message")) return <MessageSquare className="w-4 h-4 text-sky-500" />;
  if (type.includes("review")) return <Star className="w-4 h-4 text-amber-500" />;
  if (type.includes("company") || type.includes("approved")) return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
  return <Bell className="w-4 h-4 text-brand-500" />;
}

export function CompanyNotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500">Mises à jour sur vos devis, réservations et messages clients</p>
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
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-500 font-semibold text-sm">Aucune notification</p>
            <p className="text-xs text-slate-400 mt-1">Vous serez notifié ici dès qu'un client interagit avec vous.</p>
          </div>
        ) : (
          notifications.map((n) => {
            const nId = n._id || n.id;
            const isRead = n.read ?? n.isRead;
            const resolvedLink = resolveCompanyLink(n);
            const icon = getNotifIcon(n.type);
            return (
              <div
                key={nId}
                onClick={() => {
                  markAsRead(nId);
                  if (resolvedLink) navigate(resolvedLink);
                }}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${
                  !isRead ? "bg-brand-50/20" : ""
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Unread dot */}
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${
                      !isRead ? "bg-brand-600" : "bg-slate-300"
                    }`}
                  />
                  {/* Icon */}
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
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

