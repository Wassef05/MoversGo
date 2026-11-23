import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { quoteService } from "../../services/api/quoteService";
import { requestService } from "../../services/api/requestService";
import { RatingStars } from "../../components/common/RatingStars";
import { formatCurrency, formatDate, getLogoUrl } from "../../utils/cn";
import {
  Check,
  X,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  MessageSquare,
  Scale,
  MapPin,
} from "lucide-react";

export function ClientComparePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedId = searchParams.get("requestId");

  const [allRequests, setAllRequests] = useState([]);
  const [selectedRequestId, setSelectedRequestId] = useState(requestedId || "all");
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingQuoteId, setAcceptingQuoteId] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);
  const [error, setError] = useState(null);

  // Load client requests
  useEffect(() => {
    async function loadRequests() {
      try {
        const res = await requestService.getMyRequests({ limit: 100 });
        const list = res?.data?.movingRequests || res?.data?.requests || res?.data || (Array.isArray(res) ? res : []);
        setAllRequests(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error("Error loading requests:", e);
      }
    }
    loadRequests();
  }, []);

  // Load quotes based on selectedRequestId
  useEffect(() => {
    async function loadQuotes() {
      setLoading(true);
      setError(null);
      try {
        const params = { limit: 100 };
        if (selectedRequestId && selectedRequestId !== "all") {
          params.movingRequestId = selectedRequestId;
        }
        const res = await quoteService.getClientQuotes(params);
        const list = res?.data || (Array.isArray(res) ? res : []);
        setQuotes(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Error loading quotes for comparison:", err);
        setError("Erreur lors du chargement des devis.");
      } finally {
        setLoading(false);
      }
    }
    loadQuotes();
  }, [selectedRequestId]);

  const handleAcceptOffer = async (quoteId) => {
    if (!window.confirm("Confirmer la sélection de ce devis officiel ?")) return;
    setAcceptingQuoteId(quoteId);
    setError(null);
    try {
      const res = await quoteService.acceptQuote(quoteId);
      const bookingId = res?.data?.booking?._id || res?.booking?._id;
      setSuccessInfo({
        bookingId,
        quoteId,
      });
    } catch (err) {
      console.error("Erreur acceptation devis:", err);
      setError(err.message || "Erreur lors de l'acceptation de l'offre.");
    } finally {
      setAcceptingQuoteId(null);
    }
  };

  // Find lowest price to highlight
  const validQuotes = quotes.filter((q) => !["cancelled", "expired"].includes(q.status));
  const minPrice = validQuotes.length > 0 ? Math.min(...validQuotes.map((q) => q.totalPrice || 999999)) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 px-3.5 py-1 rounded-full border border-brand-200 inline-flex items-center gap-1.5">
          <Scale className="w-3.5 h-3.5" />
          <span>Comparateur Intelligent d'Offres</span>
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Comparaison détaillée des devis reçus
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Comparez en un clin d'œil les prestations, logos d'entreprises, tarifs TTC et garanties avant de réserver
        </p>

        {/* Request selector if user has multiple requests */}
        {allRequests.length > 0 && (
          <div className="pt-3 flex items-center justify-center gap-2">
            <span className="text-xs font-semibold text-slate-600">Projet :</span>
            <select
              value={selectedRequestId}
              onChange={(e) => setSelectedRequestId(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 shadow-xs focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="all">Tous mes projets de déménagement ({quotes.length} devis)</option>
              {allRequests.map((r) => {
                const rId = r._id || r.id;
                const dep = r.departureAddress?.city || r.departure?.city || "Départ";
                const arr = r.arrivalAddress?.city || r.arrival?.city || "Arrivée";
                return (
                  <option key={rId} value={rId}>
                    {r.title || `${dep} → ${arr}`} ({r.quotesCount || 0} devis)
                  </option>
                );
              })}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 max-w-2xl mx-auto">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successInfo && (
        <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-3 max-w-2xl mx-auto shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <h3 className="text-sm font-bold">Félicitations ! Votre devis a été accepté avec succès</h3>
          </div>
          <p className="text-xs text-emerald-700">
            Votre réservation a été créée. Les coordonnées ont été échangées et vous pouvez dès à présent discuter en direct avec le déménageur sélectionné.
          </p>
          <div className="flex gap-3 pt-1">
            <Link
              to={successInfo.bookingId ? `/client/bookings/${successInfo.bookingId}` : "/client/bookings"}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
            >
              Voir ma réservation
            </Link>
            <Link
              to="/client/messages"
              className="px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-bold hover:bg-emerald-50 flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Ouvrir la messagerie</span>
            </Link>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : validQuotes.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-3 max-w-xl mx-auto">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Aucun devis disponible pour la comparaison</h3>
          <p className="text-xs text-slate-400">
            Dès que des déménageurs partenaires vous soumettront leurs devis officiels, ils apparaîtront ici pour une comparaison côte-à-côte.
          </p>
          <div className="pt-2">
            <Link
              to="/client/requests"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:underline"
            >
              Consulter mes demandes
            </Link>
          </div>
        </div>
      ) : (
        /* Comparison Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {validQuotes.map((q) => {
            const quoteId = q._id || q.id;
            const company = q.company || {};
            const compName = company.companyName || "Déménageur Partenaire";
            const compLogo = getLogoUrl(company.logo);
            const compRating = company.averageRating || 5;
            const compReviews = company.totalReviews || 0;
            const total = q.totalPrice || 0;
            const pct = q.depositPercent || q.depositPercentage || q.pricing?.depositPercentage || (total > 0 && q.depositAmount ? Math.round((q.depositAmount / total) * 100) : 30);
            const deposit = q.depositAmount || Math.round(total * (pct / 100));
            const isBestPrice = total === minPrice && validQuotes.length > 1;
            const isAccepted = q.status === "accepted";
            const isAccepting = acceptingQuoteId === quoteId;
            const movingReq = q.movingRequest || {};
            const priceDetails = q.priceDetails || {};

            return (
              <div
                key={quoteId}
                className={`bg-white rounded-3xl border flex flex-col justify-between transition-all relative overflow-hidden ${isAccepted
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                  : isBestPrice
                    ? "border-brand-500 shadow-xl ring-2 ring-brand-500/20"
                    : "border-slate-200/90 shadow-subtle hover:shadow-card"
                  }`}
              >
                {isBestPrice && !isAccepted && (
                  <div className="bg-brand-600 text-white text-center py-1 text-[11px] font-bold tracking-wide flex items-center justify-center gap-1 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Meilleur Tarif Garanti</span>
                  </div>
                )}

                {isAccepted && (
                  <div className="bg-emerald-600 text-white text-center py-1 text-[11px] font-bold tracking-wide flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Offre Retenue & Validée</span>
                  </div>
                )}

                {/* Card Header & Price */}
                <div className="p-6 border-b border-slate-100 space-y-4">
                  <div className="flex items-start gap-3">
                    {compLogo ? (
                      <img
                        src={compLogo}
                        alt={compName}
                        className="w-14 h-14 rounded-2xl object-contain border border-slate-200 bg-white p-0.5 shadow-sm flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-7 h-7 text-brand-500" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {compName}
                      </h3>
                      {company.legalIdentifier && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          RNE : {company.legalIdentifier}
                        </p>
                      )}
                      <div className="mt-1">
                        <RatingStars rating={compRating} count={compReviews} size="xs" />
                      </div>
                      {(company.address?.city || company.address?.governorate) && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                          <MapPin className="w-3 h-3 text-brand-500 flex-shrink-0" />
                          <span className="truncate">Dépôt : {[company.address?.city, company.address?.governorate].filter(Boolean).join(", ")}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {formatCurrency(total)}
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                      Acompte ({pct}%) : {formatCurrency(deposit)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">
                      Durée : <strong>{q.estimatedDuration || "1 jour"}</strong>
                    </span>
                  </div>

                  {q.proposedDate && (
                    <div className="flex items-center gap-2 text-xs text-brand-700 bg-brand-50/60 p-2.5 rounded-xl border border-brand-100">
                      <Calendar className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                      <span>Date proposée : <strong>{formatDate(q.proposedDate)}</strong></span>
                    </div>
                  )}
                </div>

                {/* Itemized Price Details */}
                <div className="p-6 space-y-4 text-xs flex-1">
                  <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Détail de la facturation :
                  </p>

                  <div className="space-y-2 text-slate-600">
                    <div className="flex justify-between">
                      <span>Transport & Camion :</span>
                      <strong className="text-slate-900">
                        {formatCurrency(priceDetails.transport || total * 0.6)}
                      </strong>
                    </div>
                    {priceDetails.packaging > 0 && (
                      <div className="flex justify-between">
                        <span>Emballage délicat :</span>
                        <strong className="text-slate-900">
                          {formatCurrency(priceDetails.packaging)}
                        </strong>
                      </div>
                    )}
                    {priceDetails.disassembly > 0 && (
                      <div className="flex justify-between">
                        <span>Démontage/Remontage :</span>
                        <strong className="text-slate-900">
                          {formatCurrency(priceDetails.disassembly)}
                        </strong>
                      </div>
                    )}
                    {priceDetails.furnitureLift > 0 && (
                      <div className="flex justify-between">
                        <span>Monte-meuble sur voie :</span>
                        <strong className="text-slate-900">
                          {formatCurrency(priceDetails.furnitureLift)}
                        </strong>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-700">
                      <span>Assurance marchandises :</span>
                      <strong>
                        {priceDetails.insurance ? formatCurrency(priceDetails.insurance) : "Incluse"}
                      </strong>
                    </div>
                  </div>

                  {/* Included Services */}
                  {(() => {
                    const servicesList = Array.isArray(q.includedServices)
                      ? q.includedServices
                      : typeof q.includedServices === "string"
                        ? q.includedServices.split(",").map((s) => s.trim()).filter(Boolean)
                        : [];
                    if (servicesList.length === 0) return null;
                    return (
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <p className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                          Prestations comprises :
                        </p>
                        <ul className="space-y-1.5">
                          {servicesList.slice(0, 4).map((srv, i) => (
                            <li key={i} className="flex items-start gap-2 text-slate-700">
                              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{srv}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })()}

                  {/* Note preview */}
                  {q.notes && (
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 italic line-clamp-2">
                      "{q.notes}"
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="p-6 pt-0 space-y-2">
                  {!isAccepted ? (
                    <button
                      type="button"
                      disabled={isAccepting || Boolean(successInfo)}
                      onClick={() => handleAcceptOffer(quoteId)}
                      className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${isBestPrice
                        ? "bg-brand-600 text-white hover:bg-brand-700 shadow-brand"
                        : "bg-slate-900 text-white hover:bg-slate-800"
                        } disabled:opacity-50`}
                    >
                      {isAccepting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirmer et Réserver cette offre</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      to="/client/messages"
                      className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Échanger avec le déménageur</span>
                    </Link>
                  )}

                  <Link
                    to={`/client/quotes/${quoteId}`}
                    className="w-full py-2.5 rounded-xl text-center text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 block transition-colors border border-slate-200"
                  >
                    Examiner le devis complet
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assurance guarantee footnote */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-6 h-6 text-emerald-400 flex-shrink-0" />
          <p className="text-slate-300">
            <strong>Garantie Séquestre MoversGo :</strong> Votre acompte est conservé sur un compte de cantonnement sécurisé et n'est versé au déménageur qu'une fois la prestation accomplie. Vous bénéficiez d'une assurance marchandise sur toutes les offres certifiées.
          </p>
        </div>
      </div>
    </div>
  );
}
