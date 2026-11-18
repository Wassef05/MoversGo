import React from "react";
import { Link } from "react-router-dom";
import { User, Building2, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";

export function RegisterSelectPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200 inline-block mb-1">
          Inscription Gratuite
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Créer un compte</h2>
        <p className="text-xs text-slate-500">Choisissez votre profil pour commencer sur MoversGo</p>
      </div>

      <div className="space-y-4">
        {/* Option 1: Particulier */}
        <Link
          to="/register/client"
          className="p-5 rounded-2xl border-2 border-slate-200 hover:border-[#800020] hover:bg-rose-50/20 transition-all flex items-start gap-4 group text-left block bg-white shadow-xs"
        >
          <div className="w-12 h-12 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#800020] transition-colors">
                Je suis un particulier
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#800020] group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Je souhaite publier mon projet de déménagement, recevoir des devis gratuits et comparer les prix sans aucun engagement.
            </p>
          </div>
        </Link>

        {/* Option 2: Entreprise */}
        <Link
          to="/register/company"
          className="p-5 rounded-2xl border-2 border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all flex items-start gap-4 group text-left block bg-white shadow-xs"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-105">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-900 transition-colors">
                Je suis une entreprise
              </h3>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Société de déménagement titulaire d'une licence ou extrait RNE. Je souhaite développer mon chiffre d'affaires et remplir mes camions.
            </p>
          </div>
        </Link>
      </div>

      <div className="text-center pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="font-bold text-[#800020] hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
