import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { companyService } from "../../services/api/companyService";
import { dataService } from "../../services/mock/dataService";
import { RatingStars } from "../../components/common/RatingStars";
import {
  Search,
  MapPin,
  ShieldCheck,
  ArrowRight,
  X,
  Check,
  ChevronDown,
  Navigation,
  Globe,
} from "lucide-react";

// The 24 official governorates of Tunisia grouped by geographic region
export const TUNISIA_REGIONS = [
  {
    name: "Grand Tunis",
    governorates: ["Tunis", "Ariana", "Ben Arous", "Manouba"],
  },
  {
    name: "Nord-Est & Cap Bon",
    governorates: ["Nabeul", "Bizerte", "Zaghouan"],
  },
  {
    name: "Nord-Ouest",
    governorates: ["Béja", "Jendouba", "Le Kef", "Siliana"],
  },
  {
    name: "Sahel",
    governorates: ["Sousse", "Monastir", "Mahdia"],
  },
  {
    name: "Centre & Sfax",
    governorates: ["Sfax", "Kairouan", "Sidi Bouzid", "Kasserine"],
  },
  {
    name: "Sud",
    governorates: ["Gabès", "Médenine", "Tataouine", "Gafsa", "Tozeur", "Kébili"],
  },
];

export const ALL_24_GOVERNORATES = TUNISIA_REGIONS.flatMap((r) => r.governorates);

// Quick popular tabs for instant 1-click filtering
const QUICK_HUBS = [
  { label: "Tous (24)", value: "all" },
  { label: "Grand Tunis", value: "Grand Tunis" },
  { label: "Sousse & Sahel", value: "Sahel" },
  { label: "Sfax", value: "Sfax" },
  { label: "Nabeul", value: "Nabeul" },
  { label: "Bizerte", value: "Bizerte" },
  { label: "Monastir", value: "Monastir" },
  { label: "Kairouan", value: "Kairouan" },
  { label: "Gabès", value: "Gabès" },
  { label: "Médenine", value: "Médenine" },
];

function normalizeStr(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGov, setSelectedGov] = useState("all");

  const resolveMediaUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const clean = url.replace(/\\/g, "/").replace(/^\/+/, "");
    const base = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");
    return `${base}/${clean}`;
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await companyService.getPublicCompanies({ limit: 100 });
        const list = res?.data?.companies || res?.companies || res?.data || (Array.isArray(res) ? res : []);
        if (list && list.length > 0) {
          setCompanies(list);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Could not fetch real public companies, falling back to dataService:", e);
      }
      try {
        const data = await dataService.getCompanies();
        setCompanies(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Check if a company matches the selected governorate or region
  const checkCompanyMatchesLocation = (comp, targetGov) => {
    if (!targetGov || targetGov === "all") return true;

    const targetNorm = normalizeStr(targetGov);

    // 1. Grand Tunis shortcut
    if (targetNorm === "grand tunis") {
      const grandTunisGovs = ["tunis", "ariana", "ben arous", "manouba"];
      const compGov = normalizeStr(comp.address?.governorate || comp.governorate || "");
      const compCity = normalizeStr(comp.address?.city || comp.city || "");
      if (grandTunisGovs.some((g) => compGov.includes(g) || compCity.includes(g))) return true;

      const areas = Array.isArray(comp.serviceAreas) ? comp.serviceAreas : [];
      return areas.some((a) => {
        const aNorm = normalizeStr(a);
        return grandTunisGovs.some((g) => aNorm.includes(g)) || aNorm.includes("grand tunis");
      });
    }

    // 2. Sahel shortcut
    if (targetNorm === "sahel") {
      const sahelGovs = ["sousse", "monastir", "mahdia"];
      const compGov = normalizeStr(comp.address?.governorate || comp.governorate || "");
      const compCity = normalizeStr(comp.address?.city || comp.city || "");
      if (sahelGovs.some((g) => compGov.includes(g) || compCity.includes(g))) return true;

      const areas = Array.isArray(comp.serviceAreas) ? comp.serviceAreas : [];
      return areas.some((a) => {
        const aNorm = normalizeStr(a);
        return sahelGovs.some((g) => aNorm.includes(g)) || aNorm.includes("sahel");
      });
    }

    // 3. Exact or partial governorate in headquarters address
    const compGov = normalizeStr(comp.address?.governorate || comp.governorate || "");
    const compCity = normalizeStr(comp.address?.city || comp.city || "");
    const compStreet = normalizeStr(comp.address?.street || "");
    if (compGov.includes(targetNorm) || targetNorm.includes(compGov && compGov.length > 2 ? compGov : "___")) {
      return true;
    }
    if (compCity.includes(targetNorm) || compStreet.includes(targetNorm)) {
      return true;
    }

    // 4. Service areas (Zones d'intervention)
    const areas = Array.isArray(comp.serviceAreas) ? comp.serviceAreas : [];
    const inAreas = areas.some((a) => {
      const aNorm = normalizeStr(a);
      return (
        aNorm.includes(targetNorm) ||
        targetNorm.includes(aNorm && aNorm.length > 2 ? aNorm : "___") ||
        aNorm.includes("toute la tunisie") ||
        aNorm.includes("national")
      );
    });
    if (inAreas) return true;

    // 5. Description mentions
    const desc = normalizeStr(comp.description);
    if (desc.includes(targetNorm)) return true;

    return false;
  };

  const filtered = useMemo(() => {
    return companies.filter((comp) => {
      // Only approved companies in public directory
      const isApproved = comp.verificationStatus === "approved" || !comp.verificationStatus;
      if (!isApproved) return false;

      // Text search matching
      const name = (comp.companyName || comp.name || comp.commercialName || comp.legalName || "").toLowerCase();
      const city = (typeof comp.address === "object" ? `${comp.address?.city || ""} ${comp.address?.governorate || ""}` : (comp.city || comp.headquartersAddress?.city || comp.address || "")).toLowerCase();
      const desc = (comp.description || "").toLowerCase();
      const services = Array.isArray(comp.services) ? comp.services.join(" ").toLowerCase() : "";
      const q = searchTerm.toLowerCase();

      const matchesSearch = !q || name.includes(q) || city.includes(q) || desc.includes(q) || services.includes(q);

      // Location matching
      const matchesLocation = checkCompanyMatchesLocation(comp, selectedGov);

      return matchesSearch && matchesLocation;
    });
  }, [companies, searchTerm, selectedGov]);

  return (
    <div className="min-h-screen bg-slate-50/70 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">

        {/* Editorial Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#800020]" />
            <span>Annuaire Officiel • Déménageurs Agréés RNE en Tunisie</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Trouvez votre déménageur <span className="text-[#800020]">selon votre localisation</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Consultez les entreprises vérifiées basées dans votre région ou assurant vos liaisons inter-gouvernorats sur les 24 gouvernorats de Tunisie.
          </p>
        </div>

        {/* Filter Bar with 24 Governorates Selector */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par société, quartier, monte-meubles..."
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Complete 24 Governorates Dropdown */}
            <div className="relative min-w-[260px]">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <select
                value={selectedGov}
                onChange={(e) => setSelectedGov(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer appearance-none"
              >
                <option value="all">📍 Tous les gouvernorats (24)</option>
                <option value="Grand Tunis">🏙️ Région Grand Tunis (Tunis, Ariana, Ben Arous, Manouba)</option>
                <option value="Sahel">🏖️ Région Sahel (Sousse, Monastir, Mahdia)</option>
                {TUNISIA_REGIONS.map((region) => (
                  <optgroup key={region.name} label={`── ${region.name} ──`}>
                    {region.governorates.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Quick Governorates / Region Chips */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0">
              Accès rapide :
            </span>
            {QUICK_HUBS.map((hub) => {
              const active = selectedGov === hub.value;
              return (
                <button
                  key={hub.value}
                  onClick={() => setSelectedGov(hub.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all flex-shrink-0 ${active
                      ? "bg-[#800020] text-white border border-white font-bold shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium"
                    }`}
                >
                  {hub.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filters Summary Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">
              {filtered.length} entreprise{filtered.length > 1 ? "s" : ""} agréée{filtered.length > 1 ? "s" : ""}
            </span>
            {selectedGov !== "all" && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                <span>Gouvernorat : <strong>{selectedGov}</strong></span>
                <button
                  onClick={() => setSelectedGov("all")}
                  className="hover:text-emerald-950 font-bold ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">
                <span>Recherche : <strong>"{searchTerm}"</strong></span>
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-slate-900 font-bold ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <span className="text-slate-400 text-[11px]">
            Couverture vérifiée : Siège &amp; Zones d'intervention officielles
          </span>
        </div>

        {/* Companies Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-slate-900">Aucun déménageur trouvé pour cette sélection</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aucune entreprise agréée n'est actuellement enregistrée pour le gouvernorat de <strong>{selectedGov}</strong>. Essayez d'élargir votre recherche à "Tous les gouvernorats" ou "Grand Tunis".
            </p>
            <button
              onClick={() => { setSearchTerm(""); setSelectedGov("all"); }}
              className="mt-2 inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Voir tous les 24 gouvernorats
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filtered.map((comp) => {
              const compId = comp._id || comp.id;
              const compName = comp.companyName || comp.name || comp.commercialName || comp.legalName || "Entreprise de Déménagement";

              // Location attributes
              const compGov = comp.address?.governorate || comp.governorate || "Tunis";
              const compCity = comp.address?.city || comp.city || compGov;
              const compStreet = comp.address?.street;
              const serviceAreas = Array.isArray(comp.serviceAreas) && comp.serviceAreas.length > 0
                ? comp.serviceAreas
                : [compGov, "Tunis", "Sousse", "Sfax"];

              const defaultCover = "/couverture.png";
              const coverImg = (comp.coverImage && !comp.coverImage.includes("unsplash.com"))
                ? (resolveMediaUrl(comp.coverImage) || defaultCover)
                : defaultCover;
              const logoUrl = resolveMediaUrl(comp.logo);
              const initials = compName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "MO";
              const rating = comp.rating || comp.averageRating || 4.9;
              const revCount = comp.reviewsCount || comp.totalReviews || 24;

              // Check if company is based in the currently selected governorate
              const isLocalBase = selectedGov !== "all" && normalizeStr(compGov).includes(normalizeStr(selectedGov));

              return (
                <div
                  key={compId}
                  className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                >
                  <div>
                    {/* Header Image Frame */}
                    <div className="h-44 overflow-hidden relative bg-slate-100">
                      <img
                        src={coverImg}
                        alt={compName}
                        onError={(e) => {
                          e.currentTarget.src = defaultCover;
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                        <span className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-sm text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-semibold border border-emerald-100 shadow-xs">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Agréé RNE
                        </span>

                        {/* Location Badge (Governorate) */}
                        <span className="inline-flex items-center gap-1 bg-slate-900/85 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[11px] font-medium shadow-xs">
                          <MapPin className="w-3 h-3 text-slate-300" />
                          <span>{compCity} ({compGov})</span>
                        </span>
                      </div>

                      {/* Logo Card */}
                      <div className="absolute -bottom-3 left-5 w-14 h-14 rounded-xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center overflow-hidden p-1.5 z-10">
                        {logoUrl ? (
                          <img
                            src={logoUrl}
                            alt={compName}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="text-sm font-bold text-slate-700 tracking-wider">
                            {initials}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="pt-6 p-5 space-y-3.5">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <RatingStars rating={rating} count={revCount} size="xs" />
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {comp.pricingEstimate || "Dès 450 DT"}
                          </span>
                        </div>

                        <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                          {compName}
                        </h3>

                        {/* Exact Location & Headquarters line */}
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">
                            {compStreet ? `${compStreet}, ` : ""}<strong>{compCity}</strong> ({compGov})
                          </span>
                        </div>

                        {/* Location status badge when filtering */}
                        {selectedGov !== "all" && (
                          <div className="mt-2">
                            {isLocalBase ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Siège &amp; Dépôt basé à {compGov}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                <Navigation className="w-3 h-3 text-slate-500" />
                                Dessert le gouvernorat de {selectedGov}
                              </span>
                            )}
                          </div>
                        )}

                        <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed font-normal">
                          {comp.description || "Transporteur professionnel certifié pour déménagements résidentiels et industriels avec équipements sécurisés."}
                        </p>
                      </div>

                      {/* Display Location Service Areas (Zones couvertes) */}
                      <div className="pt-3 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                            Zones d'intervention ({serviceAreas.length}) :
                          </span>
                          <span className="text-[10px] text-emerald-700 font-medium">Déplacement garanti</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {serviceAreas.slice(0, 5).map((area, idx) => {
                            const isSelected = selectedGov !== "all" && normalizeStr(area).includes(normalizeStr(selectedGov));
                            return (
                              <span
                                key={idx}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-medium border ${isSelected
                                    ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                  }`}
                              >
                                {area}
                              </span>
                            );
                          })}
                          {serviceAreas.length > 5 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md text-slate-500 bg-slate-100 font-medium">
                              +{serviceAreas.length - 5}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Fleet & Team specifications */}
                      <div className="pt-2 flex items-center gap-3 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{comp.fleetSize || 6} camions</span>
                        <span className="text-slate-300">•</span>
                        <span>{comp.employeesCount || 16} déménageurs</span>
                        <span className="text-slate-300">•</span>
                        <span>Monte-charge</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="p-5 pt-0">
                    <Link
                      to={`/companies/${compId}`}
                      className="w-full py-3 rounded-xl bg-[#800020] hover:bg-[#6b001a] text-white border-2 border-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md ring-2 ring-[#800020]/25 group-hover:scale-[1.01]"
                    >
                      <span>Consulter la fiche &amp; devis</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
