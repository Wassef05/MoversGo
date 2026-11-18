import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { requestService } from "../../services/api/requestService";
import { useAuth } from "../../contexts/AuthContext";
import { LocationBadge } from "../../components/common/LocationBadge";
import { formatDate } from "../../utils/cn";
import {
  Search,
  MapPin,
  Truck,
  Building2,
  Calendar,
  Box,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Navigation,
  Eye,
  RefreshCw,
  X,
  FileText,
  Boxes,
  Activity,
  Compass,
  Home,
} from "lucide-react";

// The 24 official governorates of Tunisia (individual list, without groupings)
export const TUNISIA_24_GOVERNORATES = [
  "Ariana",
  "Béja",
  "Ben Arous",
  "Bizerte",
  "Gabès",
  "Gafsa",
  "Jendouba",
  "Kairouan",
  "Kasserine",
  "Kébili",
  "Le Kef",
  "Mahdia",
  "Manouba",
  "Médenine",
  "Monastir",
  "Nabeul",
  "Sfax",
  "Sidi Bouzid",
  "Siliana",
  "Sousse",
  "Tataouine",
  "Tozeur",
  "Tunis",
  "Zaghouan",
];

const HOUSING_TRANSLATIONS = {
  studio: "Studio",
  apartment: "Appartement",
  house: "Maison",
  villa: "Grande Villa",
  duplex: "Duplex",
  office: "Bureaux Pro",
};

const HOUSING_EMOJI = {
  studio: "🏠",
  apartment: "🏢",
  house: "🏡",
  villa: "🏰",
  duplex: "🏘️",
  office: "🏗️",
};

const HOUSING_OPTIONS = [
  { id: "all", label: "Tous types de biens" },
  { id: "apartment", label: "Appartements" },
  { id: "villa", label: "Villas & Maisons" },
  { id: "office", label: "Bureaux & Pro" },
];

const HEADER_COLORS = [
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-indigo-600",
  "from-amber-500 to-orange-600",
  "from-teal-500 to-emerald-600",
];

const STRIPES = [
  "border-l-cyan-500",
  "border-l-violet-500",
  "border-l-amber-500",
  "border-l-teal-500",
];

function normalizeStr(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function PublicRequestsPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartureGov, setSelectedDepartureGov] = useState("all");
  const [selectedHousing, setSelectedHousing] = useState("all");
  const [activeModalRequest, setActiveModalRequest] = useState(null);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await requestService.getPublicRequests({ limit: 100 });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : res?.requests || [];
      setRequests(list);
    } catch (err) {
      console.warn("Erreur chargement déménagements publics:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Filter requests strictly based on the DEPARTURE location of the moving job
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const dep = req.departureAddress || req.fromAddress || req.departure || {};
      const arr = req.arrivalAddress || req.toAddress || req.arrival || {};

      // 1. Departure governorate matching (phase de départ)
      if (selectedDepartureGov !== "all") {
        const targetNorm = normalizeStr(selectedDepartureGov);
        const depGov = normalizeStr(dep.governorate || "");
        const depCity = normalizeStr(dep.city || "");
        const depStreet = normalizeStr(dep.street || "");

        const matchesDeparture =
          depGov.includes(targetNorm) ||
          targetNorm.includes(depGov && depGov.length > 2 ? depGov : "___") ||
          depCity.includes(targetNorm) ||
          depStreet.includes(targetNorm);

        if (!matchesDeparture) return false;
      }

      // 2. Housing type filter
      if (selectedHousing !== "all") {
        const housing = (req.departureHousingType || req.housingType || "").toLowerCase();
        const matchesHousing =
          (selectedHousing === "apartment" && (housing.includes("apartment") || housing.includes("appartement") || housing.includes("s+"))) ||
          (selectedHousing === "villa" && (housing.includes("villa") || housing.includes("house") || housing.includes("maison"))) ||
          (selectedHousing === "office" && (housing.includes("office") || housing.includes("bureau") || housing.includes("local")));
        if (!matchesHousing) return false;
      }

      // 3. Search input query
      if (searchTerm && searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const fullText = [
          req.customTitle,
          req.title,
          dep.city,
          dep.governorate,
          dep.street,
          arr.city,
          arr.governorate,
          arr.street,
          req.departureHousingType,
          req.client?.fullName,
          req.client?.firstName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!fullText.includes(q)) return false;
      }

      return true;
    });
  }, [requests, selectedDepartureGov, selectedHousing, searchTerm]);

  const isCompany = currentUser?.role === "company";

  return (
    <div className="min-h-screen bg-slate-50/70 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Editorial Modern Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#800020] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
            <ShieldCheck className="w-3.5 h-3.5 text-[#800020]" />
            <span>Bourse Nationale des Déménagements • Tunisie</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Missions &amp; Déménagements <span className="text-[#800020]">Clients en Direct</span>
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Consultez les demandes publiées par les clients au départ de chaque gouvernorat tunisien. Itinéraires précis, cubage $m^3$, étages et ascenseurs vérifiés.
          </p>

          {/* Quick HUD Metrics */}
          <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span><strong>{requests.length}</strong> déménagements actifs</span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs">
              <Navigation className="w-3 h-3 text-slate-500" />
              <span>Filtrage sur la <strong>phase de départ</strong></span>
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1 rounded-lg shadow-2xs">
              <Truck className="w-3 h-3 text-slate-500" />
              <span>24 gouvernorats connectés</span>
            </span>
          </div>
        </div>

        {/* Filter Bar with 24 Governorates (Departure Only) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par ville, destination, mot-clé (ex: Ennasr, Sahloul, S+2)..."
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

            {/* 24 Governorates Dropdown (Departure Only) */}
            <div className="relative min-w-[260px]">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <select
                value={selectedDepartureGov}
                onChange={(e) => setSelectedDepartureGov(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer appearance-none"
              >
                <option value="all">📍 Départ : Tous gouvernorats (24)</option>
                {TUNISIA_24_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    Départ : {gov}
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Housing Type Select */}
            <div className="relative min-w-[180px]">
              <select
                value={selectedHousing}
                onChange={(e) => setSelectedHousing(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-slate-400 transition-colors cursor-pointer appearance-none"
              >
                {HOUSING_OPTIONS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={loadRequests}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold whitespace-nowrap shadow-2xs"
              title="Rafraîchir la liste"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-slate-900" : ""}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          </div>

          {/* Quick Governorates Scrollable Chips (The 24 governorates directly) */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 flex-shrink-0">
              Gouvernorat de départ :
            </span>
            <button
              onClick={() => setSelectedDepartureGov("all")}
              className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedDepartureGov === "all"
                  ? "bg-slate-900 text-white font-semibold shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium"
              }`}
            >
              Tous (24)
            </button>
            {TUNISIA_24_GOVERNORATES.map((gov) => {
              const active = selectedDepartureGov === gov;
              return (
                <button
                  key={gov}
                  onClick={() => setSelectedDepartureGov(gov)}
                  className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                    active
                      ? "bg-slate-900 text-white font-semibold shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium"
                  }`}
                >
                  {gov}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Filters Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900">
              {filteredRequests.length} déménagement{filteredRequests.length > 1 ? "s" : ""} disponible{filteredRequests.length > 1 ? "s" : ""}
            </span>
            {selectedDepartureGov !== "all" && (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium">
                <span>Départ : <strong>{selectedDepartureGov}</strong></span>
                <button
                  onClick={() => setSelectedDepartureGov("all")}
                  className="hover:text-emerald-950 font-bold ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedHousing !== "all" && (
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-0.5 rounded-full font-medium">
                <span>Type : <strong>{HOUSING_OPTIONS.find((t) => t.id === selectedHousing)?.label}</strong></span>
                <button
                  onClick={() => setSelectedHousing("all")}
                  className="hover:text-slate-950 font-bold ml-1"
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
            Filtré sur le lieu de chargement / point de départ du client
          </span>
        </div>

        {/* Requests Cards Grid — EXACT SAME DESIGN AS HOMEPAGE */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 rounded-[2rem] bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Navigation className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-slate-900">Aucun déménagement au départ de cette zone</p>
            <p className="text-xs text-slate-500 leading-relaxed">
              Il n'y a actuellement aucune demande de déménagement dont le point de départ est situé à <strong>{selectedDepartureGov}</strong>.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedDepartureGov("all");
                setSelectedHousing("all");
              }}
              className="mt-2 inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              Afficher tous les 24 gouvernorats
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredRequests.map((req, idx) => {
              const reqId = req._id || req.id || String(idx);
              const dep = req.departureAddress || req.fromAddress || req.departure || {};
              const arr = req.arrivalAddress || req.toAddress || req.arrival || {};
              const depCity = dep.city || dep.governorate || "Tunis";
              const depGov = dep.governorate || depCity;
              const arrCity = arr.city || arr.governorate || "Sousse";
              const arrGov = arr.governorate || arrCity;
              const volume = req.estimatedVolume || req.inventory?.estimatedVolume || req.volumeM3 || 25;
              const boxes = req.estimatedBoxes || req.inventory?.estimatedBoxes || Math.round(volume * 1.2) || 30;
              const housingKey = req.departureHousingType || req.housingType || "apartment";
              const housing = HOUSING_TRANSLATIONS[housingKey] || housingKey;
              const emoji = HOUSING_EMOJI[housingKey] || "🏠";
              const clientName = req.client?.fullName || req.client?.firstName || "Client MoversGo";
              const quotesCount = typeof req.quotesCount === "number" ? req.quotesCount : 0;
              const moveDate = formatDate(req.desiredDate || req.preferredDate);

              const colorIdx = Math.abs(reqId.charCodeAt(reqId.length - 1) || idx) % 4;
              const hColor = HEADER_COLORS[colorIdx];
              const stripe = STRIPES[colorIdx];

              return (
                <motion.div
                  key={reqId}
                  whileHover={{ scale: 1.01, y: -6 }}
                  transition={{ type: "spring", stiffness: 280 }}
                  className="bg-white rounded-[2.2rem] overflow-hidden border-2 border-slate-200/90 hover:border-[#800020] shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col group relative"
                >
                  {/* Solid Bordeaux Header (Unslop Design) */}
                  <div className="bg-[#800020] text-white p-5 pb-7 relative overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-15 pointer-events-none"
                      style={{
                        backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
                        backgroundSize: "16px 16px",
                      }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-9 h-9 rounded-xl bg-white/15 border-2 border-white text-white flex items-center justify-center font-bold shadow-sm">
                          <Home className="w-4 h-4" />
                        </span>
                        <span className="font-mono text-xs font-bold text-white tracking-wide">
                          {housing}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white text-[#800020] border-2 border-white shadow-md flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {quotesCount > 0 ? `${quotesCount} devis` : "Nouveau"}
                      </span>
                    </div>

                    <div className="relative z-10 mt-3 flex items-center gap-1.5 text-xs text-rose-100 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-rose-200" />
                      <span>Date : {moveDate}</span>
                    </div>
                  </div>

                  {/* Route Card (Floating in Middle) */}
                  <div className="px-4 sm:px-5 -mt-4 relative z-10">
                    <div className="bg-white rounded-2xl shadow-lg border-2 border-slate-100 p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            Départ ({depGov})
                          </p>
                          <p className="text-xs font-black text-slate-900 truncate">
                            {dep.street ? `${dep.street}, ` : ""}{depCity}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-slate-300" />
                          <div className="w-5 h-px border-t-2 border-dashed border-slate-300" />
                          <ArrowRight className="w-3.5 h-3.5 text-[#800020]" />
                          <div className="w-5 h-px border-t-2 border-dashed border-slate-300" />
                          <div className="w-2 h-2 rounded-full bg-[#800020]" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            Arrivée ({arrGov})
                          </p>
                          <p className="text-xs font-black text-slate-900 truncate">
                            {arr.street ? `${arr.street}, ` : ""}{arrCity}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="px-4 sm:px-5 py-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
                          <Box className="w-4 h-4 text-[#800020] flex-shrink-0" />
                          <div>
                            <p className="text-[9px] text-slate-400 font-medium uppercase">Cubage</p>
                            <p className="text-xs font-bold text-slate-900 font-mono">{volume} m³</p>
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2">
                          <Boxes className="w-4 h-4 text-[#800020] flex-shrink-0" />
                          <div>
                            <p className="text-[9px] text-slate-400 font-medium uppercase">Cartons</p>
                            <p className="text-xs font-bold text-slate-900 font-mono">~{boxes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Floor & Elevator Specs */}
                      <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] text-slate-600">
                        <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 truncate font-mono">
                          Dép : Étage {req.departureFloor ?? dep.floor ?? 0} ({req.departureElevator ?? dep.hasElevator ? "Asc ✓" : "Sans asc"})
                        </div>
                        <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 truncate font-mono">
                          Arr : Étage {req.arrivalFloor ?? arr.floor ?? 0} ({req.arrivalElevator ?? arr.hasElevator ? "Asc ✓" : "Sans asc"})
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 mb-4">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Anonymat garanti
                        </span>
                        <span className="text-slate-700 font-semibold truncate max-w-[120px]">
                          Par {clientName}
                        </span>
                      </div>
                    </div>

                    {/* Actions (Coordonnées & Soumission de devis) */}
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveModalRequest(req)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100/80 border border-rose-200 text-[#800020] text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#800020]" />
                        <span>Coordonnées</span>
                      </button>

                      {isCompany ? (
                        <Link
                          to={`/company/quotes/new/${reqId}`}
                          className="py-2.5 px-4 rounded-xl bg-[#800020] hover:bg-[#6b001a] text-white border-2 border-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ring-2 ring-[#800020]/25 whitespace-nowrap"
                        >
                          <span>Devis</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <Link
                          to={`/register/company`}
                          className="py-2.5 px-3.5 rounded-xl bg-[#800020] hover:bg-[#6b001a] text-white border-2 border-white text-xs font-bold transition-all flex items-center gap-1 shadow-md ring-2 ring-[#800020]/25 whitespace-nowrap"
                          title="Inscrivez votre entreprise pour soumettre des devis"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Déménageur ?</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* DETAILED REQUEST MODAL (With full coordinates, map links, and inventory) */}
      {activeModalRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {activeModalRequest.customTitle || activeModalRequest.title || "Détail du Déménagement"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dossier #{String(activeModalRequest._id || "").slice(-6).toUpperCase()} • Publié par {activeModalRequest.client?.firstName || "Client"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalRequest(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              
              {/* Departure Location Badge */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Adresse et Coordonnées GPS de Départ (Point de Chargement)</span>
                </span>
                <LocationBadge
                  city={activeModalRequest.departureAddress?.city}
                  governorate={activeModalRequest.departureAddress?.governorate}
                  street={activeModalRequest.departureAddress?.street}
                  latitude={activeModalRequest.departureAddress?.latitude}
                  longitude={activeModalRequest.departureAddress?.longitude}
                  label="Point de Départ Camion"
                  className="bg-slate-50 border-slate-200 text-slate-800"
                />
                <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <p>Type de logement : <strong className="text-slate-900">{activeModalRequest.departureHousingType || "Appartement"}</strong></p>
                  <p>Étage : <strong className="text-slate-900">{activeModalRequest.departureFloor ?? 0}</strong></p>
                  <p>Ascenseur : <strong className="text-slate-900">{activeModalRequest.departureElevator ? "Oui" : "Non"}</strong></p>
                  <p>Surface estimée : <strong className="text-slate-900">{activeModalRequest.departureSurface ? `${activeModalRequest.departureSurface} m²` : "Non spécifiée"}</strong></p>
                </div>
              </div>

              {/* Arrival Location Badge */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-slate-600" />
                  <span>Adresse et Coordonnées GPS d'Arrivée (Point de Livraison)</span>
                </span>
                <LocationBadge
                  city={activeModalRequest.arrivalAddress?.city}
                  governorate={activeModalRequest.arrivalAddress?.governorate}
                  street={activeModalRequest.arrivalAddress?.street}
                  latitude={activeModalRequest.arrivalAddress?.latitude}
                  longitude={activeModalRequest.arrivalAddress?.longitude}
                  label="Point de Livraison"
                  className="bg-slate-50 border-slate-200 text-slate-800"
                />
                <div className="grid grid-cols-2 gap-2 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <p>Type de logement : <strong className="text-slate-900">{activeModalRequest.arrivalHousingType || "Appartement"}</strong></p>
                  <p>Étage : <strong className="text-slate-900">{activeModalRequest.arrivalFloor ?? 0}</strong></p>
                  <p>Ascenseur : <strong className="text-slate-900">{activeModalRequest.arrivalElevator ? "Oui" : "Non"}</strong></p>
                  <p>Surface estimée : <strong className="text-slate-900">{activeModalRequest.arrivalSurface ? `${activeModalRequest.arrivalSurface} m²` : "Non spécifiée"}</strong></p>
                </div>
              </div>

              {/* Volume & Client Comments */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Box className="w-4 h-4 text-slate-700" />
                    <span>Volume estimé :</span>
                  </span>
                  <strong className="text-slate-900 font-mono text-base font-bold">
                    {activeModalRequest.estimatedVolume || 25} m³
                  </strong>
                </div>

                {activeModalRequest.comments && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Précisions du client :</span>
                    <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                      "{activeModalRequest.comments}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setActiveModalRequest(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
              >
                Fermer
              </button>

              {isCompany ? (
                <Link
                  to={`/company/quotes/new/${activeModalRequest._id}`}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs flex items-center gap-2 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Rédiger et transmettre un devis</span>
                </Link>
              ) : (
                <Link
                  to="/register/company"
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-2"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Rejoindre le réseau de déménageurs</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
