import React from "react";
import { Link } from "react-router-dom";
import { Logo } from "../common/Logo";
import { Logo2 } from "../common/Logo";
import { APP_CONFIG } from "../../config/appConfig";
import { Mail, Phone, MapPin, ShieldCheck, Clock, Heart, Award, FileCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 text-slate-300 border-t border-slate-800/80 overflow-hidden">
      {/* Ambient gradient orbs for depth */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-10 w-[500px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Banner / Trust in Tunisia */}
      <div className="border-b border-slate-800/60 bg-white/[0.02] backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#800020] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-tight">100% Transporteurs Agréés</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">Agrément Ministère du Transport & Assurances STAR/COMAR</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-tight">Devis Gratuits sous 2h</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">Jusqu'à 5 propositions détaillées en DT, sans engagement</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-[#800020] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-tight">24 Gouvernorats Couverts</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">Grand Tunis, Sahel, Cap Bon, Sfax, Bizerte, Sud...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Logo2 isLight showTagline />
            <p className="text-sm text-slate-300 leading-relaxed pr-6 font-light">
              {APP_CONFIG.description}
            </p>
            <div className="space-y-2.5 pt-2 text-xs">
              <p className="flex items-center gap-2.5 text-slate-300">
                <MapPin className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>{APP_CONFIG.contact.address}</span>
              </p>
              <p className="flex items-center gap-2.5 text-slate-300">
                <Phone className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>{APP_CONFIG.contact.phone} • Mobile : {APP_CONFIG.contact.mobilePhone}</span>
              </p>
              <p className="flex items-center gap-2.5 text-slate-300">
                <Mail className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span>{APP_CONFIG.contact.email}</span>
              </p>
              <p className="text-[11px] text-slate-400 font-mono pt-1">
                Matricule Fiscal : {APP_CONFIG.taxId} • RNE : {APP_CONFIG.rneNumber}
              </p>
            </div>
          </div>

          {/* Particuliers */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-widest uppercase mb-4 text-brand-300">
              Particuliers
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/client/requests/new" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                  <span>Demander un devis gratuit</span>
                </Link>
              </li>
              <li>
                <Link to="/demenagements" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  <span>Missions & Déménagements</span>
                </Link>
              </li>
              <li>
                <Link to="/companies" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Annuaire des déménageurs</span>
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Comment ça marche</span>
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Tarifs indicatifs en DT</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Entreprises / Partenaires */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-widest uppercase mb-4 text-emerald-400">
              Transporteurs Pro
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/register/company" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>Rejoindre le réseau agréé</span>
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Espace Transporteur Pro</span>
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Modèle sans abonnement (12%)</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span>Support Partenaires</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal & Régions */}
          <div>
            <h4 className="text-xs font-bold text-white tracking-widest uppercase mb-4 text-indigo-300">
              Régions Desservies
            </h4>
            <div className="flex flex-wrap gap-1.5 text-[11px] mb-4">
              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">Grand Tunis</span>
              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">Sousse</span>
              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">Monastir</span>
              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">Sfax</span>
              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">Nabeul</span>
              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">Hammamet</span>
              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">Bizerte</span>
              <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300">Djerba</span>
            </div>
            <div className="pt-2 space-y-1">
              <Link to="/legal/terms" className="text-xs text-slate-400 hover:text-white block transition-colors">
                Conditions Générales (CGU)
              </Link>
              <Link to="/legal/privacy" className="text-xs text-slate-400 hover:text-white block transition-colors">
                Protection des données (INPDP)
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} {APP_CONFIG.legalName}. Conçu et opéré en Tunisie 🇹🇳.</p>
          <div className="flex items-center gap-6">
            <Link to="/legal/privacy" className="hover:text-white transition-colors">Vie privée & Données</Link>
            <Link to="/legal/terms" className="hover:text-white transition-colors">Mentions Légales RNE</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Centre d'aide</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
