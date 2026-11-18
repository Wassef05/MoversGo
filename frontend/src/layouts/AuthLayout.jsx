import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Logo } from "../components/common/Logo";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export function AuthLayout() {
  const location = useLocation();
  const isWidePage =
    location.pathname.includes("/register/company") ||
    location.pathname.includes("/register/client");

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-50/80 py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-[#800020] selection:text-white">
      {/* Subtle architectural background texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #800020 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Return home link */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-white border-2 border-white shadow-sm px-3.5 py-1.5 rounded-full hover:border-[#800020] hover:text-[#800020] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10">
        <Logo showTagline className="justify-center" />
      </div>

      <div
        className={`mt-8 sm:mx-auto sm:w-full transition-all duration-300 relative z-10 ${
          isWidePage ? "sm:max-w-2xl" : "sm:max-w-md"
        }`}
      >
        <div className="bg-white py-8 px-6 sm:px-10 rounded-[2.2rem] border-2 border-slate-200/90 shadow-xl shadow-slate-200/50">
          <Outlet />
        </div>

        {/* Security footer */}
        <div className="mt-6 text-center flex items-center justify-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border-2 border-white shadow-xs text-xs font-mono text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Connexion sécurisée & chiffrée SSL • Conformité INPDP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
