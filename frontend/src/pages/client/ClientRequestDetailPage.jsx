import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { requestService } from "../../services/api/requestService";
import { quoteService } from "../../services/api/quoteService";
import { useNotifications } from "../../contexts/NotificationContext";
import { StatusBadge } from "../../components/common/StatusBadge";
import { RatingStars } from "../../components/common/RatingStars";
import { formatCurrency, formatDate } from "../../utils/cn";
import {
  MapPin,
  Calendar,
  Truck,
  Package,
  CheckCircle2,
  ChevronLeft,
  ArrowRight,
  Scale,
  Camera,
  ImageIcon,
  Home,
  Building2,
  Layers,
  Phone,
  Mail,
  User,
  ShieldCheck,
  AlertCircle,
  Edit3,
  Lock
} from "lucide-react";

export function ClientRequestDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { onQuoteUpdate } = useNotifications();
  const [request, setRequest] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const backendUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      let reqData = null;
      try {
        const res = await requestService.getRequestById(id);
        const raw = res?.request || res?.movingRequest || res?.data?.request || res?.data?.movingRequest || res?.data || res;
        reqData = raw?.request || raw;
      } catch (e) {
        console.error("Erreur getRequestById:", e);
      }

      let quoteList = [];
      try {
        const resQuotes = await quoteService.getClientQuotes({ movingRequestId: id, limit: 100 });
        quoteList = resQuotes?.data || (Array.isArray(resQuotes) ? resQuotes : []);
      } catch (e) {
        console.error("Erreur getClientQuotes:", e);
      }

      setRequest(reqData);
      setQuotes(quoteList || []);
    } catch (err) {
      console.error("Error loading request details:", err);
      if (!silent) setError("Impossible de charger les détails de cette demande.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const unregister = onQuoteUpdate?.(() => {
      load(true);
    });
    return () => {
      if (typeof unregister === "function") unregister();
    };
  }, [id, onQuoteUpdate]);

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

  if (!request) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">Demande introuvable</p>
        <Link to="/client/requests" className="text-xs font-bold text-brand-600 hover:underline">
          Retour à la liste des demandes
        </Link>
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* Return button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/client/requests"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Toutes mes demandes</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              {request.title || `Déménagement ${depCity} → ${arrCity}`}
            </h1>
            <StatusBadge status={request.status} />
          </div>
          <p className="text-xs text-slate-500">
            Publiée le {formatDate(request.createdAt)} • Référence #{String(request._id || request.id).slice(-6).toUpperCase()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {quotes.length === 0 && (!request.quotesCount || request.quotesCount === 0) && request.status === "pending" ? (
            <Link
              to={`/client/requests/${request._id || request.id}/edit`}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4 text-brand-600" />
              <span>Modifier ma demande</span>
            </Link>
          ) : quotes.length > 0 || (request.quotesCount && request.quotesCount > 0) ? (
            <span className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold flex items-center gap-1.5 select-none">
              <Lock className="w-4 h-4 text-amber-600" />
              <span>Publication verrouillée ({quotes.length || request.quotesCount} devis)</span>
            </span>
          ) : null}

          {quotes.length > 0 && (
            <Link
              to={`/client/compare?requestId=${request._id || request.id}`}
              className="px-4 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand flex items-center gap-1.5"
            >
              <Scale className="w-4 h-4" />
              <span>Comparer les {quotes.length} devis</span>
            </Link>
          )}
        </div>
      </div>

      {location.state?.updatedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Votre publication a été modifiée avec succès !</span>
        </div>
      )}

      {location.state?.publishedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Votre demande a été publiée avec succès ! Les déménageurs partenaires de votre région l'examinent actuellement.</span>
        </div>
      )}

      {(quotes.length > 0 || (request.quotesCount && request.quotesCount > 0)) && (
        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-900 text-xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-amber-950">Publication verrouillée</p>
            <p className="text-[11px] text-amber-800">
              Cette demande a reçu {quotes.length > 0 ? quotes.length : request.quotesCount} offre(s) de devis. Afin de préserver la validité contractuelle et l'équité des tarifs proposés, les paramètres de ce déménagement ne peuvent plus être modifiés.
            </p>
          </div>
        </div>
      )}

      {/* Grid: Route info & Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Departure & Arrival Detailed Coordinates Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle space-y-3">
              <div className="flex items-center gap-2 text-brand-600">
                <Home className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Coordonnées de Départ
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{depFull}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gouvernorat : <strong>{depObj.governorate || "—"}</strong> • Ville : <strong>{depObj.city || "—"}</strong>
                </p>
                {depObj.postalCode && (
                  <p className="text-xs text-slate-500">Code postal : {depObj.postalCode}</p>
                )}
                {depObj.street && (
                  <p className="text-xs text-slate-500">Rue / Adresse : {depObj.street}</p>
                )}
                {((depObj.latitude && depObj.longitude) || request.departureLocation?.coordinates) && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#800020] bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                      📍 GPS exact : {depObj.latitude || request.departureLocation?.coordinates?.[1]}, {depObj.longitude || request.departureLocation?.coordinates?.[0]}
                    </span>
                  </div>
                )}
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <p>Type de logement : <strong>{request.departureHousingType || depObj.housingType || "Logement"}</strong> {depObj.surface ? `(${depObj.surface} m²)` : ""}</p>
                <p>Étage : <strong>{request.departureFloor ?? depObj.floor ?? 0}</strong> ({request.departureElevator || depObj.hasElevator ? "Avec ascenseur" : "Sans ascenseur"})</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle space-y-3">
              <div className="flex items-center gap-2 text-emerald-600">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Coordonnées d'Arrivée
                </span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{arrFull}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gouvernorat : <strong>{arrObj.governorate || "—"}</strong> • Ville : <strong>{arrObj.city || "—"}</strong>
                </p>
                {arrObj.postalCode && (
                  <p className="text-xs text-slate-500">Code postal : {arrObj.postalCode}</p>
                )}
                {arrObj.street && (
                  <p className="text-xs text-slate-500">Rue / Adresse : {arrObj.street}</p>
                )}
              </div>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <p>Type de logement : <strong>{request.arrivalHousingType || arrObj.housingType || "Logement"}</strong></p>
                <p>Étage : <strong>{request.arrivalFloor ?? arrObj.floor ?? 0}</strong> ({request.arrivalElevator || arrObj.hasElevator ? "Avec ascenseur" : "Sans ascenseur"})</p>
              </div>
            </div>
          </div>

          {/* Schedule & Additional Services */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Date et Prestations souhaitées</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <p className="text-slate-400">Date souhaitée :</p>
                <p className="font-semibold text-slate-900">
                  {request.preferredDate ? formatDate(request.preferredDate) : "À convenir"}
                  {request.flexibleDates && " (Flexible)"}
                </p>
              </div>
              {request.estimatedBudget && (
                <div>
                  <p className="text-slate-400">Budget estimé :</p>
                  <p className="font-semibold text-slate-900">{formatCurrency(request.estimatedBudget)}</p>
                </div>
              )}
            </div>

            {request.comments && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                <strong>Remarques complémentaires :</strong> "{request.comments}"
              </div>
            )}
          </div>

          {/* Inventory Items list */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Inventaire du mobilier</h3>
                <p className="text-xs text-slate-500">
                  Volume estimé : ~{volume || 20} m³
                </p>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                {boxes || 0} cartons prévus
              </span>
            </div>

            {inventoryItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {inventoryItems.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{item.name}</span>
                    <span className="px-2 py-0.5 rounded bg-white font-bold text-slate-700 border border-slate-200">
                      x{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Aucun meuble spécifique listé.</p>
            )}

            {(request.fragileItemsDescription || request.fragileItems) && (
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
                <strong>Attention objets fragiles / délicats :</strong> {request.fragileItemsDescription || "Présence d'objets fragiles"}
              </div>
            )}
          </div>

          {/* Photos du Déménagement */}
          {photos.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-brand-600" />
                  <h3 className="text-base font-bold text-slate-900">Photos transmises du logement ({photos.length})</h3>
                </div>
                <span className="text-xs text-slate-400">Visibles par les déménageurs certifiés</span>
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
        </div>

        {/* Right Column: Quotes list */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Devis reçus ({quotes.length})</h3>
              {quotes.length > 1 && (
                <Link
                  to={`/client/compare?requestId=${request._id || request.id}`}
                  className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>Comparer</span>
                </Link>
              )}
            </div>

            {quotes.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Truck className="w-8 h-8 text-slate-300 mx-auto animate-pulse" />
                <p className="text-xs text-slate-500 font-semibold">Aucun devis reçu pour l'instant</p>
                <p className="text-[11px] text-slate-400">
                  Les déménageurs partenaires de votre région examinent actuellement votre demande. Vous serez notifié dès réception d'un devis.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {quotes.map((q) => {
                  const qId = q._id || q.id;
                  const company = q.company || {};
                  const compName = company.companyName || "Déménageur";
                  const total = q.totalPrice || q.pricing?.total || 0;
                  const deposit = q.depositAmount || q.pricing?.depositRequired || Math.round(total * 0.3);

                  return (
                    <div key={qId} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">{compName}</p>
                        <RatingStars rating={company.averageRating || 5} size="xs" />
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-base font-extrabold text-slate-900">
                            {formatCurrency(total)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Acompte : {formatCurrency(deposit)}
                          </span>
                        </div>
                        <Link
                          to={`/client/quotes/${qId}`}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-brand-600 transition-colors"
                        >
                          Voir l'offre
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
