import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/api/adminService";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatDate, formatCurrency } from "../../utils/cn";
import {
  Search,
  MapPin,
  Truck,
  ArrowRight,
  Eye,
  RefreshCw,
  X,
  User,
  Phone,
  Mail,
  Home,
  Calendar,
  Package,
  Camera,
  Layers
} from "lucide-react";

export function AdminRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [inspectModal, setInspectModal] = useState(null);

  const backendUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllRequests();
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.requests)
            ? res.requests
            : [];
      setRequests(list);
    } catch (err) {
      console.error("Erreur chargement demandes:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

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

  const filtered = requests.filter((r) => {
    const title = (r.title || "").toLowerCase();
    const client = (
      r.client
        ? `${r.client.firstName || ""} ${r.client.lastName || ""}`
        : r.clientName || ""
    ).toLowerCase();
    const dep = fmtFullAddress(r.departureAddress || r.departure).toLowerCase();
    const arr = fmtFullAddress(r.arrivalAddress || r.arrival).toLowerCase();
    const q = searchTerm.toLowerCase();
    return title.includes(q) || client.includes(q) || dep.includes(q) || arr.includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Supervision des Demandes de Déménagement
          </h1>
          <p className="text-xs text-slate-500">
            Flux global de tous les projets publiés sur la plateforme avec leurs coordonnées complètes
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

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par client, adresse, ville..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Demande</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Coordonnées de Départ</th>
                <th className="py-3.5 px-4">Coordonnées d'Arrivée</th>
                <th className="py-3.5 px-4">Volume</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Devis</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Inspecter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Chargement des demandes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Aucune demande trouvée.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => {
                  const reqId = req._id || req.id;
                  const clientObj = req.client || {};
                  const clientLabel = clientObj.firstName
                    ? `${clientObj.firstName} ${clientObj.lastName || ""}`.trim()
                    : req.clientName || "Client Particulier";
                  const depObj = req.departureAddress || req.departure || {};
                  const arrObj = req.arrivalAddress || req.arrival || {};
                  const depFull = fmtFullAddress(depObj);
                  const arrFull = fmtFullAddress(arrObj);
                  const volume = req.estimatedVolume || req.inventory?.estimatedVolume || 0;
                  const reqDate = req.preferredDate || req.createdAt;

                  return (
                    <tr key={reqId} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 max-w-[180px]">
                        <p className="truncate">{req.title || `Demande #${String(reqId).slice(-6)}`}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          #{String(reqId).slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {clientLabel}
                        {clientObj.phone && (
                          <span className="text-[11px] text-slate-400 block">{clientObj.phone}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-medium text-slate-900 line-clamp-1" title={depFull}>
                          {depFull}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          Étage {req.departureFloor ?? depObj.floor ?? 0}{" "}
                          {req.departureElevator || depObj.hasElevator ? "(Asc.)" : ""}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <p className="font-medium text-slate-900 line-clamp-1" title={arrFull}>
                          {arrFull}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          Étage {req.arrivalFloor ?? arrObj.floor ?? 0}{" "}
                          {req.arrivalElevator || arrObj.hasElevator ? "(Asc.)" : ""}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-brand-600">
                        {volume ? `${volume} m³` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {formatDate(reqDate)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-center">
                        {req.quotesCount || 0}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => setInspectModal(req)}
                          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200 inline-flex items-center gap-1 transition-colors"
                          title="Inspecter toutes les coordonnées"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Inspection Modal */}
      {inspectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  Détail de la demande #{String(inspectModal._id || inspectModal.id).slice(-8).toUpperCase()}
                </span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  {inspectModal.title || "Projet de déménagement"}
                </h2>
                <p className="text-xs text-slate-400">
                  Créée le {formatDate(inspectModal.createdAt)} • Statut : <StatusBadge status={inspectModal.status} />
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectModal(null)}
                className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Client Coordinates */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <span className="font-bold text-brand-700 uppercase tracking-wider text-[10px]">
                Coordonnées du Client
              </span>
              <p className="text-sm font-bold text-slate-900">
                {inspectModal.client?.firstName
                  ? `${inspectModal.client.firstName} ${inspectModal.client.lastName || ""}`
                  : inspectModal.clientName || "Client"}
              </p>
              <div className="flex flex-wrap gap-4 text-slate-600">
                {inspectModal.client?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-brand-600" />
                    <strong>{inspectModal.client.phone}</strong>
                  </span>
                )}
                {inspectModal.client?.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-brand-600" />
                    <strong>{inspectModal.client.email}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Departure and Arrival Full Coordinates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-brand-600 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Home className="w-3.5 h-3.5" />
                  Adresse de Départ
                </span>
                <p className="font-bold text-slate-900">
                  {fmtFullAddress(inspectModal.departureAddress || inspectModal.departure)}
                </p>
                <div className="space-y-0.5 text-slate-600 text-[11px]">
                  <p>Logement : {inspectModal.departureHousingType || inspectModal.departure?.housingType || "Logement"}</p>
                  <p>Étage : {inspectModal.departureFloor ?? inspectModal.departure?.floor ?? 0}</p>
                  <p>Ascenseur : {inspectModal.departureElevator || inspectModal.departure?.hasElevator ? "Oui" : "Non"}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs">
                <span className="font-bold text-emerald-600 uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  Adresse d'Arrivée
                </span>
                <p className="font-bold text-slate-900">
                  {fmtFullAddress(inspectModal.arrivalAddress || inspectModal.arrival)}
                </p>
                <div className="space-y-0.5 text-slate-600 text-[11px]">
                  <p>Logement : {inspectModal.arrivalHousingType || inspectModal.arrival?.housingType || "Logement"}</p>
                  <p>Étage : {inspectModal.arrivalFloor ?? inspectModal.arrival?.floor ?? 0}</p>
                  <p>Ascenseur : {inspectModal.arrivalElevator || inspectModal.arrival?.hasElevator ? "Oui" : "Non"}</p>
                </div>
              </div>
            </div>

            {/* Volume & Details */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-2">
              <span className="font-bold text-slate-600 uppercase tracking-wider text-[10px]">
                Volume & Mobilier
              </span>
              <p className="text-slate-700">
                Volume estimé : <strong>{inspectModal.estimatedVolume || 0} m³</strong> • Cartons prévus : <strong>{inspectModal.estimatedBoxes || 0}</strong>
              </p>
              {inspectModal.comments && (
                <p className="text-slate-600 italic">"{inspectModal.comments}"</p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectModal(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
