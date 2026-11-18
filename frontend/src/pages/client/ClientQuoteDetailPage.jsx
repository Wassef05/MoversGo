import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { quoteService } from "../../services/api/quoteService";
import { messageService } from "../../services/api/messageService";
import { StatusBadge } from "../../components/common/StatusBadge";
import { RatingStars } from "../../components/common/RatingStars";
import { formatCurrency, formatDate, getLogoUrl } from "../../utils/cn";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShieldCheck,
  Clock,
  MessageSquare,
  AlertCircle,
  Printer,
  Calendar,
  Truck,
  Download,
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

export function ClientQuoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  const handleAccept = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir accepter ce devis officiel et valider votre réservation ?")) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await quoteService.acceptQuote(id);
      const bookingId = res?.data?.booking?._id || res?.booking?._id;
      setSuccess("Félicitations ! Le devis a été accepté et la réservation confirmée.");
      setTimeout(() => {
        navigate(bookingId ? `/client/bookings/${bookingId}` : "/client/bookings", {
          state: { bookingCreated: true },
        });
      }, 1500);
    } catch (err) {
      setError(err.message || "Erreur lors de l'acceptation du devis.");
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Voulez-vous vraiment décliner ce devis ?")) return;
    setRejecting(true);
    setError(null);
    try {
      await quoteService.rejectQuote(id, "Offre déclinée par le client.");
      setQuote((prev) => ({ ...prev, status: "rejected" }));
    } catch (err) {
      setError(err.message || "Erreur lors du refus du devis.");
    } finally {
      setRejecting(false);
    }
  };

  const handleOpenChat = async () => {
    const companyUserId = quote?.company?.user;
    if (!companyUserId) {
      navigate("/client/messages");
      return;
    }
    setOpeningChat(true);
    try {
      const res = await messageService.getOrCreateConversation(companyUserId);
      // After messageService fix: res = { conversation: {...} }
      const convId = res?.conversation?._id || res?._id;
      navigate(convId ? `/client/messages?conversationId=${convId}` : "/client/messages");
    } catch {
      navigate("/client/messages");
    } finally {
      setOpeningChat(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">{error}</p>
        <Link to="/client/quotes" className="text-xs font-bold text-brand-600 hover:underline">
          Retour à la liste des devis
        </Link>
      </div>
    );
  }

  if (!quote) return null;

  const company = quote.company || {};
  const companyName = company.companyName || "Entreprise de Déménagement";
  const companyLogoSrc = getLogoUrl(company.logo);
  const companyPhone = company.phone || "—";
  const companyEmail = company.email || "—";
  const companyAddr = fmtAddr(company.address) || "Tunisie";
  const companyMatricule = company.legalIdentifier || null;

  const request = quote.movingRequest || {};
  const client = request.client || {};
  const depAddr = fmtAddr(request.departureAddress);
  const arrAddr = fmtAddr(request.arrivalAddress);

  const total = quote.totalPrice || 0;
  const deposit = quote.depositAmount || Math.round(total * 0.3);
  let priceDetails = quote.priceDetails || {};
  if (typeof priceDetails === "string") {
    try {
      priceDetails = JSON.parse(priceDetails);
    } catch { }
  }
  const isActive = ["submitted", "viewed"].includes(quote.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/client/quotes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour aux devis</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Devis Officiel #{String(quote._id || "").slice(-8).toUpperCase()}
            </h1>
            <StatusBadge status={quote.status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimer</span>
          </button>
          {quote.status === "accepted" && (
            <button
              type="button"
              onClick={handleOpenChat}
              disabled={openingChat}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-brand transition-colors disabled:opacity-60"
            >
              {openingChat ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <MessageSquare className="w-3.5 h-3.5" />
              )}
              <span>Contacter le déménageur</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Official Letterhead Document */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
        {/* En-tête de l'entreprise (Header banner) */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            {/* Company Logo & Legal Coordinates */}
            <div className="flex items-start gap-4">
              {companyLogoSrc ? (
                <div className="w-16 h-16 sm:w-20 sm:h-20 max-w-[80px] max-h-[80px] rounded-2xl border-2 border-white/20 shadow-md flex-shrink-0 bg-white p-1.5 flex items-center justify-center overflow-hidden">
                  <img
                    src={companyLogoSrc}
                    alt={companyName}
                    className="w-full h-full object-contain rounded-xl"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 max-w-[80px] max-h-[80px] rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0 border border-white/20">
                  <Building2 className="w-8 h-8 text-white/80" />
                </div>
              )}
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{companyName}</h2>
                {companyMatricule && (
                  <p className="text-xs text-slate-300 font-medium">
                    Matricule Fiscal / RNE : <span className="text-white font-mono">{companyMatricule}</span>
                  </p>
                )}
                <div className="pt-1 space-y-0.5 text-xs text-slate-300">
                  {companyPhone !== "—" && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-brand-400" />
                      <span>{companyPhone}</span>
                    </div>
                  )}
                  {companyEmail !== "—" && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-brand-400" />
                      <span>{companyEmail}</span>
                    </div>
                  )}
                  {companyAddr && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <MapPin className="w-3 h-3 text-brand-400" />
                      <span>{companyAddr}</span>
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
                <div className="pt-1">
                  <RatingStars
                    rating={company.averageRating || 5}
                    count={company.totalReviews || 0}
                    size="xs"
                  />
                </div>
              </div>
            </div>

            {/* Quote metadata card */}
            <div className="text-left sm:text-right">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/10 space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-300 font-bold block">
                  Devis Commercial
                </span>
                <p className="text-lg font-mono font-extrabold text-white">
                  N° {String(quote._id || "").slice(-8).toUpperCase()}
                </p>
                <div className="pt-2 text-xs text-slate-300 space-y-0.5">
                  <p>Émis le : <strong>{formatDate(quote.createdAt)}</strong></p>
                  <p>Validité : <strong>{formatDate(quote.validityDate)}</strong></p>
                  {quote.estimatedDuration && (
                    <p>Durée : <strong>{quote.estimatedDuration}</strong></p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client & Route Box */}
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
            </div>

            <div>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                Itinéraire de Déménagement
              </span>
              <p className="text-xs text-slate-700">
                <strong>Départ :</strong> {depAddr || "Coordonnées de départ"}
              </p>
              <p className="text-xs text-slate-700 mt-1">
                <strong>Arrivée :</strong> {arrAddr || "Coordonnées d'arrivée"}
              </p>
              {quote.proposedDate && (
                <p className="text-xs text-brand-700 font-semibold mt-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date d'intervention convenue : {formatDate(quote.proposedDate)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Itemized Pricing Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-brand-600" />
              <span>Ventilation des tarifs (en Dinars Tunisiens TTC)</span>
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
              {Object.keys(priceDetails).length > 0 ? (
                Object.entries(priceDetails).map(([key, val]) => {
                  const numVal = parseFloat(val);
                  if (isNaN(numVal) || numVal <= 0) return null;
                  const labelMap = {
                    transport: "Véhicule utilitaire capitonné et acheminement routier",
                    packaging: "Prestation emballage et protection soignée des biens",
                    disassembly: "Démontage et réassemblage du mobilier",
                    furnitureLift: "Mise à disposition monte-meubles avec technicien qualifié",
                    insurance: "Garantie assurance marchandises en transit",
                    discount: "Remise commerciale accordée",
                    baseFee: "Frais de base logistique",
                    laborFee: "Main d'œuvre déménageurs qualifiés",
                    transportFee: "Acheminement & Transport routier",
                    packingFee: "Cartons & Fournitures d'emballage",
                    truckLiftFee: "Monte-meubles extérieur",
                    storageFee: "Garde-meubles sécurisé",
                    otherFees: "Prestations complémentaires",
                  };
                  const label = labelMap[key] || key.replace(/([A-Z])/g, " $1");
                  const isDiscount = key === "discount";
                  return (
                    <div key={key} className="py-3 px-5 flex justify-between items-center hover:bg-slate-50/50">
                      <span className={isDiscount ? "text-emerald-700 font-medium" : "text-slate-700"}>
                        {label}
                      </span>
                      <strong className={isDiscount ? "text-emerald-700" : "text-slate-900"}>
                        {isDiscount ? `- ${formatCurrency(numVal)}` : formatCurrency(numVal)}
                      </strong>
                    </div>
                  );
                })
              ) : (
                <div className="py-3 px-5 flex justify-between items-center">
                  <span className="text-slate-700">Prestation forfaitaire globale de déménagement</span>
                  <strong className="text-slate-900">{formatCurrency(total)}</strong>
                </div>
              )}

              {/* Total Row */}
              <div className="py-4 px-5 flex justify-between items-center bg-slate-100/70 font-bold text-sm">
                <span className="text-slate-900">Total Net TTC à payer :</span>
                <span className="text-brand-600 text-xl font-extrabold">{formatCurrency(total)}</span>
              </div>

              {/* Deposit Row */}
              <div className="py-3.5 px-5 flex justify-between items-center bg-brand-50/50 text-brand-800 text-xs font-semibold">
                <span>Acompte de confirmation exigible ({quote.depositPercent || 30}%) :</span>
                <span className="text-sm font-bold text-brand-700">{formatCurrency(deposit)}</span>
              </div>
            </div>
          </div>

          {/* Included Services */}
          {quote.includedServices && quote.includedServices.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Prestations Incluses dans le devis</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {quote.includedServices.map((srv, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="font-medium">{srv}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Excluded Services */}
          {quote.excludedServices && quote.excludedServices.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                <span>Prestations Non Comprises dans le devis</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {quote.excludedServices.map((srv, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50/60 border border-red-200/80 text-red-900"
                  >
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span>{srv}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company Notes */}
          {quote.notes && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
              <strong>Message du transporteur :</strong> "{quote.notes}"
            </div>
          )}

          {/* Terms & Conditions */}
          {quote.terms && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <strong className="text-slate-800">Conditions d'intervention :</strong> {quote.terms}
            </div>
          )}

          {/* Guarantee Footer */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white text-xs flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <p className="text-slate-300">
              <strong>Séquestre garanti MoversGo :</strong> Votre acompte est bloqué sur compte séquestre et n'est libéré au déménageur qu'à bonne exécution. Le solde restant est réglé le jour de la livraison.
            </p>
          </div>

          {/* Action CTAs */}
          {isActive && (
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                Offre valable jusqu'au <strong>{formatDate(quote.validityDate)}</strong>
              </p>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={rejecting || accepting}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl border border-red-200 text-red-600 font-bold text-xs hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Décliner</span>
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={accepting || rejecting}
                  className="w-full sm:w-auto px-7 py-3 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition-colors shadow-brand flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {accepting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Accepter ce devis ({formatCurrency(total)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {quote.status === "accepted" && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold text-center space-y-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-sm">Cette offre a été validée et transformée en réservation officielle.</p>
              <div className="pt-2 flex justify-center gap-3">
                <Link
                  to="/client/bookings"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  Suivre ma réservation
                </Link>
                <button
                  type="button"
                  onClick={handleOpenChat}
                  disabled={openingChat}
                  className="px-4 py-2 rounded-xl border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 disabled:opacity-60"
                >
                  {openingChat && <div className="w-3 h-3 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />}
                  Discuter avec le déménageur
                </button>
              </div>
            </div>
          )}

          {quote.status === "rejected" && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold text-center">
              Ce devis a été décliné.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
