import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationContext";
import { bookingService } from "../../services/api/bookingService";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/cn";
import {
  CalendarCheck2,
  Truck,
  Eye,
  Clock,
  MapPin,
  Home,
  User,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from "lucide-react";

export function CompanyBookingsPage() {
  const { onBookingUpdate } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const loadBookings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await bookingService.getCompanyBookings();
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : res?.bookings || [];
      setBookings(list);
    } catch (err) {
      console.error("Erreur chargement réservations entreprise:", err);
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

  const filtered = bookings.filter((b) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "preparation") return b.serviceStatus === "preparation";
    if (filterStatus === "in_progress") return b.serviceStatus === "in_progress";
    if (filterStatus === "completed") return b.serviceStatus === "completed";
    if (filterStatus === "cancelled") return b.bookingStatus === "cancelled" || b.serviceStatus === "cancelled";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Réservations & Tournées Confirmées
          </h1>
          <p className="text-xs text-slate-500">
            Gestion opérationnelle de vos déménagements confirmés, feuilles de route et avancement en direct
          </p>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "Toutes les réservations" },
          { id: "preparation", label: "En préparation" },
          { id: "in_progress", label: "En cours de déménagement" },
          { id: "completed", label: "Terminées" },
          { id: "cancelled", label: "Annulées" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${filterStatus === tab.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200/80 text-center space-y-3">
            <CalendarCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Aucune réservation trouvée</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Dès qu'un client valide l'un de vos devis officiels, sa réservation confirmée et sa feuille de route apparaîtront ici.
            </p>
          </div>
        ) : (
          filtered.map((b) => {
            const bookingId = b._id || b.id;
            const req = b.movingRequest || {};
            const client = b.client || {};
            const clientName = client.firstName ? `${client.firstName} ${client.lastName || ""}`.trim() : "Client Particulier";

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

                {/* Client & Coordinates Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Client Info */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Client Donneur d'Ordre
                    </span>
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-4 h-4 text-brand-600" />
                      <span>{clientName}</span>
                    </p>
                    {client.phone && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{client.phone}</span>
                      </p>
                    )}
                    {client.email && (
                      <p className="text-xs text-slate-500">Email : {client.email}</p>
                    )}
                  </div>

                  {/* Departure Coordinates */}
                  <div className="p-4 rounded-2xl bg-brand-50/40 border border-brand-100 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-brand-800 font-bold text-[11px] uppercase tracking-wider">
                      <Home className="w-3.5 h-3.5" />
                      <span>Lieu de Chargement (Départ)</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{depFull}</p>
                    <p className="text-[11px] text-slate-600">
                      Gouvernorat : <strong>{depObj.governorate || "—"}</strong> • Ville : <strong>{depObj.city || "—"}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Type : <strong>{req.departureHousingType || depObj.housingType || "Logement"}</strong> • Étage : <strong>{depFloor}</strong> ({depElevator ? "avec ascenseur" : "sans ascenseur"})
                    </p>
                  </div>

                  {/* Arrival Coordinates */}
                  <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px] uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Lieu de Livraison (Arrivée)</span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{arrFull}</p>
                    <p className="text-[11px] text-slate-600">
                      Gouvernorat : <strong>{arrObj.governorate || "—"}</strong> • Ville : <strong>{arrObj.city || "—"}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Type : <strong>{req.arrivalHousingType || arrObj.housingType || "Logement"}</strong> • Étage : <strong>{arrFloor}</strong> ({arrElevator ? "avec ascenseur" : "sans ascenseur"})
                    </p>
                  </div>
                </div>

                {/* Bottom Row: Financials & Action Buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Montant Total</span>
                      <strong className="text-base text-slate-900">{formatCurrency(total)}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 block text-[10px] uppercase font-bold">Acompte Séquestre Bloqué</span>
                      <strong className="text-sm text-emerald-700">{formatCurrency(deposit)}</strong>
                    </div>
                    <div>
                      <span className="text-brand-700 block text-[10px] uppercase font-bold">Solde à percevoir le jour J</span>
                      <strong className="text-sm text-brand-700">{formatCurrency(remaining)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Link
                      to="/company/messages"
                      className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span>Messagerie</span>
                    </Link>

                    <Link
                      to={`/company/bookings/${bookingId}`}
                      className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Truck className="w-4 h-4 text-brand-400" />
                      <span>Ouvrir Feuille de Route & Étape Suivante</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
