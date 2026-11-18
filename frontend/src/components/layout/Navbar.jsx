import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Logo } from "../common/Logo";
import { useAuth } from "../../contexts/AuthContext";
import { initSocket } from "../../services/api/socket";
import {
  Menu,
  X,
  ArrowRight,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  MessageSquare,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────
   MoversGo — Navbar
   • Real-time message notification badge via Socket.IO
   • Message bell icon with unread count badge
   • Sticky with blur backdrop & subtle border
───────────────────────────────────────────────────────────────*/
export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { currentUser, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Real-time message notification via Socket.IO ──
  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = initSocket();
    if (!socket) return;

    const handleMessageReceived = () => {
      // Increment unread badge when receiving a message
      setUnreadMessages((prev) => prev + 1);
    };

    socket.on("message:received", handleMessageReceived);

    return () => {
      socket.off("message:received", handleMessageReceived);
    };
  }, [isAuthenticated]);

  // Reset unread badge when user visits messages page
  useEffect(() => {
    if (location.pathname.includes("/messages")) {
      setUnreadMessages(0);
    }
  }, [location.pathname]);

  const getMessagesPath = () => {
    if (!currentUser) return "/login";
    if (currentUser.role === "company") return "/company/messages";
    if (currentUser.role === "client") return "/client/messages";
    return "/";
  };

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "Déménagements", href: "/demenagements" },
    { label: "Nos déménageurs", href: "/companies" },
    { label: "Comment ça marche", href: "/how-it-works" },
    { label: "Contact", href: "/contact" },
  ];

  const getDashboardPath = () => {
    if (!currentUser) return "/login";
    if (currentUser.role === "admin") return "/admin/dashboard";
    if (currentUser.role === "company") return "/company/dashboard";
    return "/client/dashboard";
  };

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
          ? "bg-blur/45 backdrop-blur-xl shadow-[0_10px_30px_-10px_rgba(15,23,42,0.08)] border-b border-slate-200/70 py-0.5"
          : "bg-blur/45 backdrop-blur-md border-b border-slate-100 py-1"
          }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* ── Logo ── */}
            <Logo showTagline className="flex-shrink-0" />

            {/* ── Desktop Nav (Single line, strictly no wrapping) ── */}
            <nav className="hidden lg:flex items-center gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/60 flex-shrink-0 flex-nowrap whitespace-nowrap">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  to={link.href}
                  end={link.href === "/"}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-xl text-[13px] font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${isActive
                      ? "text-[#800020] bg-white shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* ── Desktop Actions ── */}
            <div className="hidden lg:flex items-center gap-2 flex-shrink-0 flex-nowrap whitespace-nowrap">
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  {/* ── Message Bell with unread badge ── */}
                  {(currentUser?.role === "client" || currentUser?.role === "company") && (
                    <Link
                      to={getMessagesPath()}
                      title="Messagerie"
                      className="relative p-2 rounded-xl text-slate-500 hover:text-[#800020] hover:bg-rose-50 border border-transparent hover:border-rose-200/50 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {unreadMessages > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#800020] text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm animate-bounce">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link
                    to={getDashboardPath()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-white hover:border-slate-300 transition-all shadow-xs"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-[#800020]" />
                    <span>{currentUser?.firstName || "Mon espace"}</span>
                  </Link>
                  {currentUser?.role === "client" && (
                    <Link
                      to="/client/requests/new"
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold bg-[#800020] hover:bg-[#660019] text-white border-2 border-white transition-all shadow-md shadow-[#800020]/20 hover:-translate-y-0.5"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Nouveau devis</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    title="Déconnexion"
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-3.5 py-2 rounded-xl text-[12px] font-bold text-slate-700 hover:text-[#800020] hover:bg-slate-100 transition-all"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="px-3.5 py-2 rounded-xl text-[12px] font-bold text-slate-700 hover:text-[#800020] hover:bg-slate-100 transition-all"
                  >
                    Inscription
                  </Link>
                  <Link
                    to="/client/requests/new"
                    className="group flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold bg-[#800020] hover:bg-[#660019] text-white border-2 border-white transition-all shadow-md shadow-[#800020]/20 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <span>Devis gratuit</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </div>

            {/* ── Mobile trigger ── */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Mobile message bell */}
              {isAuthenticated && (currentUser?.role === "client" || currentUser?.role === "company") && (
                <Link
                  to={getMessagesPath()}
                  className="relative p-1.5 rounded-lg text-slate-500 hover:text-[#800020] hover:bg-rose-50 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-[#800020] text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                      {unreadMessages > 9 ? "9+" : unreadMessages}
                    </span>
                  )}
                </Link>
              )}
              <Link
                to="/client/requests/new"
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-[#800020] text-white border-2 border-white shadow-xs"
              >
                Devis
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* ── Mobile Drawer ── */}
        {mobileMenuOpen && (
          <div className="relative z-40 lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-5 space-y-1 shadow-xl">
            {navLinks.map((link) => (
              <NavLink
                key={link.href}
                to={link.href}
                end={link.href === "/"}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${isActive
                    ? "bg-rose-50 text-[#800020] font-bold"
                    : "text-slate-700 hover:bg-slate-50"
                  }`
                }
              >
                <span>{link.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
              </NavLink>
            ))}

            <div className="pt-2 border-t border-slate-100 space-y-2">
              {isAuthenticated ? (
                <>
                  {(currentUser?.role === "client" || currentUser?.role === "company") && (
                    <Link
                      to={getMessagesPath()}
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-[#800020] bg-rose-50 border border-rose-200 relative"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Messagerie</span>
                      {unreadMessages > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#800020] text-white text-[10px] font-bold">
                          {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-slate-900 text-white"
                  >
                    <LayoutDashboard className="w-4 h-4 text-rose-300" />
                    <span>Mon Espace ({currentUser?.firstName})</span>
                  </Link>
                  {currentUser?.role === "client" && (
                    <Link
                      to="/client/requests/new"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#800020] text-white border-2 border-white shadow-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Nouveau devis</span>
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full py-2.5 text-center text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/client/requests/new"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#800020] text-white border-2 border-white shadow-sm"
                  >
                    <span>Obtenir mon devis gratuit</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2.5 rounded-xl text-sm font-semibold text-slate-800 border border-slate-200"
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center py-2.5 rounded-xl text-sm font-semibold text-slate-900 bg-slate-100"
                    >
                      Inscription
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
