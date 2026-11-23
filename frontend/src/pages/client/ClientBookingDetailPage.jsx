import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { bookingService } from "../../services/api/bookingService";
import { messageService } from "../../services/api/messageService";
import { useNotifications } from "../../contexts/NotificationContext";
import { StatusBadge } from "../../components/common/StatusBadge";
import { VirtualPaymentModal } from "../../components/common/VirtualPaymentModal";
import InvoiceModal from "../../components/common/InvoiceModal";
import { LocationBadge } from "../../components/common/LocationBadge";
import { formatCurrency, formatDate, getLogoUrl } from "../../utils/cn";
import { toast } from "sonner";
import {
  ChevronLeft,
  Truck,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
  MapPin,
  Home,
  Star,
  ShieldCheck,
  Building2,
  AlertCircle,
  CalendarCheck2,
  CreditCard,
  Banknote,
  Lock,
  Sparkles,
  FileCheck2,
  Printer,
  XCircle,
  X,
} from "lucide-react";

export function ClientBookingDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { onBookingUpdate } = useNotifications();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceAutoPrint, setInvoiceAutoPrint] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);

  const loadBooking = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getBookingById(id);
      setBooking(data);
    } catch (err) {
      console.error("Erreur chargement réservation client:", err);
      if (!silent) setError("Impossible de charger les détails de cette réservation.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [id]);

  // ── Real-time booking update listener ──────────────────────────────────
  // When the company requests payment or when any payment event fires,
  // the backend emits booking:updated → NotificationContext relays it here
  // so the page refreshes without any manual reload.
  useEffect(() => {
    if (!id) return;
    const unregister = onBookingUpdate(id, () => {
      // Silently reload booking data to reflect new paymentRequested / paymentStatus
      loadBooking(true);
    });
    return unregister;
  }, [id, onBookingUpdate, loadBooking]);

  // Listen for open-virtual-payment-modal triggered from toast action
  useEffect(() => {
    const handleOpenModal = () => setShowPaymentModal(true);
    window.addEventListener("open-virtual-payment-modal", handleOpenModal);
    return () => window.removeEventListener("open-virtual-payment-modal", handleOpenModal);
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) {
      toast.error("Veuillez indiquer un motif d'annulation.");
      return;
    }
    setCancelling(true);
    try {
      await bookingService.cancelBooking(id, cancelReason.trim());
      toast.success("Réservation annulée avec succès.");
      setShowCancelModal(false);
      setCancelReason("");
      loadBooking();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Erreur lors de l'annulation.");
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenChat = async () => {
    const companyUserId = booking?.company?.user;
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

  if (error || !booking) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <p className="text-sm font-semibold text-slate-700">{error || "Réservation introuvable"}</p>
        <Link to="/client/bookings" className="text-xs font-bold text-brand-600 hover:underline">
          Retour à mes réservations
        </Link>
      </div>
    );
  }

  const req = booking.movingRequest || {};
  const comp = booking.company || {};
  const compName = comp.companyName || booking.companyName || "Déménageur Partenaire";

  const depObj = req.departureAddress || req.departure || {};
  const arrObj = req.arrivalAddress || req.arrival || {};
  const depFull = fmtFullAddress(depObj);
  const arrFull = fmtFullAddress(arrObj);
  const depFloor = req.departureFloor ?? depObj.floor ?? 0;
  const arrFloor = req.arrivalFloor ?? arrObj.floor ?? 0;
  const depElevator = req.departureElevator ?? depObj.hasElevator;
  const arrElevator = req.arrivalElevator ?? arrObj.hasElevator;

  const total = booking.totalAmount || booking.quote?.totalPrice || 0;
  const deposit = booking.depositAmount || booking.quote?.depositAmount || 0;
  const remaining = booking.remainingAmount || (total - deposit);
  const depositPercent = (() => {
    if (booking.quote?.depositPercent && Number(booking.quote.depositPercent) > 0) return Number(booking.quote.depositPercent);
    if (booking.quote?.depositPercentage && Number(booking.quote.depositPercentage) > 0) return Number(booking.quote.depositPercentage);
    if (booking.quote?.pricing?.depositPercentage && Number(booking.quote.pricing.depositPercentage) > 0) return Number(booking.quote.pricing.depositPercentage);
    if (total > 0 && deposit > 0) return Math.round((deposit / total) * 100);
    if (booking.depositPercent && Number(booking.depositPercent) > 0) return Number(booking.depositPercent);
    return 30;
  })();
  const date = booking.scheduledDate || req.preferredDate;
  const time = booking.scheduledTime || "08:00";
  const serviceStatus = booking.serviceStatus || "preparation";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="space-y-1">
        <Link
          to="/client/bookings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Retour à mes réservations</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Réservation #{String(booking._id || "").slice(-8).toUpperCase()}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <CalendarCheck2 className="w-3.5 h-3.5 text-brand-600" />
              <span>Intervention programmée le : <strong>{formatDate(date)} à {time}</strong></span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {booking.paymentStatus === "deposit_paid" || booking.paymentStatus === "fully_paid" ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceAutoPrint(false);
                    setShowInvoiceModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Facture Finale</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceAutoPrint(true);
                    setShowInvoiceModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Imprimer (PDF)</span>
                </button>
              </>
            ) : (
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Facture débloquée dès règlement acompte</span>
              </div>
            )}
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border ${serviceStatus === "completed"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : serviceStatus === "in_progress"
                  ? "bg-amber-50 text-amber-800 border-amber-200 animate-pulse"
                  : "bg-blue-50 text-blue-800 border-blue-200"
                }`}
            >
              {serviceStatus === "completed"
                ? "Déménagement terminé"
                : serviceStatus === "in_progress"
                  ? "Déménagement en cours"
                  : "En préparation camion & équipe"}
            </span>
          </div>
        </div>
      </div>

      {location.state?.bookingCreated && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>Votre réservation a été validée avec succès ! L'acompte a été consigné sur le compte séquestre MoversGo.</span>
        </div>
      )}

      {/* ── CANCELLATION BANNER ── visible only when deposit not yet paid and not cancelled */}
      {booking.bookingStatus !== "cancelled" &&
        booking.serviceStatus !== "completed" &&
        booking.serviceStatus !== "in_progress" &&
        booking.paymentStatus !== "deposit_paid" &&
        booking.paymentStatus !== "fully_paid" && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-rose-800">Annulation possible</p>
                <p className="text-[11px] text-rose-600 mt-0.5">
                  Vous pouvez annuler cette réservation avant le paiement de l'acompte.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-shrink-0 px-4 py-2 rounded-xl border border-rose-300 bg-white text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
            >
              Annuler la réservation
            </button>
          </div>
        )}

      {/* ── CANCELLED BADGE ── */}
      {booking.bookingStatus === "cancelled" && (
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 flex items-center gap-2.5">
          <XCircle className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-slate-600">Réservation annulée</p>
            {booking.cancellationReason && (
              <p className="text-[11px] text-slate-500 mt-0.5">Motif : {booking.cancellationReason}</p>
            )}
          </div>
        </div>
      )}

      {/* Signal de prise en charge et appel à l'acompte */}
      {booking.paymentStatus === "deposit_paid" ? (
        <div className="p-5 rounded-3xl bg-emerald-50/90 border border-emerald-200 shadow-sm space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  Acompte Séquestré & Garanti
                </span>
                {booking.depositPaidAt && (
                  <span className="text-[11px] text-emerald-600 font-medium">
                    Réglé le {formatDate(booking.depositPaidAt)}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-1">
                Acompte de {formatCurrency(deposit)} consigné avec succès (Paiement validé)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Vos fonds sont protégés sur le compte séquestre MoversGo. L'entreprise {compName} a reçu le signal de départ et prépare le camion pour l'intervention.
              </p>
            </div>
          </div>
        </div>
      ) : booking.paymentRequested ? (
        booking.requestedPaymentMode === "espece" ? (
          <div className="p-5 rounded-3xl bg-amber-50/90 border border-amber-200/90 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Banknote className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    Règlement en Espèces Convenu
                  </span>
                  <span className="text-[11px] text-amber-700 font-medium">
                    {booking.paymentRequestedAt ? formatDate(booking.paymentRequestedAt) : "Prise en charge validée"}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {compName} confirme la prise en charge — Acompte de {formatCurrency(deposit)} à régler en espèces
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Le déménageur a convenu d'un règlement de l'acompte directement en espèces le jour de l'intervention lors de l'enlèvement des biens.
                </p>
              </div>
            </div>
            <div className="pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={handleOpenChat}
                disabled={openingChat}
                className="px-4 py-2.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                {openingChat && <div className="w-3 h-3 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />}
                Discuter avec le déménageur
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200/90 shadow-sm space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                      Prise en charge confirmée
                    </span>
                    <span className="text-[11px] text-blue-600 font-medium">
                      Paiement en ligne requis
                    </span>
                  </div>
                  <span className="text-sm font-black text-brand-600 font-mono">
                    {formatCurrency(deposit)}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">
                  {compName} demande le règlement de l'acompte pour démarrer le camion
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Réglez votre acompte de confirmation en toute sécurité via notre simulateur de carte bancaire virtuelle. Vos fonds sont bloqués en séquestre jusqu'à la livraison complète.
                </p>
              </div>
            </div>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentModal(true)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <CreditCard className="w-4 h-4" />
                <span>Payer l'acompte ({depositPercent}%) par carte virtuelle ({formatCurrency(deposit)}) ➔</span>
              </button>
              <button
                type="button"
                onClick={handleOpenChat}
                disabled={openingChat}
                className="px-4 py-2.5 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-800 font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
              >
                {openingChat && <div className="w-3 h-3 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />}
                Poser une question au déménageur
              </button>
            </div>
          </div>
        )
      ) : null}

      {/* Live Timeline Tracking */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-subtle space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-bold text-slate-900">Suivi d'avancement en direct</h3>
          <span className="text-xs text-slate-400">Actualisé en temps réel</span>
        </div>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {[
            {
              step: "Réservation confirmée & acompte consigné",
              desc: "Votre devis a été accepté et bloqué sur compte séquestre.",
              done: true,
              time: formatDate(booking.createdAt),
            },
            {
              step: "Préparation du camion et de l'équipe",
              desc: "Le transporteur organise le personnel et prépare le matériel de déménagement.",
              done: serviceStatus === "in_progress" || serviceStatus === "completed",
              time: serviceStatus === "preparation" ? "En cours actuellement" : "Validé",
            },
            {
              step: "Déménagement & Acheminement en cours",
              desc: "Chargement, transport routier et manutention vers le nouveau logement.",
              done: serviceStatus === "completed",
              time: serviceStatus === "in_progress" ? "Camion sur la route 🚚" : serviceStatus === "completed" ? "Acheminé" : "En attente",
            },
            {
              step: "Livraison effectuée & Déménagement terminé",
              desc: "Tous vos biens sont installés. Vous pouvez débloquer le solde restant et noter l'entreprise.",
              done: serviceStatus === "completed",
              time: serviceStatus === "completed" ? "Livré avec succès 🎉" : "À venir",
            },
          ].map((s, idx) => (
            <div key={idx} className="relative flex items-start gap-4">
              <div
                className={`absolute -left-6 w-5 h-5 rounded-full flex items-center justify-center ${s.done
                  ? "bg-emerald-600 text-white ring-4 ring-emerald-50"
                  : "bg-slate-200 ring-4 ring-white"
                  }`}
              >
                {s.done && <CheckCircle2 className="w-3.5 h-3.5" />}
              </div>
              <div>
                <p className={`text-xs font-bold ${s.done ? "text-slate-900" : "text-slate-400"}`}>
                  {s.step}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{s.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coordinates Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Departure */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-3">
          <div className="flex items-center gap-2 text-brand-700">
            <Home className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Coordonnées de Départ
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{depFull}</p>
            <p className="text-xs text-slate-600 mt-1">
              Gouvernorat : <strong>{depObj.governorate || "—"}</strong> • Ville : <strong>{depObj.city || "—"}</strong>
            </p>
            {depObj.postalCode && (
              <p className="text-xs text-slate-500">Code postal : {depObj.postalCode}</p>
            )}
            {depObj.street && (
              <p className="text-xs text-slate-500">Rue : {depObj.street}</p>
            )}
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <p>Type de logement : <strong>{req.departureHousingType || depObj.housingType || "Logement"}</strong></p>
            <p>Étage : <strong>{depFloor}</strong> ({depElevator ? "Avec ascenseur" : "Sans ascenseur"})</p>
          </div>
        </div>

        {/* Arrival */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Coordonnées d'Arrivée
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{arrFull}</p>
            <p className="text-xs text-slate-600 mt-1">
              Gouvernorat : <strong>{arrObj.governorate || "—"}</strong> • Ville : <strong>{arrObj.city || "—"}</strong>
            </p>
            {arrObj.postalCode && (
              <p className="text-xs text-slate-500">Code postal : {arrObj.postalCode}</p>
            )}
            {arrObj.street && (
              <p className="text-xs text-slate-500">Rue : {arrObj.street}</p>
            )}
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1">
            <p>Type de logement : <strong>{req.arrivalHousingType || arrObj.housingType || "Logement"}</strong></p>
            <p>Étage : <strong>{arrFloor}</strong> ({arrElevator ? "Avec ascenseur" : "Sans ascenseur"})</p>
          </div>
        </div>
      </div>

      {/* Grid: Company Contact & Financials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Company Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Déménageur Partenaire
          </span>
          <div className="flex items-center gap-3">
            {comp.logo ? (
              <img
                src={getLogoUrl(comp.logo)}
                alt={compName}
                className="w-14 h-14 rounded-2xl object-contain border border-slate-200 bg-white p-1 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                <Building2 className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className="text-sm font-bold text-slate-900">{compName}</p>
              {comp.phone && (
                <p className="text-xs text-slate-600">Contact d'urgence : {comp.phone}</p>
              )}
            </div>
          </div>

          {(comp.address || comp.location) && (
            <LocationBadge
              city={comp.address?.city}
              governorate={comp.address?.governorate}
              street={comp.address?.street}
              latitude={comp.address?.latitude || comp.location?.latitude}
              longitude={comp.address?.longitude || comp.location?.longitude}
              label="Dépôt et Siège du Transporteur"
              size="md"
            />
          )}

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={handleOpenChat}
              disabled={openingChat}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {openingChat ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
              <span>Discuter avec le transporteur</span>
            </button>
          </div>
        </div>

        {/* Financial Recap */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-3 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Récapitulatif Financier & Séquestre
          </span>
          <div className="space-y-2 pt-1 text-slate-600">
            <div className="flex justify-between items-center">
              <span>Montant total de la prestation :</span>
              <strong className="text-slate-900 text-sm">{formatCurrency(total)}</strong>
            </div>
            <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 p-2 rounded-xl">
              <span>
                Acompte réglé en ligne ({depositPercent}%) :
              </span>
              <strong className="font-bold">{formatCurrency(deposit)} (Sécurisé)</strong>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-100 font-semibold text-slate-900">
              <span>Solde restant dû le jour J :</span>
              <span className="text-brand-600 text-sm font-bold">{formatCurrency(remaining)}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 text-[11px] text-slate-500 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span>Votre acompte est protégé par la garantie séquestre MoversGo Tunisie.</span>
          </div>

          {booking.paymentStatus === "deposit_paid" || booking.paymentStatus === "fully_paid" ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setInvoiceAutoPrint(false);
                  setShowInvoiceModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Consulter la Facture Finale (Reste : {formatCurrency(remaining)})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvoiceAutoPrint(true);
                  setShowInvoiceModal(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Imprimer la Facture Finale (PDF)</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-amber-950">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Facture Finale en attente</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Réglez l'acompte de <strong>{formatCurrency(deposit)}</strong> pour débloquer immédiatement votre facture finale officielle.
              </p>
              {booking.paymentRequested && booking.requestedPaymentMode === "virement" && (
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(true)}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Régler l'acompte en ligne (Carte)</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Review Invitation if completed */}
      {serviceStatus === "completed" && (
        <div className="bg-amber-50/80 border border-amber-200 p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-amber-900">Votre déménagement est terminé ! 🎉</h4>
            <p className="text-xs text-amber-700">Partagez votre avis pour aider la communauté MoversGo et noter l'équipe.</p>
          </div>
          <Link
            to={`/client/reviews/new?bookingId=${booking._id}&companyId=${comp._id || ""}`}
            className="px-5 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shadow-md"
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Déposer un avis</span>
          </Link>
        </div>
      )}
      {/* Virtual Card Payment Simulator Modal */}
      <VirtualPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          loadBooking(); // Always reload booking when modal closes
        }}
        booking={booking}
        onSuccess={(opts) => {
          setShowPaymentModal(false);
          loadBooking();
          if (opts?.openInvoice) {
            if (opts.autoPrint) setInvoiceAutoPrint(true);
            setShowInvoiceModal(true);
          }
        }}
      />

      {/* Official Moving Invoice Modal */}
      <InvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setInvoiceAutoPrint(false);
        }}
        bookingId={booking._id || booking.id}
        autoPrint={invoiceAutoPrint}
      />

      {/* ── CANCEL CONFIRMATION MODAL ── */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Annuler la réservation</h3>
                  <p className="text-xs text-slate-500">Cette action est irréversible</p>
                </div>
              </div>
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800">
              <p className="font-semibold mb-1">⚠️ Avant de continuer</p>
              <p>L'annulation est possible uniquement avant le paiement de l'acompte. L'entreprise sera notifiée immédiatement.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Motif de l'annulation <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex : Changement de plans, déménagement reporté, autre prestataire retenu..."
                rows={3}
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowCancelModal(false); setCancelReason(""); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
              >
                Garder la réservation
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={cancelling || !cancelReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {cancelling ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Annulation...</>
                ) : (
                  <><XCircle className="w-3.5 h-3.5" /> Confirmer l'annulation</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
