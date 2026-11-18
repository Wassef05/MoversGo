import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Home, Truck } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-100">
          <Truck className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="text-4xl font-extrabold text-brand-600 font-mono">404</span>
          <h1 className="text-xl font-bold text-slate-900">Page introuvable</h1>
          <p className="text-xs text-slate-500">
            La page que vous recherchez a peut-être été déplacée ou n'existe plus.
          </p>
        </div>
        <Link
          to="/"
          className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Retourner à l'accueil MoversGo</span>
        </Link>
      </div>
    </div>
  );
}

