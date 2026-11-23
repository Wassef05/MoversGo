import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import { requestService } from "../../services/api/requestService";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatDate } from "../../utils/cn";
import {
  PlusCircle,
  Search,
  MapPin,
  Calendar,
  Truck,
  ArrowRight,
  Eye,
  Scale,
  RefreshCw,
  Home,
  Layers,
  Edit3,
  Lock
} from "lucide-react";

export function ClientRequestsPage() {
  const { onRequestUpdate, onQuoteUpdate } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await requestService.getMyRequests({ limit: 100 });
      const list =
        res?.data?.movingRequests ||
        res?.data?.requests ||
        res?.data ||
        (Array.isArray(res) ? res : []);
      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Erreur chargement demandes:", err);
      if (!silent) setRequests([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const unregisterReq = onRequestUpdate?.(() => {
      fetchRequests(true);
    });
    const unregisterQuote = onQuoteUpdate?.(() => {
      fetchRequests(true);
    });
    return () => {
      if (typeof unregisterReq === "function") unregisterReq();
      if (typeof unregisterQuote === "function") unregisterQuote();
    };
  }, [onRequestUpdate, onQuoteUpdate]);

  const fmtFullAddress = (addr) => {
    if (!addr) return "Adresse non spécifiée";
    if (typeof addr === "string") return addr;
    const parts = [
      addr.street,
      addr.postalCode ? `${addr.postalCode} ${addr.city || ""}`.trim() : addr.city,
      addr.governorate,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Coordonnées incomplètes";
  };

  const getCity = (addr) => {
    if (!addr) return "—";
    if (typeof addr === "string") return addr;
    return addr.city || addr.governorate || "—";
  };

  const filtered = requests.filter((r) => {
    const title = (r.title || "").toLowerCase();
    const depCity = getCity(r.departureAddress || r.departure).toLowerCase();
    const arrCity = getCity(r.arrivalAddress || r.arrival).toLowerCase();
    const depFull = fmtFullAddress(r.departureAddress || r.departure).toLowerCase();
    const arrFull = fmtFullAddress(r.arrivalAddress || r.arrival).toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      title.includes(search) ||
      depCity.includes(search) ||
      arrCity.includes(search) ||
      depFull.includes(search) ||
      arrFull.includes(search);

    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Mes demandes de déménagement
          </h1>
          <p className="text-xs text-slate-500">
            Suivez vos projets en cours, consultez vos coordonnées et comparez les devis reçus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRequests}
            title="Rafraîchir"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            to="/client/requests/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Créer une nouvelle demande</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par adresse, ville..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "Toutes" },
            { id: "pending", label: "En attente" },
            { id: "quoted", label: "Devis reçus" },
            { id: "booked", label: "Réservé" },
            { id: "completed", label: "Terminé" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && requests.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {filtered.map((req) => {
          const reqId = req._id || req.id;
          const depObj = req.departureAddress || req.departure || {};
          const arrObj = req.arrivalAddress || req.arrival || {};
          const depCity = getCity(depObj);
          const arrCity = getCity(arrObj);
          const depFull = fmtFullAddress(depObj);
          const arrFull = fmtFullAddress(arrObj);
          const vol = req.estimatedVolume || req.inventory?.estimatedVolume || 0;
          const hType = req.departureHousingType || depObj.housingType || "Logement";
          const date = req.preferredDate || req.desiredDate;
          const quotesCount = req.quotesCount || 0;

          return (
            <div
              key={reqId}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={req.status} />
                  <span className="text-[11px] text-slate-400">
                    Publiée le {formatDate(req.createdAt)} • Réf #{String(reqId).slice(-6).toUpperCase()}
                  </span>
                  {quotesCount > 0 && (
                    <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100 flex items-center gap-1">
                      <Scale className="w-3 h-3" />
                      {quotesCount} {quotesCount === 1 ? "devis reçu" : "devis reçus"}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900">
                  {req.title || `Déménagement ${depCity} ➔ ${arrCity}`}
                </h3>

                {/* Full Coordinates Display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-brand-700 font-bold text-[11px] uppercase tracking-wider">
                      <Home className="w-3.5 h-3.5" />
                      <span>Coordonnées de Départ :</span>
                    </div>
                    <p className="font-semibold text-slate-900">{depFull}</p>
                    <p className="text-[11px] text-slate-500">
                      {hType} • Étage {req.departureFloor ?? depObj.floor ?? 0}{" "}
                      {req.departureElevator || depObj.hasElevator ? "(avec ascenseur)" : "(sans ascenseur)"}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px] uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Coordonnées d'Arrivée :</span>
                    </div>
                    <p className="font-semibold text-slate-900">{arrFull}</p>
                    <p className="text-[11px] text-slate-500">
                      {req.arrivalHousingType || arrObj.housingType || "Logement"} • Étage {req.arrivalFloor ?? arrObj.floor ?? 0}{" "}
                      {req.arrivalElevator || arrObj.hasElevator ? "(avec ascenseur)" : "(sans ascenseur)"}
                    </p>
                  </div>
                </div>

                {/* Additional Quick Stats */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Volume : <strong>{vol ? `${vol} m³` : "À estimer"}</strong></span>
                  </span>
                  {date && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Date souhaitée : <strong>{formatDate(date)}</strong></span>
                      </span>
                    </>
                  )}
                  {req.estimatedBoxes > 0 && (
                    <>
                      <span>•</span>
                      <span>{req.estimatedBoxes} cartons</span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 self-end lg:self-center flex-shrink-0 pt-2 lg:pt-0">
                {quotesCount === 0 && req.status === "pending" ? (
                  <Link
                    to={`/client/requests/${reqId}/edit`}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Modifier les informations de cette publication"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-brand-600" />
                    <span>Modifier</span>
                  </Link>
                ) : quotesCount > 0 ? (
                  <span
                    title="Cette publication est verrouillée car des devis ont déjà été émis par des transporteurs."
                    className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-semibold flex items-center gap-1.5 select-none"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Verrouillée ({quotesCount} devis)</span>
                  </span>
                ) : null}

                {quotesCount > 0 && (
                  <Link
                    to={`/client/compare?requestId=${reqId}`}
                    className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand flex items-center gap-1.5"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    <span>Comparer les devis ({quotesCount})</span>
                  </Link>
                )}
                <Link
                  to={`/client/requests/${reqId}`}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Détails complets</span>
                </Link>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <p className="text-sm font-semibold text-slate-700">Aucune demande trouvée</p>
            <p className="text-xs text-slate-500">
              Commencez dès maintenant en publiant votre premier projet de déménagement.
            </p>
            <Link
              to="/client/requests/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 shadow-brand"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publier une demande</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
