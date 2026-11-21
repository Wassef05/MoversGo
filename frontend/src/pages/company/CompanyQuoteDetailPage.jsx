import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { quoteService } from "../../services/api/quoteService";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate, getLogoUrl } from "../../utils/cn";
import {
  ChevronLeft,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Printer,
  ExternalLink,
  Navigation
} from "lucide-react";

function fmtAddr(addr) {
  if (!addr) return null;
  if (typeof addr === "string") return addr;
  return [addr.street, addr.postalCode ? `${addr.postalCode} ${addr.city || ""}`.trim() : addr.city, addr.governorate]
    .filter(Boolean)
    .join(", ");
}

export function CompanyQuoteDetailPage() {
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await quoteService.getQuoteById(id);
        const q = res?.data?.quote || res?.quote || res?.data || res;
        setQuote(q);
      } catch (err) {
        console.error("Erreur chargement devis:", err);
        setError(err.message || "Impossible de charger ce devis.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">{error || "Devis introuvable"}</p>
        <Link to="/company/quotes" className="text-xs font-bold text-brand-600 hover:underline">
          Retour à la liste des devis
        </Link>
      </div>
    );
  }

  const quoteId = quote._id || quote.id;
  const company = quote.company || {};
  const compName = company.companyName || "Mon Entreprise";
  const compLogo = getLogoUrl(company.logo);
  const total = quote.totalPrice || 0;
  const quotePercent =
    quote.depositPercent ||
    quote.depositPercentage ||
    (total > 0 && quote.depositAmount ? Math.round((quote.depositAmount / total) * 100) : 30);
  const deposit = quote.depositAmount || Math.round(total * (quotePercent / 100));
  const priceDetails = quote.priceDetails || {};
  const movingReq = quote.movingRequest || {};
  const client = movingReq.client || {};
  const depAddr = fmtAddr(movingReq.departureAddress);
  const arrAddr = fmtAddr(movingReq.arrivalAddress);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-1">
        <Link
          to="/company/quotes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour à mes devis émis</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Devis Officiel #{String(quoteId).slice(-8).toUpperCase()}
            </h1>
            <p className="text-xs text-slate-500">
              Pour : {movingReq.title || "Projet de déménagement"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={quote.status} />
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Official Letterhead View */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              {compLogo ? (
                <img
                  src={compLogo}
                  alt={compName}
                  className="w-16 h-16 rounded-2xl object-contain border-2 border-white/20 shadow-md bg-white p-1 flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Building2 className="w-8 h-8 text-white/80" />
                </div>
              )}
              <div>
                <h2 className="text-xl font-extrabold text-white">{compName}</h2>
                {company.legalIdentifier && (
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    Matricule / RNE : {company.legalIdentifier}
                  </p>
                )}
                <div className="mt-2 space-y-0.5 text-xs text-slate-300">
                  {company.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-brand-400" />
                      <span>{company.phone}</span>
                    </div>
                  )}
                  {company.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-brand-400" />
                      <span>{company.email}</span>
                    </div>
                  )}
                  {company.address && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <MapPin className="w-3 h-3 text-brand-400" />
                      <span>{fmtAddr(company.address)}</span>
                      {(company.address?.latitude || company.location?.latitude) && (
                        <a
                          href={`https://www.google.com/maps?q=${company.address?.latitude || company.location?.latitude},${company.address?.longitude || company.location?.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-400/30 text-[10px] font-bold hover:bg-brand-500/40 transition-colors"
                        >
                          <Navigation className="w-2.5 h-2.5" />
                          <span>GPS Dépôt ({Number(company.address?.latitude || company.location?.latitude).toFixed(3)}°, {Number(company.address?.longitude || company.location?.longitude).toFixed(3)}°)</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block">
                  Devis Émis
                </span>
                <p className="text-xl font-mono font-extrabold text-white">
                  N° {String(quoteId).slice(-8).toUpperCase()}
                </p>
                <div className="pt-2 text-xs text-slate-300 space-y-0.5">
                  <p>Émis le : <strong>{formatDate(quote.createdAt)}</strong></p>
                  <p>Valide jusqu'au : <strong>{formatDate(quote.validityDate)}</strong></p>
                  {quote.estimatedDuration && (
                    <p>Durée : <strong>{quote.estimatedDuration}</strong></p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client & Itinerary */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Destinataire (Client)
              </span>
              <p className="text-sm font-bold text-slate-900">
                {client.firstName ? `${client.firstName} ${client.lastName || ""}` : "Client MoversGo"}
              </p>
              {client.phone && <p className="text-xs text-slate-600 mt-0.5">Tél : {client.phone}</p>}
              {client.email && <p className="text-xs text-slate-600">Email : {client.email}</p>}
              {client.address && (
                <p className="text-xs text-slate-600 mt-0.5">
                  Localisation : {[client.address.city, client.address.governorate].filter(Boolean).join(", ")}
                  {(client.address.latitude || client.location?.latitude) && (
                    <span className="text-emerald-700 font-mono text-[10px] ml-1">
                      (GPS: {Number(client.address.latitude || client.location?.latitude).toFixed(3)}°, {Number(client.address.longitude || client.location?.longitude).toFixed(3)}°)
                    </span>
                  )}
                </p>
              )}
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Itinéraire de la Prestation
              </span>
              <p className="text-xs text-slate-700">
                <strong>Départ :</strong> {depAddr || "Adresse non spécifiée"}
              </p>
              <p className="text-xs text-slate-700 mt-1">
                <strong>Arrivée :</strong> {arrAddr || "Adresse non spécifiée"}
              </p>
              {quote.proposedDate && (
                <p className="text-xs text-brand-700 font-semibold mt-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date proposée : {formatDate(quote.proposedDate)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Financial details table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ventilation des tarifs TTC
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
              {Object.entries(priceDetails).map(([key, val]) => {
                const numVal = parseFloat(val);
                if (isNaN(numVal) || numVal <= 0) return null;
                const isDiscount = key === "discount";
                return (
                  <div key={key} className="py-3 px-5 flex justify-between items-center">
                    <span className="text-slate-700 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                    <strong className={isDiscount ? "text-emerald-700" : "text-slate-900"}>
                      {isDiscount ? `- ${formatCurrency(numVal)}` : formatCurrency(numVal)}
                    </strong>
                  </div>
                );
              })}
              <div className="py-4 px-5 flex justify-between items-center bg-slate-100/70 font-bold text-sm">
                <span className="text-slate-900">Total Net TTC :</span>
                <span className="text-brand-600 text-xl font-extrabold">{formatCurrency(total)}</span>
              </div>
              <div className="py-3.5 px-5 flex justify-between items-center bg-brand-50/50 text-brand-800 text-xs font-semibold">
                <span>Acompte client ({quotePercent}%) :</span>
                <span className="text-sm font-bold text-brand-700">{formatCurrency(deposit)}</span>
              </div>
            </div>
          </div>

          {/* Included Services */}
          {quote.includedServices?.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Services Inclus
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {quote.includedServices.map((srv, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{srv}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {quote.notes && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
              <strong>Message transmis au client :</strong> "{quote.notes}"
            </div>
          )}

          {/* Terms */}
          {quote.terms && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-800">Conditions de la proposition :</strong> {quote.terms}
            </div>
          )}

          {/* Accepted Booking CTA */}
          {quote.status === "accepted" && (
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-bold">Cette offre a été validée par le client et transformée en réservation officielle !</span>
              </div>
              <p className="text-slate-600">
                L'acompte de {formatCurrency(deposit)} a été consigné sur le compte séquestre. Vous pouvez dès à présent consulter la feuille de route de cette mission et enclencher les étapes d'exécution logistique.
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <Link
                  to="/company/bookings"
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Accéder à mes réservations & tournées ➔
                </Link>
                <Link
                  to="/company/messages"
                  className="px-4 py-2.5 rounded-xl border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  Ouvrir la messagerie avec le client
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
