import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  Search,
  HelpCircle,
  Phone,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  FileQuestion,
  Headphones,
} from "lucide-react";

export function FaqPage() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const faqs = [
    {
      category: "Demande & Devis",
      items: [
        {
          q: "Comment calculer précisément le volume en m³ de mon logement ?",
          a: "Notre formulaire de demande intègre un calculateur d'inventaire automatique. En cochant vos meubles et le nombre de pièces (S+1, S+2, S+3, Villa), nous calculons automatiquement le cubage en mètres cubes pour calibrer le camion et le nombre de déménageurs adéquats.",
        },
        {
          q: "Sous quel délai reçois-je mes premiers devis ?",
          a: "Les premières propositions détaillées des déménageurs partenaires parviennent généralement dans les 2 à 4 heures suivant la mise en ligne de votre demande.",
        },
        {
          q: "Puis-je modifier ma demande après sa publication ?",
          a: "Oui, tant que vous n'avez pas accepté d'offre définitive, vous pouvez modifier vos dates, adresses de départ/arrivée ou votre inventaire directement depuis votre espace client.",
        },
      ],
    },
    {
      category: "Paiements & Sécurité",
      items: [
        {
          q: "Quel est le montant de l'acompte et comment est-il protégé ?",
          a: "L'acompte de réservation est fixé à 30% du montant total du devis. Il est consigné sur notre compte séquestre sécurisé MoversGo Tunisie et n'est débloqué au transporteur qu'une fois la prestation lancée.",
        },
        {
          q: "Comment est réglé le solde de la prestation ?",
          a: "Le solde restant (70%) est payé directement auprès du chef d'équipe le jour du déchargement, après vérification de l'état de l'ensemble de vos biens et signature de la lettre de voiture.",
        },
        {
          q: "Que se passe-t-il en cas d'annulation ?",
          a: "Une annulation effectuée plus de 14 jours avant la date prévue donne droit au remboursement intégral de l'acompte consigné.",
        },
      ],
    },
    {
      category: "Assurances & Garanties",
      items: [
        {
          q: "Quelles sont les garanties incluses en cas de casse ?",
          a: "Toutes nos entreprises partenaires ont l'obligation légale de souscrire une assurance marchandises transportées. En cas de dommage avéré, une déclaration immédiate est établie sur la lettre de voiture pour indemnisation rapide par l'assureur du transporteur.",
        },
        {
          q: "Que couvre l'assurance responsabilité civile professionnelle ?",
          a: "Elle couvre les dommages éventuels causés aux parties communes des immeubles (murs de la cage d'escalier, ascenseur, parquet, portes d'entrée) lors des opérations de manutention.",
        },
      ],
    },
  ];

  const filteredCategories = faqs
    .filter((cat) => selectedCategory === "all" || cat.category === selectedCategory)
    .map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.a.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((cat) => cat.items.length > 0);

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

      <div className="relative max-w-5xl mx-auto space-y-12 z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#800020] text-white border-2 border-white shadow-md text-xs font-mono font-bold uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Centre d'Aide & Foire Aux Questions</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Tout ce que vous devez savoir
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Retrouvez des réponses précises sur le calcul du cubage, la consignation de l'acompte et les garanties d'assurance en Tunisie.
          </p>
        </div>

        {/* Search Input Container */}
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher une question (acompte, assurance, volume m³, devis)..."
              className="w-full pl-12 pr-24 py-3.5 rounded-2xl bg-white border-2 border-slate-200 shadow-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 px-2.5 py-1 rounded-xl"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === "all"
                  ? "bg-[#800020] text-white border-2 border-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-[#800020]"
              }`}
            >
              Toutes les catégories
            </button>
            {faqs.map((f, i) => (
              <button
                key={i}
                onClick={() => setSelectedCategory(f.category)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedCategory === f.category
                    ? "bg-[#800020] text-white border-2 border-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:border-[#800020]"
                }`}
              >
                {f.category}
              </button>
            ))}
          </div>
        </div>

        {/* Categories and Accordion */}
        <div className="space-y-10">
          {filteredCategories.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-slate-200 max-w-lg mx-auto space-y-3">
              <FileQuestion className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">Aucun résultat trouvé</h3>
              <p className="text-xs text-slate-500">
                Aucune question ne correspond à votre recherche "{searchTerm}".
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
                className="text-xs font-bold text-[#800020] hover:underline pt-2 inline-block"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            filteredCategories.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#800020]" />
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {cat.category}
                  </h2>
                </div>

                <div className="space-y-3">
                  {cat.items.map((item, itemIdx) => {
                    const key = `${catIdx}-${itemIdx}`;
                    const isOpen = activeFaq === key;
                    return (
                      <div
                        key={key}
                        className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
                          isOpen
                            ? "border-[#800020] shadow-md shadow-[#800020]/5"
                            : "border-slate-200/90 shadow-xs hover:border-slate-300"
                        }`}
                      >
                        <button
                          onClick={() => setActiveFaq(isOpen ? null : key)}
                          className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 hover:text-[#800020] transition-colors gap-4"
                        >
                          <span className="text-sm sm:text-base leading-snug">{item.q}</span>
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                              isOpen
                                ? "bg-[#800020] text-white rotate-180 border-2 border-white shadow-xs"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                            {item.a}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Solid Rouge Bordeaux Support Banner with White Contour */}
        <div className="bg-[#800020] rounded-[2.5rem] p-8 sm:p-10 text-white border-4 border-white shadow-2xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative z-10 space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white text-[11px] font-mono font-bold border border-white/20">
              <Headphones className="w-3.5 h-3.5" />
              <span>Assistance Directe • 7j/7</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">
              Vous avez une question spécifique sur votre déménagement ?
            </h3>
            <p className="text-xs sm:text-sm text-rose-100 max-w-lg">
              Nos coordinateurs basés à Tunis répondent à toutes vos interrogations techniques et logistiques sans engagement.
            </p>
          </div>

          <Link
            to="/contact"
            className="relative z-10 px-7 py-4 rounded-2xl bg-white text-[#800020] hover:bg-rose-50 transition-all font-black text-xs sm:text-sm whitespace-nowrap shadow-xl border-2 border-white flex items-center gap-2 group hover:-translate-y-0.5"
          >
            <span>Contacter un conseiller</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
