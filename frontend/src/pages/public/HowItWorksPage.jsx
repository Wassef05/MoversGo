import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Truck,
  Building2,
  FileText,
  CreditCard,
  MapPin,
  Sparkles,
  HelpCircle,
  PhoneCall,
  CalendarCheck,
  Check,
} from "lucide-react";

export function HowItWorksPage() {
  return (
    <div className="relative min-h-screen bg-slate-50/70 py-12 selection:bg-[#800020] selection:text-white">
      {/* Subtle architectural background texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #800020 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#800020] text-white border-2 border-white shadow-md text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Guide Officiel MoversGo</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Comment fonctionne la plateforme ?
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Découvrez le déroulement d'un déménagement sécurisé de A à Z : un protocole clair, transparent et sans mauvaise surprise sur toute la Tunisie.
          </p>
        </div>

        {/* Section 1: Le Parcours Particulier */}
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-12 border-2 border-slate-200/90 shadow-sm relative overflow-hidden">
          {/* Top Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#800020] border-2 border-white text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#800020]/20 flex-shrink-0">
                01
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#800020]">
                  Espace Particuliers
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Le parcours client en 3 étapes simples
                </h2>
              </div>
            </div>
            <span className="self-start sm:self-auto text-xs font-mono font-bold px-3.5 py-1.5 rounded-full bg-rose-50 text-[#800020] border border-rose-200">
              Gratuit & Sans engagement
            </span>
          </div>

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            {/* Step 1 */}
            <div className="rounded-3xl p-6 bg-slate-50/80 border-2 border-slate-100 hover:border-[#800020] transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-[#800020] border-2 border-white text-white font-mono font-black text-sm flex items-center justify-center shadow-sm">
                    1
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    ~2 minutes
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#800020] transition-colors">
                  Publication de l'inventaire
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Renseignez vos adresses de départ et d'arrivée, les étages, l'accès ascenseur et vos meubles volumineux. Notre calculateur intelligent calibre instantanément le volume en m³.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-[11px] font-mono text-[#800020]">
                <CheckCircle2 className="w-4 h-4 text-[#800020]" />
                <span>Volume estimé en direct</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-3xl p-6 bg-slate-50/80 border-2 border-slate-100 hover:border-[#800020] transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-[#800020] border-2 border-white text-white font-mono font-black text-sm flex items-center justify-center shadow-sm">
                    2
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    Sous 24h
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#800020] transition-colors">
                  Réception & Comparatif des devis
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Les déménageurs vérifiés analysent votre trajet et soumettent leurs offres chiffrées en Dinars Tunisiens (TND). Comparez les prix, les avis clients et les options de monte-meuble.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-[11px] font-mono text-[#800020]">
                <CheckCircle2 className="w-4 h-4 text-[#800020]" />
                <span>Jusqu'à 5 devis comparables</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-3xl p-6 bg-slate-50/80 border-2 border-slate-100 hover:border-[#800020] transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-[#800020] border-2 border-white text-white font-mono font-black text-sm flex items-center justify-center shadow-sm">
                    3
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    Jour J
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#800020] transition-colors">
                  Validation & Déménagement sécurisé
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Verrouillez votre date avec un acompte réglementé de 30%. Le jour J, l'équipe transporte vos meubles sous contrat d'assurance marchandises avec suivi en temps réel.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-[11px] font-mono text-[#800020]">
                <CheckCircle2 className="w-4 h-4 text-[#800020]" />
                <span>Assurance incluse d'office</span>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="text-center pt-10">
            <Link
              to="/client/requests/new"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-[#800020] hover:bg-[#660019] text-white font-bold text-sm border-2 border-white shadow-xl shadow-[#800020]/25 transition-all hover:-translate-y-0.5"
            >
              <span>Publier mon déménagement gratuitement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Section 2: Le Parcours Déménageur Partenaire */}
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-12 border-2 border-slate-200/90 shadow-sm relative overflow-hidden">
          {/* Top Header Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border-2 border-white text-white flex items-center justify-center font-black text-xl shadow-lg flex-shrink-0">
                02
              </div>
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-slate-600">
                  Espace Entreprises & Artisans
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Le parcours Déménageur Partenaire
                </h2>
              </div>
            </div>
            <span className="self-start sm:self-auto text-xs font-mono font-bold px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
              Aucun abonnement mensuel
            </span>
          </div>

          {/* 3 Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            {/* Step 1 */}
            <div className="rounded-3xl p-6 bg-slate-50/80 border-2 border-slate-100 hover:border-slate-900 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-white text-white font-mono font-black text-sm flex items-center justify-center shadow-sm">
                    1
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    Audit légal
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Vérification du dossier légal
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Soumettez votre extrait RNE officiel, votre matricule fiscal et votre attestation d'assurance professionnelle. Notre équipe conformité valide vos documents sous 24h.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-[11px] font-mono text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Certification RNE obligatoire</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-3xl p-6 bg-slate-50/80 border-2 border-slate-100 hover:border-slate-900 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-white text-white font-mono font-black text-sm flex items-center justify-center shadow-sm">
                    2
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    Mise en relation
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Matching trajets & Retours à vide
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Accédez aux demandes publiées sur vos itinéraires habituels à travers les 24 gouvernorats. Optimisez le taux de remplissage de votre flotte et éliminez les trajets à vide.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-[11px] font-mono text-slate-700">
                <Truck className="w-4 h-4 text-[#800020]" />
                <span>Couverture des 24 gouvernorats</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-3xl p-6 bg-slate-50/80 border-2 border-slate-100 hover:border-slate-900 transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-white text-white font-mono font-black text-sm flex items-center justify-center shadow-sm">
                    3
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 font-semibold">
                    Financier
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Acompte garanti & Commission au succès
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Percevez l'acompte client immédiatement après validation. Commission équitable de 12% prélevée uniquement lors de la signature définitive, sans aucun abonnement préalable.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-[11px] font-mono text-slate-700">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Paiements séquestrés et garantis</span>
              </div>
            </div>
          </div>

          {/* CTA Box */}
          <div className="text-center pt-10">
            <Link
              to="/register/company"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-slate-900 hover:bg-[#800020] text-white font-bold text-sm border-2 border-white shadow-xl transition-all hover:-translate-y-0.5"
            >
              <span>Inscrire mon entreprise de transport</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Section 3: Solid Rouge Bordeaux Assurance Banner */}
        <div className="bg-[#800020] rounded-[2.5rem] p-8 sm:p-12 text-white border-4 border-white shadow-2xl relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
            <div className="space-y-2 border-b md:border-b-0 md:border-r border-rose-900/60 pb-6 md:pb-0 md:pr-6">
              <span className="w-10 h-10 rounded-xl bg-white/10 border-2 border-white flex items-center justify-center font-bold text-white shadow-sm mx-auto md:mx-0">
                <ShieldCheck className="w-5 h-5 text-white" />
              </span>
              <h4 className="font-bold text-base text-white">100% Vérifiés RNE</h4>
              <p className="text-xs text-rose-200 leading-relaxed">
                Chaque entreprise partenaire dispose d'un matricule fiscal vérifié au registre national.
              </p>
            </div>

            <div className="space-y-2 border-b md:border-b-0 md:border-r border-rose-900/60 pb-6 md:pb-0 md:pr-6">
              <span className="w-10 h-10 rounded-xl bg-white/10 border-2 border-white flex items-center justify-center font-bold text-white shadow-sm mx-auto md:mx-0">
                <MapPin className="w-5 h-5 text-white" />
              </span>
              <h4 className="font-bold text-base text-white">24 Gouvernorats</h4>
              <p className="text-xs text-rose-200 leading-relaxed">
                Mise en relation sur l'ensemble du territoire tunisien du Nord au Sud sans zone blanche.
              </p>
            </div>

            <div className="space-y-2 border-b md:border-b-0 md:border-r border-rose-900/60 pb-6 md:pb-0 md:pr-6">
              <span className="w-10 h-10 rounded-xl bg-white/10 border-2 border-white flex items-center justify-center font-bold text-white shadow-sm mx-auto md:mx-0">
                <Clock className="w-5 h-5 text-white" />
              </span>
              <h4 className="font-bold text-base text-white">Devis sous 24h</h4>
              <p className="text-xs text-rose-200 leading-relaxed">
                Recevez rapidement vos offres détaillées pour organiser votre déménagement en toute quiétude.
              </p>
            </div>

            <div className="space-y-2">
              <span className="w-10 h-10 rounded-xl bg-white/10 border-2 border-white flex items-center justify-center font-bold text-white shadow-sm mx-auto md:mx-0">
                <PhoneCall className="w-5 h-5 text-white" />
              </span>
              <h4 className="font-bold text-base text-white">Support Dédié 7j/7</h4>
              <p className="text-xs text-rose-200 leading-relaxed">
                Nos coordinateurs basés à Tunis répondent à vos questions techniques et administratives.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
