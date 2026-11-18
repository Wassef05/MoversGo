import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Home } from "lucide-react";

export function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <span className="text-4xl font-extrabold text-rose-600 font-mono">403</span>
          <h1 className="text-xl font-bold text-slate-900">Accès non autorisé</h1>
          <p className="text-xs text-slate-500">
            Votre profil ne dispose pas des privilèges nécessaires pour accéder à cette interface.
          </p>
        </div>
        <Link
          to="/"
          className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Retourner à l'accueil</span>
        </Link>
      </div>
    </div>
  );
}

