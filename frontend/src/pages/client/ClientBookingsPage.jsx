import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import { bookingService } from "../../services/api/bookingService";
import { StatusBadge } from "../../components/common/StatusBadge";
import InvoiceModal from "../../components/common/InvoiceModal";
import { formatCurrency, formatDate, getLogoUrl } from "../../utils/cn";
import {
  CalendarCheck2,
  MapPin,
  Home,
  Truck,
  ArrowRight,
  Eye,
  Clock,
  Phone,
  MessageSquare,
  Building2,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Lock,
  Printer,
} from "lucide-react";

export function ClientBookingsPage() {
  const { onBookingUpdate } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceBookingId, setSelectedInvoiceBookingId] = useState(null);

  const loadBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await bookingService.getMyBookings();
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : res?.bookings || [];
      setBookings(list);
    } catch (err) {
      console.error("Erreur chargement réservations client:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const unregister = onBookingUpdate("*", () => {
      loadBookings(true);
    });
    return unregister;
  }, [onBookingUpdate]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Mes Réservations de Déménagement
          </h1>
          <p className="text-xs text-slate-500">
            Suivi en direct de vos déménagements confirmés, feuilles de route et étapes d'exécution
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-3">
            <CalendarCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Aucune réservation confirmée pour le moment</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Lorsque vous acceptez un devis proposé par un déménageur, votre réservation officielle s'affichera ici avec le suivi en direct.
            </p>
            <Link
              to="/client/quotes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand"
            >
              <span>Consulter mes devis reçus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          bookings.map((b) => {
            const bookingId = b._id || b.id;
            const comp = b.company || {};
            const compName = comp.companyName || b.companyName || "Déménageur Partenaire";
            const req = b.movingRequest || {};

            const depObj = req.departureAddress || req.departure || {};
            const arrObj = req.arrivalAddress || req.arrival || {};
            const depFull = fmtFullAddress(depObj);
            const arrFull = fmtFullAddress(arrObj);
            const depFloor = req.departureFloor ?? depObj.floor ?? 0;
            const arrFloor = req.arrivalFloor ?? arrObj.floor ?? 0;
            const depElevator = req.departureElevator ?? depObj.hasElevator;
            const arrElevator = req.arrivalElevator ?? arrObj.hasElevator;

            const date = b.scheduledDate || req.preferredDate;
            const time = b.scheduledTime || "08:00";
            const total = b.totalAmount || b.quote?.totalPrice || 0;
            const deposit = b.depositAmount || b.quote?.depositAmount || 0;
            const remaining = b.remainingAmount || (total - deposit);

            const serviceStatus = b.serviceStatus || "preparation";
            const statusLabelMap = {
              preparation: { label: "1. En préparation camion & équipe", bg: "bg-blue-50 text-blue-700 border-blue-200" },
              in_progress: { label: "2. Déménagement en cours", bg: "bg-amber-50 text-amber-700 border-amber-200 animate-pulse" },
              completed: { label: "3. Déménagement terminé", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              cancelled: { label: "Annulée", bg: "bg-red-50 text-red-700 border-red-200" },
            };
            const currentBadge = statusLabelMap[serviceStatus] || statusLabelMap.preparation;

            return (
              <div
                key={bookingId}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all space-y-4"
              >
                {/* Header row: Status badges & Date */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${currentBadge.bg}`}>
                      {currentBadge.label}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-lg">
                      Réf. #{String(bookingId).slice(-8).toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                    <CalendarCheck2 className="w-4 h-4 text-brand-600" />
                    <span>Prévu le : <strong>{formatDate(date)} à {time}</strong></span>
                  </div>
                </div>

                {/* Company & Coordinates Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Company Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Entreprise Agréée
                    </span>
                    <div className="flex items-center gap-3">
                      {comp.logo ? (
                        <img
                          src={getLogoUrl(comp.logo)}
                          alt={compName}
                          className="w-10 h-10 rounded-xl object-contain border border-slate-200 bg-white p-0.5 shadow-xs"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold">
                          <Building2 className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-bold text-slate-900 leading-tight">{compName}</p>
                        {comp.phone && (
                          <p className="text-xs text-slate-600 flex items-center gap-1 font-medium mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{comp.phone}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Departure Coordinates */}
                  <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-brand-800 font-bold text-[11px] uppercase tracking-wider">
                      <Home className="w-3.5 h-3.5" />
                      <span>Adresse de Départ</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{depFull}</p>
                    <p className="text-[11px] text-slate-600">
                      Gouvernorat : <strong>{depObj.governorate || "—"}</strong> • Ville : <strong>{depObj.city || "—"}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Étage : <strong>{depFloor}</strong> ({depElevator ? "avec ascenseur" : "sans ascenseur"})
                    </p>
                  </div>

                  {/* Arrival Coordinates */}
                  <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Adresse d'Arrivée</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{arrFull}</p>
                    <p className="text-[11px] text-slate-600">
                      Gouvernorat : <strong>{arrObj.governorate || "—"}</strong> • Ville : <strong>{arrObj.city || "—"}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Étage : <strong>{arrFloor}</strong> ({arrElevator ? "avec ascenseur" : "sans ascenseur"})
                    </p>
                  </div>
                </div>

                {/* Financials & CTAs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Prix Total</span>
                      <strong className="text-base text-slate-900">{formatCurrency(total)}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 block text-[10px] uppercase font-bold">Acompte Séquestre Bloqué</span>
                      <strong className="text-sm text-emerald-700">{formatCurrency(deposit)}</strong>
                    </div>
                    <div>
                      <span className="text-brand-700 block text-[10px] uppercase font-bold">Solde restant le jour J</span>
                      <strong className="text-sm text-brand-700">{formatCurrency(remaining)}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {b.paymentStatus === "deposit_paid" || b.paymentStatus === "fully_paid" ? (
                      <button
                        type="button"
                        onClick={() => setSelectedInvoiceBookingId(bookingId)}
                        className="px-3.5 py-2.5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                        title="Consulter et imprimer la Facture Finale"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Facture Finale</span>
                      </button>
                    ) : (
                      <span
                        className="px-3 py-2 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium flex items-center gap-1 border border-slate-200"
                        title="Facture finale débloquée dès règlement de l'acompte"
                      >
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Facture en attente</span>
                      </span>
                    )}

                    <Link
                      to="/client/messages"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>Messagerie</span>
                    </Link>

                    <Link
                      to={`/client/bookings/${bookingId}`}
                      className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-2 shadow-brand transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Suivre la Réservation en Direct</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Official Moving Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedInvoiceBookingId}
        onClose={() => setSelectedInvoiceBookingId(null)}
        bookingId={selectedInvoiceBookingId}
      />
    </div>
  );
}
