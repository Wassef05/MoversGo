import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Logo2 } from "../common/Logo";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { getLogoUrl } from "../../utils/cn";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  FileSpreadsheet,
  Scale,
  CalendarCheck2,
  MessageSquare,
  CreditCard,
  Star,
  Bell,
  User,
  Settings,
  Truck,
  Calendar,
  FileCheck2,
  BarChart3,
  Users,
  Building2,
  ShieldCheck,
  LifeBuoy,
  LogOut,
  X,
  HelpCircle,
  Sliders,
  Sparkles,
} from "lucide-react";

export function Sidebar({ isOpen, onClose }) {
  const { currentUser, logout } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();
  const role = currentUser?.role || "client";

  // Per-category notification counts from the real-time notification stream
  const unreadList = notifications.filter((n) => !n.isRead && !n.read);

  const quoteNotifs = unreadList.filter((n) =>
    ["quote_submitted", "quote_accepted", "new_quote", "quote_rejected"].includes(n.type)
  ).length;

  const bookingNotifs = unreadList.filter((n) =>
    ["booking_confirmed", "booking_updated", "payment_requested"].includes(n.type)
  ).length;

  const messageNotifs = unreadList.filter((n) => n.type === "new_message").length;

  const pendingCompanyNotifs = unreadList.filter((n) =>
    ["company_registration", "company_rectification"].includes(n.type)
  ).length;

  const clientLinks = [
    { label: "Vue d'ensemble", href: "/client/dashboard", icon: LayoutDashboard },
    { label: "Mes demandes", href: "/client/requests", icon: FileText },
    { label: "Publier un besoin", href: "/client/requests/new", icon: PlusCircle, highlight: true },
    { label: "Devis reçus", href: "/client/quotes", icon: FileSpreadsheet, badge: quoteNotifs },
    { label: "Comparateur de devis", href: "/client/compare", icon: Scale },
    { label: "Mes réservations", href: "/client/bookings", icon: CalendarCheck2, badge: bookingNotifs },
    { label: "Messagerie", href: "/client/messages", icon: MessageSquare, badge: messageNotifs },
    { label: "Paiements & Acomptes", href: "/client/payments", icon: CreditCard },
    { label: "Avis & Retours", href: "/client/reviews", icon: Star },
    { label: "Notifications", href: "/client/notifications", icon: Bell, badge: unreadCount },
    { label: "Mon profil", href: "/client/profile", icon: User },
    { label: "Tickets d'Assistance", href: "/client/support", icon: LifeBuoy },
  ];

  const companyLinks = [
    { label: "Tableau de bord", href: "/company/dashboard", icon: LayoutDashboard },
    {
      label: "Opportunités recommandées",
      href: "/company/recommendations",
      icon: Sparkles,
      highlight: true,
    },
    { label: "Demandes disponibles", href: "/company/requests", icon: FileText },
    { label: "Mes devis émis", href: "/company/quotes", icon: FileSpreadsheet, badge: quoteNotifs },
    { label: "Réservations confirmées", href: "/company/bookings", icon: CalendarCheck2, badge: bookingNotifs },
    { label: "Planning & Calendrier", href: "/company/calendar", icon: Calendar },
    { label: "Messagerie clients", href: "/company/messages", icon: MessageSquare, badge: messageNotifs },
    { label: "Avis & Évaluations", href: "/company/reviews", icon: Star },
    { label: "Dossier & Conformité", href: "/company/documents", icon: FileCheck2 },
    { label: "Statistiques & CA", href: "/company/statistics", icon: BarChart3 },
    { label: "Paiements & Transactions", href: "/company/transactions", icon: CreditCard },
    { label: "Notifications", href: "/company/notifications", icon: Bell, badge: unreadCount },
    { label: "Fiche Entreprise", href: "/company/profile", icon: Building2 },
    { label: "Tickets d'Assistance", href: "/company/support", icon: LifeBuoy },
  ];

  const adminLinks = [
    { label: "Supervision Globale", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Gestion Utilisateurs", href: "/admin/users", icon: Users },
    { label: "Déménageurs Partenaires", href: "/admin/companies", icon: Building2 },
    {
      label: "Dossiers à Valider",
      href: "/admin/companies/pending",
      icon: ShieldCheck,
      highlight: true,
      badge: pendingCompanyNotifs,
    },
    { label: "Demandes Publiées", href: "/admin/requests", icon: FileText },
    { label: "Devis & Offres", href: "/admin/quotes", icon: FileSpreadsheet },
    { label: "Réservations", href: "/admin/bookings", icon: CalendarCheck2, badge: bookingNotifs },
    { label: "Transactions & Commissions", href: "/admin/transactions", icon: CreditCard },
    { label: "Modération Avis", href: "/admin/reviews/moderation", icon: Star },
    { label: "Statistiques Avancées", href: "/admin/analytics", icon: BarChart3 },
    { label: "Support & Litiges", href: "/admin/support", icon: LifeBuoy },
    { label: "Mon Profil Admin", href: "/admin/profile", icon: User },
    { label: "Configuration Système", href: "/admin/settings", icon: Sliders },
  ];

  const links = role === "admin" ? adminLinks : role === "company" ? companyLinks : clientLinks;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-slate-800 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        {/* Top Header */}
        <div>
          <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
            <Logo2 showTagline />
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Role Pill Banner */}
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Espace actif :</span>
            <span className="font-bold uppercase tracking-wider text-brand-400 font-mono text-[11px] bg-brand-950/80 px-2 py-0.5 rounded border border-brand-900">
              {role}
            </span>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-14rem)]">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.href}
                  to={link.href}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${isActive
                      ? "bg-brand-600 text-white shadow-brand shadow-sm font-bold"
                      : link.highlight
                        ? "bg-brand-950/60 text-brand-300 border border-brand-900/60 hover:bg-brand-900/40"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate flex-1">{link.label}</span>
                  {Boolean(link.badge && link.badge > 0) && (
                    <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold px-1.5 shadow-sm">
                      {link.badge > 99 ? "99+" : link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer / User & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            {(() => {
              const userAvatar =
                (currentUser?.role === "company" && currentUser?.company?.logo
                  ? getLogoUrl(currentUser.company.logo)
                  : null) ||
                (currentUser?.profileImage ? getLogoUrl(currentUser.profileImage) : null) ||
                currentUser?.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  `${currentUser?.firstName || "U"} ${currentUser?.lastName || ""}`
                )}&background=1e293b&color=fff`;

              return (
                <div className="flex items-center gap-2.5 truncate">
                  <img
                    src={userAvatar}
                    alt={currentUser?.firstName}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 bg-white"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${currentUser?.firstName || "U"} ${currentUser?.lastName || ""}`
                      )}&background=1e293b&color=fff`;
                    }}
                  />
                  <div className="truncate text-left">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      {currentUser?.role === "company" && currentUser?.company?.companyName
                        ? currentUser.company.companyName
                        : `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{currentUser?.email}</p>
                  </div>
                </div>
              );
            })()}

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Déconnexion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
