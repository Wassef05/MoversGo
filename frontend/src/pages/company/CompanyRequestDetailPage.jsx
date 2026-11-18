import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { requestService } from "../../services/api/requestService";
import { formatDate, formatCurrency } from "../../utils/cn";
import {
  ChevronLeft,
  MapPin,
  Truck,
  Calendar,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Camera,
  ImageIcon,
  Home,
  User,
  Phone,
  Mail,
  Send,
  Package,
  ExternalLink,
  Navigation
} from "lucide-react";

export function CompanyRequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backendUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await requestService.getRequestById(id);
        const raw = res?.request || res?.movingRequest || res?.data?.request || res?.data?.movingRequest || res?.data || res;
        const data = raw?.request || raw;
        setRequest(data);
      } catch (err) {
        console.error("Error loading request:", err);
        setError("Impossible de charger les détails de cette demande.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const fmtFullAddress = (addr) => {
    if (!addr) return "Coordonnées non spécifiées";
    if (typeof addr === "string") return addr;
    const parts = [
      addr.street,
      addr.postalCode ? `${addr.postalCode} ${addr.city || ""}`.trim() : addr.city,
      addr.governorate,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
    if (addr.city || addr.governorate) return [addr.city, addr.governorate].filter(Boolean).join(" - ");
    return "Coordonnées non spécifiées";
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">{error || "Demande introuvable"}</p>
        <Link to="/company/requests" className="text-xs font-bold text-brand-600 hover:underline">
          Retour aux demandes disponibles
        </Link>
      </div>
    );
  }

  const client = request.client || {};
  const clientName = client.firstName
    ? `${client.firstName} ${client.lastName || ""}`.trim()
    : request.clientName || "Client Particulier";

  const depObj = request.departureAddress || request.departure || {};
  const arrObj = request.arrivalAddress || request.arrival || {};
  const depCity = depObj.city || "Départ";
  const arrCity = arrObj.city || "Arrivée";
  const depFull = fmtFullAddress(depObj);
  const arrFull = fmtFullAddress(arrObj);

  const photos = request.photos || [];
  const inventoryItems = request.furniture || request.inventory?.items || [];
  const volume = request.estimatedVolume || request.inventory?.estimatedVolume || 0;
  const boxes = request.estimatedBoxes || request.inventory?.boxesCount || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <Link
          to="/company/requests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour aux demandes</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {request.title || `Déménagement ${depCity} → ${arrCity}`}
            </h1>
            <p className="text-xs text-slate-500">
              Client : <strong>{clientName}</strong> • Déposé le {formatDate(request.createdAt)}
            </p>
          </div>
          <Link
            to={`/company/quotes/new/${request._id || request.id}`}
            className="px-6 py-3 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-brand flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Émettre un devis professionnel</span>
          </Link>
        </div>
      </div>

      {/* Client card info */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
            <User className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{clientName}</p>
            <p className="text-xs text-slate-500">
              Client vérifié MoversGo
            </p>
          </div>
        </div>
        {(client.phone || client.email) && (
          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            {client.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-brand-600" />
                <span>{client.phone}</span>
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-brand-600" />
                <span>{client.email}</span>
              </span>
            )}
            {client.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-600" />
                <span>Résidence client : {[client.address.city, client.address.governorate].filter(Boolean).join(", ")}</span>
                {(client.address.latitude || client.location?.latitude) && (
                  <a
                    href={`https://www.google.com/maps?q=${client.address.latitude || client.location?.latitude},${client.address.longitude || client.location?.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-emerald-700 font-bold hover:underline ml-1"
                  >
                    <span>GPS ({Number(client.address.latitude || client.location?.latitude).toFixed(3)}°, {Number(client.address.longitude || client.location?.longitude).toFixed(3)}°)</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Coordinates Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle space-y-3">
          <div className="flex items-center justify-between text-brand-600">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Adresse de Chargement (Départ)
              </span>
            </div>
            {(depObj.latitude || depObj.coordinates?.lat) && (
              <a
                href={`https://www.google.com/maps?q=${depObj.latitude || depObj.coordinates?.lat},${depObj.longitude || depObj.coordinates?.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:underline"
              >
                <span>GPS Départ</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{depFull}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Gouvernorat : <strong>{depObj.governorate || "—"}</strong> • Ville : <strong>{depObj.city || "—"}</strong>
            </p>
            {depObj.postalCode && <p className="text-xs text-slate-500">Code postal : {depObj.postalCode}</p>}
            {depObj.street && <p className="text-xs text-slate-500">Rue / Quartier : {depObj.street}</p>}
          </div>
          <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
            <p>Logement : <strong>{request.departureHousingType || depObj.housingType || "Logement"}</strong> {depObj.surface ? `(${depObj.surface} m²)` : ""}</p>
            <p>Étage : <strong>{request.departureFloor ?? depObj.floor ?? 0}</strong> • {request.departureElevator || depObj.hasElevator ? "Ascenseur disponible" : "Pas d'ascenseur"}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle space-y-3">
          <div className="flex items-center justify-between text-emerald-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Adresse de Livraison (Arrivée)
              </span>
            </div>
            {(arrObj.latitude || arrObj.coordinates?.lat) && (
              <a
                href={`https://www.google.com/maps?q=${arrObj.latitude || arrObj.coordinates?.lat},${arrObj.longitude || arrObj.coordinates?.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
              >
                <span>GPS Arrivée</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{arrFull}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Gouvernorat : <strong>{arrObj.governorate || "—"}</strong> • Ville : <strong>{arrObj.city || "—"}</strong>
            </p>
            {arrObj.postalCode && <p className="text-xs text-slate-500">Code postal : {arrObj.postalCode}</p>}
            {arrObj.street && <p className="text-xs text-slate-500">Rue / Quartier : {arrObj.street}</p>}
          </div>
          <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-1">
            <p>Logement : <strong>{request.arrivalHousingType || arrObj.housingType || "Logement"}</strong></p>
            <p>Étage : <strong>{request.arrivalFloor ?? arrObj.floor ?? 0}</strong> • {request.arrivalElevator || arrObj.hasElevator ? "Ascenseur disponible" : "Pas d'ascenseur"}</p>
          </div>
        </div>
      </div>

      {/* Date & Inventory */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            <span className="text-sm font-bold text-slate-900">
              Date demandée : {request.preferredDate ? formatDate(request.preferredDate) : "À convenir"}
            </span>
          </div>
          <span className="text-xs font-bold text-brand-700 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
            Volume estimé : ~{volume || 20} m³ ({boxes || 0} cartons)
          </span>
        </div>

        {inventoryItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {inventoryItems.map((it, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-800">{it.name}</span>
                <span className="px-2 py-0.5 rounded bg-white font-bold text-slate-700 border border-slate-200">
                  Qté : {it.quantity}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Aucun inventaire détaillé fourni.</p>
        )}

        {(request.fragileItemsDescription || request.fragileItems) && (
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
            <strong>Objets fragiles ou délicats :</strong> {request.fragileItemsDescription || "Objets fragiles à manipuler avec soin"}
          </div>
        )}

        {request.comments && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
            <strong>Consignes spécifiques du client :</strong> "{request.comments}"
          </div>
        )}
      </div>

      {/* Photos Grid if any */}
      {photos.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-600" />
              <h3 className="text-base font-bold text-slate-900">Photos transmises par le client ({photos.length})</h3>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Chambres & Mobilier à inspecter
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {photos.map((ph, idx) => {
              const pUrl = ph.filePath
                ? ph.filePath.startsWith("http")
                  ? ph.filePath
                  : `${backendUrl}/${ph.filePath.replace(/^\/+/, "")}`
                : ph.url || ph;
              return (
                <a
                  key={idx}
                  href={pUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-square block shadow-xs"
                >
                  <img
                    src={pUrl}
                    alt={ph.caption || `Photo ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold">Prêt à proposer votre offre ?</h3>
          <p className="text-xs text-slate-400">
            Votre logo et vos coordonnées professionnelles seront automatiquement apposés en en-tête sur le devis.
          </p>
        </div>
        <Link
          to={`/company/quotes/new/${request._id || request.id}`}
          className="px-6 py-3 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-brand flex items-center gap-2 whitespace-nowrap"
        >
          <Send className="w-4 h-4" />
          <span>Émettre un devis maintenant</span>
        </Link>
      </div>
    </div>
  );
}
