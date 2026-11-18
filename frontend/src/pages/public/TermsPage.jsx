import React from "react";
import { Link } from "react-router-dom";
import { APP_CONFIG } from "../../config/appConfig";
import { FileText, ShieldCheck, ArrowRight, Scale, CheckCircle2 } from "lucide-react";

export function TermsPage() {
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
          <span className="text-slate-900 font-bold">Conditions Générales d'Utilisation</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-[2.5rem] p-8 sm:p-10 border-2 border-slate-200/90 shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#800020] text-white border-2 border-white shadow-md text-xs font-mono font-bold uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            <span>Cadre Réglementaire & Contractuel Tunisie</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Conditions Générales d'Utilisation (CGU)
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-mono">
            Dernière mise à jour : Janvier 2026 • Encadrement des relations entre particuliers, professionnels agréés et la plateforme {APP_CONFIG.name}.
          </p>
        </div>

        {/* Articles List */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                01
              </span>
              <span>Présentation de la plateforme</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-11">
              La plateforme <strong>{APP_CONFIG.name}</strong>, éditée par la société <strong>{APP_CONFIG.legalName}</strong>, est une marketplace technique ayant pour vocation la mise en relation entre des particuliers (« Clients ») et des professionnels certifiés du transport de marchandises et du déménagement (« Entreprises Partenaires »).
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                02
              </span>
              <span>Rôle d'intermédiation et tiers de confiance</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-11">
              {APP_CONFIG.name} intervient en qualité de tiers de confiance et courtier digital. Le contrat d'exécution de déménagement, la lettre de voiture et l'assurance de transport sont conclus directement entre le Client et l'Entreprise Partenaire sélectionnée.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                03
              </span>
              <span>Gratuité du service pour les clients</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-11">
              La création de compte, le dépôt de demandes de devis, le calcul du cubage et la mise en concurrence des offres sont entièrement gratuits et sans engagement pour les clients particuliers.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                04
              </span>
              <span>Modalités de paiement de l'acompte (30%) et du solde (70%)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-11">
              Pour valider un devis et garantir la réservation du camion et de l'équipe de déménagement, le Client règle un acompte forfaitaire de 30% lors de la confirmation en ligne. Cet acompte est consigné sous séquestre sécurisé. Le solde de 70% est versé à la livraison de vos meubles.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-sm space-y-3">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-[#800020] border-2 border-white text-white flex items-center justify-center text-xs font-mono font-bold shadow-xs">
                05
              </span>
              <span>Droit d'annulation et politique de remboursement</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-11">
              Le Client dispose de la faculté d'annuler sa réservation sans frais jusqu'à 14 jours calendaires avant la date d'exécution prévue. Passé ce délai, des frais d'immobilisation de camion peuvent être retenus conformément aux conditions de l'entreprise partenaire.
            </p>
          </div>
        </div>

        {/* Privacy Link */}
        <div className="pt-4 text-center">
          <Link
            to="/privacy"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#800020] transition-colors"
          >
            <span>Consulter la Politique de Confidentialité & INPDP</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
