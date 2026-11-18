import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import { requestService } from "../../services/api/requestService";
import { formatDate, formatCurrency } from "../../utils/cn";
import {
  Search,
  MapPin,
  Truck,
  Calendar,
  ArrowRight,
  Filter,
  RefreshCw,
  Eye,
  Send,
  Home,
  User,
  Package
} from "lucide-react";

export function CompanyRequestsPage() {
  const { onRequestUpdate } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [minVolume, setMinVolume] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await requestService.getAvailableRequests({ limit: 100 });
      const list = res?.data || (Array.isArray(res) ? res : []);
      setRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Erreur chargement demandes disponibles:", err);
      if (!silent) setRequests([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const unregister = onRequestUpdate(() => {
      fetchRequests(true);
    });
    return unregister;
  }, [onRequestUpdate]);

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

    const vol = r.estimatedVolume || r.inventory?.estimatedVolume || 0;
    const matchesVolume = vol >= minVolume;
    return matchesSearch && matchesVolume;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Demandes de déménagement disponibles
          </h1>
          <p className="text-xs text-slate-500">
            Parcourez les besoins déposés par les clients avec leurs coordonnées complètes et proposez votre devis
          </p>
        </div>
        <button
          onClick={fetchRequests}
          title="Rafraîchir"
          className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher une ville, adresse, gouvernorat..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Volume minimum :</span>
          <select
            value={minVolume}
            onChange={(e) => setMinVolume(parseInt(e.target.value, 10))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 shadow-xs"
          >
            <option value={0}>Tous les volumes</option>
            <option value={15}>15 m³ et plus</option>
            <option value={25}>25 m³ et plus</option>
            <option value={40}>40 m³ et plus (Grandes surfaces)</option>
          </select>
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
        {filtered.length === 0 && !loading ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200/80 text-center space-y-2">
            <Truck className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Aucune demande de déménagement disponible</p>
            <p className="text-xs text-slate-400">
              Revenez bientôt ou vérifiez vos zones d'intervention dans votre profil entreprise.
            </p>
          </div>
        ) : (
          filtered.map((req) => {
            const reqId = req._id || req.id;
            const vol = req.estimatedVolume || req.inventory?.estimatedVolume || 0;
            const depObj = req.departureAddress || req.departure || {};
            const arrObj = req.arrivalAddress || req.arrival || {};
            const depCity = getCity(depObj);
            const arrCity = getCity(arrObj);
            const depFull = fmtFullAddress(depObj);
            const arrFull = fmtFullAddress(arrObj);
            const depFloor = req.departureFloor ?? depObj.floor ?? 0;
            const arrFloor = req.arrivalFloor ?? arrObj.floor ?? 0;
            const depElevator = req.departureElevator ?? depObj.hasElevator;
            const arrElevator = req.arrivalElevator ?? arrObj.hasElevator;
            const date = req.preferredDate || req.desiredDate;
            const clientName = req.client ? `${req.client.firstName || ""} ${req.client.lastName || ""}`.trim() : "Client particulier";

            return (
              <div
                key={reqId}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                      {vol ? `${vol} m³` : "Volume à estimer"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Publiée le {formatDate(req.createdAt)}
                    </span>
                    {req.quotesCount > 0 && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {req.quotesCount} devis déjà soumis
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {req.title || `Déménagement ${depCity} ➔ ${arrCity}`}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Client : <strong>{clientName}</strong></span>
                    </p>
                  </div>

                  {/* Coordinates Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-brand-700 font-bold text-[11px] uppercase tracking-wider">
                        <Home className="w-3.5 h-3.5" />
                        <span>Chargement (Départ) :</span>
                      </div>
                      <p className="font-semibold text-slate-900">{depFull}</p>
                      <p className="text-[11px] text-slate-500">
                        {req.departureHousingType || depObj.housingType || "Logement"} • Étage {depFloor}{" "}
                        {depElevator ? "(avec ascenseur)" : "(sans ascenseur)"}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px] uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Livraison (Arrivée) :</span>
                      </div>
                      <p className="font-semibold text-slate-900">{arrFull}</p>
                      <p className="text-[11px] text-slate-500">
                        {req.arrivalHousingType || arrObj.housingType || "Logement"} • Étage {arrFloor}{" "}
                        {arrElevator ? "(avec ascenseur)" : "(sans ascenseur)"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    {date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Date prévue : <strong>{formatDate(date)}</strong></span>
                      </span>
                    )}
                    {req.estimatedBoxes > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span>{req.estimatedBoxes} cartons</span>
                        </span>
                      </>
                    )}
                    {req.estimatedBudget && (
                      <>
                        <span>•</span>
                        <span>Budget estimé client : {formatCurrency(req.estimatedBudget)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-end lg:self-center flex-shrink-0 pt-2 lg:pt-0">
                  <Link
                    to={`/company/requests/${reqId}`}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Détails</span>
                  </Link>

                  <Link
                    to={`/company/quotes/new/${reqId}`}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Émettre un devis</span>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
