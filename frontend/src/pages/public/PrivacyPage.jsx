import React from "react";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "../../config/appConfig";
import { ShieldCheck, Lock, Eye, FileText, ArrowRight, CheckCircle2 } from "lucide-react";

export function PrivacyPage() {
  return (
    <div className="relative min-h-screen bg-slate-50/70 py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#800020] selection:text-white">
      {/* Subtle architectural background texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #800020 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-4xl mx-auto space-y-8 z-10">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Link to="/" className="hover:text-[#800020] transition-colors">Accueil</Link>
          <span className="text-slate-300">/</span>
          <span className="text-slate-900 font-bold">Politique de Confidentialité</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border-2 border-slate-200/90 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#800020] text-white border-2 border-white shadow-md text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Conformité Loi N° 2004-63 & INPDP Tunisie</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Politique de Confidentialité & Protection des Données
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-mono">
            {APP_CONFIG.name} s'engage formellement à garantir la confidentialité, la sécurité et la traçabilité de toutes les données personnelles collectées lors de vos démarches de déménagement en Tunisie.
          </p>
        </div>

        {/* Structured Sections */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                01
              </span>
              <span>Responsable de traitement des données</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-11">
              Le traitement de vos données à caractère personnel est assuré par <strong>{APP_CONFIG.legalName}</strong>, domicilié au <strong>{APP_CONFIG.contact.address}</strong>. Notre délégué à la protection des données veille au strict respect des directives de l'Instance Nationale de Protection des Données Personnelles (INPDP).
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                02
              </span>
              <span>Données collectées et finalités</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-11">
              Nous collectons exclusivement les données requises pour la bonne exécution des prestations de déménagement : adresses postales de chargement et de déchargement, téléphone, nom, inventaire des biens et photographies facultatives.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                03
              </span>
              <span>Transmission sécurisée aux transporteurs certifiés</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-11">
              Vos coordonnées téléphoniques et adresses précises ne sont révélées qu'au transporteur dont vous avez expressément validé le devis. Aucun déménageur non retenu n'a accès à vos coordonnées directes.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                04
              </span>
              <span>Vos droits d'accès, de rectification et d'effacement</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-11">
              Conformément à la loi tunisienne, vous disposez d'un droit permanent d'accès, de rectification et de suppression de vos données personnelles sur simple demande par courriel à <strong>{APP_CONFIG.contact.email}</strong>.
            </p>
          </div>
        </div>

        {/* Terms Link */}
        <div className="pt-4 text-center">
          <Link
            to="/terms"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#800020] transition-colors"
          >
            <span>Consulter les Conditions Générales d'Utilisation (CGU)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
