import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { recommendationService } from "../../services/api/recommendationService";
import { RecommendationMap } from "../../components/company/RecommendationMap";
import { StatCard } from "../../components/common/StatCard";
import { formatDate, formatCurrency } from "../../utils/cn";
import { toast } from "sonner";
import {
  Sparkles,
  MapPin,
  Calendar,
  Box,
  Truck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  SlidersHorizontal,
  Map as MapIcon,
  List as ListIcon,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Building2,
  Clock,
  Layers,
  ArrowRight,
  RefreshCw,
  Info,
  DollarSign,
  Search,
} from "lucide-react";

export function CompanyRecommendationsPage() {
  const { currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [stats, setStats] = useState(null);
  const [mapData, setMapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // "list" | "map"
  const [selectedBreakdown, setSelectedBreakdown] = useState(null);

  // Filters
  const [maxDistance, setMaxDistance] = useState("all");
  const [relevanceLevel, setRelevanceLevel] = useState("all");
  const [housingType, setHousingType] = useState("all");
  const [sortBy, setSortBy] = useState("score");
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [recsRes, statsRes, mapRes] = await Promise.all([
        recommendationService.getCompanyRecommendations({
          maxDistance: maxDistance !== "all" ? maxDistance : undefined,
          relevanceLevel: relevanceLevel !== "all" ? relevanceLevel : undefined,
          housingType: housingType !== "all" ? housingType : undefined,
          sortBy,
          search: search.trim() || undefined,
          limit: 30,
        }).catch((err) => {
          console.error("Erreur chargement recommandations:", err);
          return { recommendations: [] };
        }),
        recommendationService.getCompanyRecommendationStats().catch(() => null),
        recommendationService.getRecommendationMapData().catch(() => null),
      ]);

      setRecommendations(recsRes.recommendations || []);
      if (statsRes) setStats(statsRes);
      if (mapRes) setMapData(mapRes);
    } catch (err) {
      console.error("Erreur générale recommandations:", err);
      toast.error("Impossible de charger les recommandations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [maxDistance, relevanceLevel, housingType, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  // Helper styling for score pill
  const getScoreBadge = (score, level) => {
    if (score >= 85) {
      return {
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        ring: "text-emerald-600 bg-emerald-500",
        label: "Excellente affinité",
      };
    }
    if (score >= 70) {
      return {
        bg: "bg-blue-50 text-blue-800 border-blue-200",
        ring: "text-blue-600 bg-blue-500",
        label: "Bonne affinité",
      };
    }
    return {
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      ring: "text-amber-600 bg-amber-500",
      label: "Affinité modérée",
    };
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#800020] text-xs font-bold border border-rose-200 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Moteur Intelligent de Recommandation MoversGo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Opportunités recommandées
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Annonces de déménagement sélectionnées et ordonnées selon votre localisation, vos services et vos capacités de flotte.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Rafraîchir les recommandations"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Toggle List / Map View */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "list"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>Liste</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === "map"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Carte interactive</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Opportunités sélectionnées"
          value={stats?.totalRecommended ?? recommendations.length}
          subtitle={`Score moyen : ${stats?.averageScore || 82}%`}
          icon={Sparkles}
          color="brand"
        />
        <StatCard
          title="Nouvelles annonces"
          value={stats?.newOpportunities ?? 0}
          subtitle="Publiées ces dernières 48h"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Proximité directe"
          value={stats?.nearbyCount ?? 0}
          subtitle="Situées à moins de 25 km"
          icon={MapPin}
          color="emerald"
        />
        <StatCard
          title="Spécialités idéales"
          value={stats?.perfectServiceMatches ?? 0}
          subtitle="Services demandés 100% couverts"
          icon={ShieldCheck}
          color="purple"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par ville, gouvernorat (ex: Sousse, Tunis, Monastir)..."
              className="w-full pl-9 pr-20 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] bg-slate-50/50"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-slate-900 text-white rounded-lg text-[11px] font-bold hover:bg-slate-800"
            >
              Filtrer
            </button>
          </form>

          {/* Quick Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Distance Radius */}
            <select
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
            >
              <option value="all">Rayon : Partout en Tunisie</option>
              <option value="15">Rayon : &lt; 15 km (Immédiat)</option>
              <option value="30">Rayon : &lt; 30 km (Agglomération)</option>
              <option value="50">Rayon : &lt; 50 km (Régional)</option>
              <option value="100">Rayon : &lt; 100 km (Inter-villes)</option>
            </select>

            {/* Relevance level */}
            <select
              value={relevanceLevel}
              onChange={(e) => setRelevanceLevel(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
            >
              <option value="all">Pertinence : Tous les niveaux</option>
              <option value="excellent">Excellente uniquement (≥ 85%)</option>
              <option value="good">Bonne & Excellente (≥ 70%)</option>
              <option value="medium">Modérée (≥ 50%)</option>
            </select>

            {/* Housing type */}
            <select
              value={housingType}
              onChange={(e) => setHousingType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
            >
              <option value="all">Type : Résidentiel & Professionnel</option>
              <option value="apartment">Appartements</option>
              <option value="villa">Villas / Maisons</option>
              <option value="office">Bureaux & Entreprises</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#800020]/20"
            >
              <option value="score">Trier par : Plus pertinentes d'abord</option>
              <option value="distance">Trier par : Plus proches d'abord</option>
              <option value="recent">Trier par : Plus récentes</option>
              <option value="date">Trier par : Date de déménagement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content View (List vs Map) */}
      {viewMode === "map" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Visualisez la position de votre siège et des opportunités géolocalisées.</span>
            <span className="font-bold text-slate-700">{recommendations.length} annonces sur la carte</span>
          </div>
          <RecommendationMap mapData={mapData} />
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#800020] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-500 font-medium">
                Calcul des scores géographiques et analyse des compatibilités...
              </p>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-[#800020] flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Aucune opportunité correspondante pour le moment
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                De nouvelles annonces apparaîtront automatiquement dès qu'elles correspondront à vos services et à votre zone d'intervention.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setMaxDistance("all");
                    setRelevanceLevel("all");
                    setHousingType("all");
                    setSearch("");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {recommendations.map((item) => {
                const score = item.score ?? item.recommendation?.score ?? 75;
                const badge = getScoreBadge(score, item.relevanceLevel);
                const distanceKm = item.distanceKm ?? item.recommendation?.distanceKm;
                const rec = item.recommendation || {};

                return (
                  <div
                    key={item._id || item.id}
                    className="bg-white rounded-3xl border border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Top Card Header */}
                    <div className="p-5 pb-3 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-current"></span>
                          <span>{score}% de compatibilité</span>
                        </span>

                        {distanceKm !== null && distanceKm !== undefined && (
                          <span className="text-[11px] font-mono font-bold text-[#800020] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#800020]" />
                            <span>{distanceKm} km</span>
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-[#800020] transition-colors">
                          {item.customTitle || item.title || `Déménagement ${item.departureAddress?.city} → ${item.arrivalAddress?.city}`}
                        </h3>
                        <p className="text-[11px] text-slate-400 capitalize">
                          {item.departureHousingType === "office" ? "Déménagement de bureaux" : "Déménagement résidentiel"}
                        </p>
                      </div>

                      {/* Route visualization */}
                      <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          <span className="text-slate-600 font-medium truncate">
                            <strong>Départ :</strong> {item.departureAddress?.city} ({item.departureAddress?.governorate})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#800020] flex-shrink-0" />
                          <span className="text-slate-600 font-medium truncate">
                            <strong>Arrivée :</strong> {item.arrivalAddress?.city} ({item.arrivalAddress?.governorate})
                          </span>
                        </div>
                      </div>

                      {/* Key specs */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(item.preferredDate || item.desiredDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Box className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.estimatedVolume || item.inventory?.estimatedVolume || 0} m³</span>
                        </div>
                        {item.estimatedBudget && (
                          <div className="col-span-2 flex items-center gap-1.5 text-slate-700 font-semibold">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Budget indicatif : {item.estimatedBudget}</span>
                          </div>
                        )}
                      </div>

                      {/* Matched services badges */}
                      {rec.breakdown?.service?.matchedServices?.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {rec.breakdown.service.matchedServices.slice(0, 2).map((srv, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{srv}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center gap-2">
                      <Link
                        to={`/company/requests/${item._id || item.id}`}
                        className="flex-1 py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white text-center transition-all"
                      >
                        Voir les détails
                      </Link>

                      <Link
                        to={`/company/quotes/new/${item._id || item.id}`}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold text-center transition-all shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Proposer mes services</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
