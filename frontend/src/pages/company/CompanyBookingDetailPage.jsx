import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { bookingService } from "../../services/api/bookingService";
import { messageService } from "../../services/api/messageService";
import { useNotifications } from "../../contexts/NotificationContext";
import { StatusBadge } from "../../components/common/StatusBadge";
import InvoiceModal from "../../components/common/InvoiceModal";
import { LocationBadge } from "../../components/common/LocationBadge";
import { formatCurrency, formatDate } from "../../utils/cn";
import { toast } from "sonner";
import {
  ChevronLeft,
  CheckCircle2,
  Truck,
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  Home,
  User,
  CalendarCheck2,
  Clock,
  Printer,
  ShieldCheck,
  AlertCircle,
  Package,
  ArrowRight,
  Send,
  Boxes,
  CreditCard,
  Banknote,
  X,
  Lock,
  FileCheck2,
  PenTool,
} from "lucide-react";

export function CompanyBookingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { onBookingUpdate } = useNotifications();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [requestingPayment, setRequestingPayment] = useState(false);
  const [showPaymentChoiceModal, setShowPaymentChoiceModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceAutoPrint, setInvoiceAutoPrint] = useState(false);
  const [statusNote, setStatusNote] = useState("");
  const [openingChat, setOpeningChat] = useState(false);

  const handleConfirmCashDeposit = async () => {
    if (!booking) return;
    if (!window.confirm("Confirmez-vous avoir reçu le règlement de l'acompte en espèces du client ? Cela débloquera immédiatement la facture finale officielle.")) {
      return;
    }
    setUpdating(true);
    try {
      const res = await bookingService.confirmCashDeposit(booking._id || booking.id);
      setBooking((prev) => ({
        ...prev,
        paymentStatus: "deposit_paid",
        depositPaidAt: new Date(),
      }));
      toast.success("Acompte en espèces validé avec succès !", {
        description: "La facture finale officielle est désormais disponible et prête à être imprimée pour le client.",
      });
      setShowInvoiceModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Erreur lors de la validation de l'acompte.");
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestPayment = async (paymentMode = "virement") => {
    if (!booking) return;
    setRequestingPayment(true);
    setShowPaymentChoiceModal(false);
    try {
      await bookingService.requestPayment(booking._id || booking.id, { paymentMode });
      setBooking((prev) => ({
        ...prev,
        paymentRequested: true,
        paymentRequestedAt: new Date(),
        requestedPaymentMode: paymentMode,
      }));
      toast.success(
        paymentMode === "espece"
          ? "Signal envoyé : acompte convenu en espèces le jour J !"
          : "Demande de paiement par virement/carte transmise au client !",
        {
          description:
            paymentMode === "espece"
              ? "Le client a été notifié de préparer l'acompte en espèces."
              : "Le client a reçu une notification pour régler en ligne avec sa carte bancaire.",
        }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Erreur lors de l'envoi du signal.");
    } finally {
      setRequestingPayment(false);
    }
  };

  const loadBooking = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await bookingService.getBookingById(id);
      setBooking(data);
    } catch (err) {
      console.error("Erreur chargement feuille de route:", err);
      if (!silent) setError("Impossible de charger les détails de cette réservation.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadBooking();
  }, [id]);

  // ── Real-time booking update listener ──────────────────────────────────
  // When client pays the deposit online, backend emits booking:updated →
  // NotificationContext relays it here so the page refreshes without reload.
  useEffect(() => {
    if (!id) return;
    const unregister = onBookingUpdate(id, () => {
      loadBooking(true); // silent reload — no spinner
    });
    return unregister;
  }, [id, onBookingUpdate, loadBooking]);

  const handleOpenChat = async () => {
    // For company: the client's User ID is booking.client._id
    const clientUserId = booking?.client?._id;
    if (!clientUserId) {
      navigate("/company/messages");
      return;
    }
    setOpeningChat(true);
    try {
      const res = await messageService.getOrCreateConversation(clientUserId);
      // After messageService fix: res = { conversation: {...} }
      const convId = res?.conversation?._id || res?._id;
      navigate(convId ? `/company/messages?conversationId=${convId}` : "/company/messages");
    } catch {
      navigate("/company/messages");
    } finally {
      setOpeningChat(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!booking) return;

    if (newStatus === "in_progress") {
      if (booking.requestedPaymentMode === "virement" && booking.paymentStatus !== "deposit_paid") {
        const proceed = window.confirm(
          "Attention : Le client n'a pas encore validé le paiement de l'acompte par carte bancaire en ligne.\n\nSouhaitez-vous quand même confirmer le démarrage du camion ?"
        );
        if (!proceed) return;
      }
    }

    const confirmMessages = {
      in_progress: "Confirmez-vous le départ de l'équipe et le début du déménagement ?",
      completed: "Confirmez-vous que la livraison est terminée et le mobilier livré au client ?",
    };

    if (confirmMessages[newStatus] && !window.confirm(confirmMessages[newStatus])) {
      return;
    }

    setUpdating(true);
    try {
      const updated = await bookingService.updateServiceStatus(
        booking._id || booking.id,
        newStatus,
        statusNote.trim() || undefined
      );
      setBooking(updated);
      setStatusNote("");
      toast.success(
        newStatus === "in_progress"
          ? "Déménagement démarré ! Le client a été notifié en direct."
          : "Félicitations ! Mission marquée comme terminée.",
        {
          description:
            newStatus === "completed"
              ? "L'acompte est libéré et une invitation à déposer un avis a été envoyée au client."
              : "Le suivi d'avancement est actualisé en temps réel.",
        }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Erreur lors de la mise à jour du statut.");
    } finally {
      setUpdating(false);
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
        <Link to="/company/bookings" className="text-xs font-bold text-brand-600 hover:underline">
          Retour aux réservations
        </Link>
      </div>
    );
  }

  const req = booking.movingRequest || {};
  const client = booking.client || {};
  const clientName = client.firstName ? `${client.firstName} ${client.lastName || ""}`.trim() : "Client Particulier";

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
  const duration = booking.estimatedDuration || booking.quote?.estimatedDuration || "Demi-journée";

  const serviceStatus = booking.serviceStatus || "preparation";
  const inventoryItems = req.furniture || req.inventory?.items || [];
  const volume = req.estimatedVolume || req.inventory?.estimatedVolume || 0;
  const boxes = req.estimatedBoxes || req.inventory?.boxesCount || 0;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            to="/company/bookings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Retour aux réservations</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Feuille de Route #{String(booking._id || "").slice(-8).toUpperCase()}
            </h1>
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
                  ? "Déménagement en cours de livraison"
                  : "En préparation camion & équipe"}
            </span>
          </div>
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
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>✍️ Consulter / Signer la Facture Finale</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setInvoiceAutoPrint(true);
                  setShowInvoiceModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span>Imprimer la Facture (PDF)</span>
              </button>
            </>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Facture débloquée dès réception acompte</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleOpenChat}
            disabled={openingChat}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-60"
          >
            {openingChat ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <MessageSquare className="w-3.5 h-3.5" />
            )}
            <span>Contacter le client</span>
          </button>
        </div>
      </div>

      {/* ACTION STEPPER BANNER (Pour avancer les étapes suivantes) */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 block mb-1">
              Pilotage des étapes de la mission
            </span>
            <h2 className="text-xl font-extrabold text-white">
              {serviceStatus === "preparation" && "Étape 1 : Préparation du camion & départ équipe"}
              {serviceStatus === "in_progress" && "Étape 2 : Déménagement en cours de transit & manutention"}
              {serviceStatus === "completed" && "Étape 3 : Déménagement entièrement finalisé"}
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              {serviceStatus === "preparation" &&
                "L'offre a été validée par le client avec acompte séquestre consigné. Quand le camion part, enclenchez le démarrage."}
              {serviceStatus === "in_progress" &&
                "Le déménagement est en cours. Une fois les biens déchargés et installés, validez la fin de prestation."}
              {serviceStatus === "completed" &&
                "Cette prestation est clôturée. L'acompte a été libéré sur votre solde transporteur."}
            </p>
          </div>

          {/* Action Button */}
          <div className="flex flex-wrap items-center gap-3">
            {serviceStatus === "preparation" && (
              <>
                {!booking.paymentRequested ? (
                  <button
                    type="button"
                    onClick={() => setShowPaymentChoiceModal(true)}
                    disabled={requestingPayment}
                    className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
                  >
                    {requestingPayment ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Confirmer prise en charge & Demander l'acompte</span>
                      </>
                    )}
                  </button>
                ) : booking.paymentStatus === "deposit_paid" || booking.paymentStatus === "fully_paid" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Acompte validé ({formatCurrency(deposit)}) ✅</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setInvoiceAutoPrint(true);
                        setShowInvoiceModal(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Printer className="w-4 h-4 text-emerald-600" />
                      <span>Imprimer Facture Finale</span>
                    </button>
                  </div>
                ) : booking.requestedPaymentMode === "espece" ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="px-3.5 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-amber-400" />
                      <span>Acompte en espèces ({formatCurrency(deposit)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmCashDeposit}
                      disabled={updating}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Valider réception acompte</span>
                    </button>
                  </div>
                ) : (
                  <div className="px-3.5 py-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span>Acompte en attente de paiement client (Carte)</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleUpdateStatus("in_progress")}
                  disabled={updating}
                  className={`px-6 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50 ${booking.requestedPaymentMode === "virement" && booking.paymentStatus !== "deposit_paid"
                    ? "bg-amber-500/90 hover:bg-amber-500 text-slate-950"
                    : "bg-emerald-500 hover:bg-emerald-600 text-slate-950"
                    }`}
                >
                  {updating ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      <span>Démarrer le Déménagement ➔</span>
                    </>
                  )}
                </button>
              </>
            )}

            {serviceStatus === "in_progress" && (
              <button
                type="button"
                onClick={() => handleUpdateStatus("completed")}
                disabled={updating}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg transition-all disabled:opacity-50"
              >
                {updating ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terminer & Clôturer la Mission ✅</span>
                  </>
                )}
              </button>
            )}

            {serviceStatus === "completed" && (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Mission clôturée</span>
              </div>
            )}
          </div>
        </div>

        {/* 4-Step Interactive Visual Stepper */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {[
            {
              title: "1. Réservation validée",
              desc: "Acompte consigné",
              done: true,
              current: false,
            },
            {
              title: "2. Préparation équipe",
              desc: "Camion & matériel prêts",
              done: serviceStatus === "in_progress" || serviceStatus === "completed",
              current: serviceStatus === "preparation",
            },
            {
              title: "3. En cours de route",
              desc: "Chargement & transit",
              done: serviceStatus === "completed",
              current: serviceStatus === "in_progress",
            },
            {
              title: "4. Déménagement terminé",
              desc: "Mobilier livré & vérifié",
              done: serviceStatus === "completed",
              current: false,
            },
          ].map((s, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border transition-all ${s.done
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                : s.current
                  ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400"
                  : "bg-white/5 border-white/10 text-slate-400"
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {s.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${s.current ? "bg-amber-400 text-slate-900" : "bg-white/20 text-slate-300"
                      }`}
                  >
                    {idx + 1}
                  </div>
                )}
                <span className="text-xs font-bold text-white">{s.title}</span>
              </div>
              <p className="text-[11px] text-slate-300 ml-6">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Details, Coordinates, Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Coordinates & Mission Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Departure & Arrival Coordonnées */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Departure */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-3">
              <div className="flex items-center gap-2 text-brand-700">
                <Home className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Coordonnées de Départ (Chargement)
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
                  Coordonnées d'Arrivée (Livraison)
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

          {/* Schedule & Timing Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-brand-600" />
              <span>Planning & Organisation Logistique</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-700">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Date Convenue</span>
                <strong className="text-slate-900 text-sm">{formatDate(date)}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Heure de Rendez-vous</span>
                <strong className="text-slate-900 text-sm">{time}</strong>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Durée Estimée</span>
                <strong className="text-slate-900 text-sm">{duration}</strong>
              </div>
            </div>
          </div>

          {/* Inventory & Furniture */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-brand-600" />
                <span>Inventaire & Mobilier à Transporter</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  {volume ? `${volume} m³` : "Volume standard"}
                </span>
                {boxes > 0 && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {boxes} cartons
                  </span>
                )}
              </div>
            </div>

            {inventoryItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {inventoryItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                  >
                    <span className="font-semibold text-slate-800">{item.name || "Meuble"}</span>
                    <span className="text-slate-500 font-mono">Qté : {item.quantity || 1}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                Inventaire global pour déménagement complet de logement.
              </p>
            )}

            {req.comments && (
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900">
                <strong>Remarques spécifiques du client :</strong> "{req.comments}"
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Client Contact & Escrow Financials */}
        <div className="space-y-6">
          {/* Client Contact Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Coordonnées du Client
            </span>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-base flex-shrink-0">
                {client.firstName ? client.firstName[0].toUpperCase() : "C"}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">{clientName}</p>
                <p className="text-xs text-slate-400">Client MoversGo Tunisie</p>
              </div>
            </div>

            <div className="pt-2 space-y-2 text-xs text-slate-700">
              {client.phone && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <a href={`tel:${client.phone}`} className="font-bold text-slate-900 hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <Mail className="w-4 h-4 text-brand-600 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
            </div>

            {(client.address || client.location) && (
              <LocationBadge
                city={client.address?.city}
                governorate={client.address?.governorate}
                street={client.address?.street}
                latitude={client.address?.latitude || client.location?.latitude}
                longitude={client.address?.longitude || client.location?.longitude}
                label="Localisation GPS du Client"
              />
            )}

            <Link
              to="/company/messages"
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ouvrir la Messagerie</span>
            </Link>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Règlement & Acompte Séquestre
            </span>

            <div className="space-y-2.5 pt-1 text-slate-600">
              <div className="flex justify-between items-center">
                <span>Prix total convenu TTC :</span>
                <strong className="text-slate-900 text-base">{formatCurrency(total)}</strong>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-900 space-y-1.5">
                <div className="flex justify-between items-center font-bold">
                  <span>Acompte ({depositPercent}%) consigné (Séquestre) :</span>
                  <span>{formatCurrency(deposit)}</span>
                </div>
                <div className="pt-1 border-t border-emerald-200/60 text-[11px] space-y-1">
                  <div className="flex justify-between items-center text-emerald-800">
                    <span>• Net encaissé par votre entreprise ({depositPercent - (depositPercent / 10) * 2}% TTC) :</span>
                    <strong className="font-bold">+{formatCurrency(booking.netToCompany || Math.round(deposit * 0.8))}</strong>
                  </div>
                  <div className="flex justify-between items-center text-brand-700">
                    <span>• Commission plateforme MoversGo ({(depositPercent / 10) * 2}% TTC) :</span>
                    <strong className="font-bold">-{formatCurrency(booking.platformFee || Math.round(deposit * 0.2))}</strong>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded-xl bg-brand-50 border border-brand-100 text-brand-900 font-bold">
                <span>Solde à encaisser le jour J (100% entreprise) :</span>
                <span className="text-base">{formatCurrency(remaining)}</span>
              </div>

              <div className="flex justify-between items-center px-1 text-slate-800 text-[11px] font-semibold">
                <span>Total net perçu par votre entreprise :</span>
                <span className="text-emerald-700 font-bold text-xs">{formatCurrency((booking.netToCompany || Math.round(deposit * 0.8)) + remaining)}</span>
              </div>
            </div>

            {booking.paymentStatus === "deposit_paid" || booking.paymentStatus === "fully_paid" ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceAutoPrint(false);
                    setShowInvoiceModal(true);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <PenTool className="w-4 h-4" />
                  <span>✍️ Consulter & Signer la Facture Finale</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceAutoPrint(true);
                    setShowInvoiceModal(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>Imprimer la Facture Finale (PDF)</span>
                </button>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-amber-950">
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Facture Finale non disponible</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  La facture finale officielle contenant le solde restant sera automatiquement générée dès réception de l'acompte.
                </p>
                {booking.requestedPaymentMode === "espece" && (
                  <button
                    type="button"
                    onClick={handleConfirmCashDeposit}
                    disabled={updating}
                    className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Valider encaissement acompte espèces</span>
                  </button>
                )}
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Garantie Séquestre MoversGo :</strong> L'acompte du client est consigné de façon sécurisée. Il est débloqué vers votre compte après confirmation de fin de mission.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Mode Selection Modal */}
      {showPaymentChoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Demande d'acompte au client</h3>
                  <p className="text-[11px] text-slate-500">Montant de l'acompte ({depositPercent}%) : <strong>{formatCurrency(deposit)}</strong></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentChoiceModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Veuillez sélectionner le mode de règlement souhaité pour cet acompte :
            </p>

            <div className="space-y-3">
              {/* Option 1: Virement / En ligne */}
              <button
                type="button"
                onClick={() => handleRequestPayment("virement")}
                className="w-full p-4 rounded-2xl border-2 border-blue-200 hover:border-blue-600 bg-blue-50/50 hover:bg-blue-50 text-left transition-all group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                      Virement / Paiement par carte en ligne (Recommandé)
                    </span>
                    <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                      Séquestre
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Le client reçoit une alerte et paie l'acompte en ligne via sa carte bancaire. Les fonds sont garantis sur le compte séquestre MoversGo.
                  </p>
                </div>
              </button>

              {/* Option 2: Espèces */}
              <button
                type="button"
                onClick={() => handleRequestPayment("espece")}
                className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/50 text-left transition-all group flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Banknote className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-amber-800">
                    Règlement en Espèces lors de l'enlèvement
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Le client est notifié de préparer l'acompte en espèces le jour du déménagement au moment de l'arrivée du camion.
                  </p>
                </div>
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setShowPaymentChoiceModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
