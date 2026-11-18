import React from "react";
import { Link } from "react-router-dom";
import {
  Check,
  ArrowRight,
  ShieldCheck,
  Calculator,
  Sparkles,
  Truck,
  UserCheck,
  HelpCircle,
  Coins,
  BadgePercent,
} from "lucide-react";

export function PricingPage() {
  const tiers = [
    {
      title: "Particuliers & Familles",
      price: "100% Gratuit",
      period: "Pour tous vos déménagements",
      subtitle: "Sans engagement ni carte bancaire pour recevoir vos devis",
      popular: true,
      badge: "Formule Recommandée",
      features: [
        "Publication illimitée de demandes de déménagement",
        "Calculateur automatique de volume en m³ (S+1, S+2, S+3, Villa)",
        "Réception jusqu'à 5 devis comparatifs détaillés en Dinars (DT)",
        "Garantie déménageurs certifiés RNE avec agrément Ministère du Transport",
        "Assistance téléphonique basée à Tunis 7j/7",
        "Acompte de 30% consigné sous séquestre sécurisé",
      ],
      ctaText: "Créer ma demande gratuite",
      ctaLink: "/client/requests/new",
      ctaClass: "bg-[#800020] hover:bg-[#660019] text-white border-2 border-white shadow-xl shadow-[#800020]/25",
    },
    {
      title: "Sociétés de Déménagement Agréées",
      price: "12% de commission",
      period: "Uniquement au succès",
      subtitle: "Prélevée uniquement lorsque le client accepte et valide votre devis",
      popular: false,
      badge: "Transporteur Partenaire",
      features: [
        "Zéro abonnement mensuel ni frais fixes d'inscription",
        "Accès en temps réel à toutes les demandes sur les 24 gouvernorats",
        "Émission illimitée de devis chiffrés personnalisés",
        "Badge officiel 'Certifié MoversGo Tunisie' après audit RNE",
        "Paiement des acomptes garanti sous 48h par virement bancaire",
        "Outils complets de gestion de plannings et feuilles de route",
      ],
      ctaText: "Rejoindre le réseau officiel",
      ctaLink: "/register/company",
      ctaClass: "bg-slate-900 hover:bg-[#800020] text-white border-2 border-white shadow-xl",
    },
  ];

  const benchmarks = [
    {
      type: "Studio / S+0",
      volume: "10 à 15 m³",
      local: "220 DT - 380 DT",
      national: "550 DT - 850 DT",
      truck: "Fourgonnette 12m³",
      crew: "2 déménageurs",
    },
    {
      type: "Appartement S+1 / S+2",
      volume: "20 à 30 m³",
      local: "380 DT - 650 DT",
      national: "780 DT - 1 200 DT",
      truck: "Camion 20-30m³",
      crew: "3 déménageurs",
    },
    {
      type: "Grand Appartement S+3 / S+4",
      volume: "35 à 50 m³",
      local: "650 DT - 1 000 DT",
      national: "1 100 DT - 1 650 DT",
      truck: "Camion 35-50m³",
      crew: "4 déménageurs + Monte-meuble",
    },
    {
      type: "Villa / Maison individuelle",
      volume: "60 à 90 m³",
      local: "1 100 DT - 1 800 DT",
      national: "1 800 DT - 2 800 DT",
      truck: "Poids lourd / Flotte",
      crew: "5+ déménageurs spécialisés",
    },
  ];

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

      <div className="relative max-w-7xl mx-auto space-y-16 z-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#800020] text-white border-2 border-white shadow-md text-xs font-mono font-bold uppercase tracking-wider">
            <Coins className="w-3.5 h-3.5" />
            <span>Transparence & Prix Justes en Dinars Tunisiens</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Tarification claire, sans mauvaise surprise
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            100% gratuit et sans commission pour les particuliers. Un modèle vertueux à la commission de succès pour les professionnels du déménagement.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {tiers.map((t, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-[2.5rem] p-8 sm:p-10 border-2 transition-all duration-300 flex flex-col justify-between relative shadow-sm ${
                t.popular
                  ? "border-[#800020] shadow-xl shadow-[#800020]/10"
                  : "border-slate-200/90 hover:border-slate-900"
              }`}
            >
              {t.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#800020] text-white px-4 py-1 rounded-full text-xs font-mono font-bold tracking-wide shadow-md border-2 border-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.badge}</span>
                </div>
              )}

              <div>
                {!t.popular && (
                  <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1 rounded-full mb-3 border border-slate-200">
                    {t.badge}
                  </span>
                )}

                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t.subtitle}</p>

                <div className="my-6 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100">
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {t.price}
                  </div>
                  <p className="text-xs font-mono font-semibold text-slate-500 mt-1">{t.period}</p>
                </div>

                <ul className="space-y-3 text-xs sm:text-sm text-slate-600">
                  {t.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-200">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to={t.ctaLink}
                  className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 ${t.ctaClass}`}
                >
                  <span>{t.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Benchmark Table in Dinars */}
        <div className="bg-white rounded-[2.5rem] p-7 sm:p-10 border-2 border-slate-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#800020] border-2 border-white text-white flex items-center justify-center shadow-md flex-shrink-0">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Baromètre tarifaire moyen en Tunisie
                </h2>
                <p className="text-xs text-slate-500">
                  Moyennes constatées sur les devis validés MoversGo selon le logement et la distance
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-bold self-start sm:self-auto">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Devis Fermes & Détaillés</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                  <th className="py-3.5 px-4 rounded-l-xl">Logement</th>
                  <th className="py-3.5 px-4">Volume estimé</th>
                  <th className="py-3.5 px-4">Local (Grand Tunis ou intra-ville)</th>
                  <th className="py-3.5 px-4">Longue Distance (Tunis ➔ Régions)</th>
                  <th className="py-3.5 px-4 rounded-r-xl">Moyens recommandés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {benchmarks.map((row, i) => (
                  <tr key={i} className="hover:bg-rose-50/20 transition-colors">
                    <td className="py-4 px-4 font-bold text-slate-900">
                      {row.type}
                    </td>
                    <td className="py-4 px-4 text-slate-600 font-mono">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200">
                        {row.volume}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-black text-[#800020] font-mono">
                      {row.local}
                    </td>
                    <td className="py-4 px-4 font-black text-slate-900 font-mono">
                      {row.national}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">{row.truck}</span> • {row.crew}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 border-t border-slate-100">
            <p>
              * Ces montants sont indicatifs et varient selon les étages sans ascenseur, le besoin d'un monte-charge et les options d'emballage.
            </p>
            <Link
              to="/client/requests/new"
              className="text-[#800020] font-bold hover:underline inline-flex items-center gap-1"
            >
              <span>Calculer mon devis exact gratuitement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
