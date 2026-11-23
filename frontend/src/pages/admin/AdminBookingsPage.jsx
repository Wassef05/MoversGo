import React, { useState, useEffect } from "react";
import { adminService } from "../../services/api/adminService";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/cn";
import { Eye, FileText } from "lucide-react";
import { InvoiceModal } from "../../components/common/InvoiceModal";

export function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceBookingId, setSelectedInvoiceBookingId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminService.getAllBookings();
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res?.bookings)
              ? res.bookings
              : [];
        setBookings(list);
      } catch (err) {
        console.error("Erreur chargement réservations:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Supervision des Réservations Fermes</h1>
        <p className="text-xs text-slate-500">Toutes les opérations de déménagement validées avec acompte réglé — Lecture des contrats signés disponible</p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Réf. Réservation</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Déménageur</th>
                <th className="py-3.5 px-4">Trajet</th>
                <th className="py-3.5 px-4">Date Prévue</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Acompte Séquestre</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Contrat Signé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Chargement des réservations...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Aucune réservation trouvée pour le moment.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const bId = b._id || b.id;
                  const cName = b.client
                    ? `${b.client.firstName || ''} ${b.client.lastName || ''}`.trim()
                    : (b.clientName || 'Client Particulier');
                  const compName = b.company?.companyName || b.companyName || 'Déménageur Agréé';
                  const dep = b.movingRequest?.departureAddress?.city || b.departureCity || 'Tunis';
                  const arr = b.movingRequest?.arrivalAddress?.city || b.arrivalCity || 'Sousse';
                  const total = b.totalAmount ?? b.quote?.totalPrice ?? 0;
                  const depPaid = b.depositAmount ?? b.depositPaid ?? b.quote?.depositAmount ?? Math.round(total * 0.1);
                  const mDate = b.scheduledDate || b.movingDate || b.createdAt;
                  const mTime = b.movingTime || b.scheduledTime || '08:00';
                  const status = b.bookingStatus || b.status;
                  const hasInvoice = b.paymentStatus === 'deposit_paid' || b.paymentStatus === 'fully_paid';

                  return (
                    <tr key={bId} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{String(bId).slice(-6)}</td>
                      <td className="py-3.5 px-4 font-semibold">{cName}</td>
                      <td className="py-3.5 px-4">{compName}</td>
                      <td className="py-3.5 px-4 font-medium">{dep} ➔ {arr}</td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(mDate)} à {mTime}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(total)}</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">{formatCurrency(depPaid)}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={status} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {hasInvoice ? (
                          <button
                            onClick={() => setSelectedInvoiceBookingId(String(bId))}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold transition-colors"
                            title="Lire le contrat / facture signée"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Contrat</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">En attente acompte</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal for Admin */}
      {selectedInvoiceBookingId && (
        <InvoiceModal
          isOpen={!!selectedInvoiceBookingId}
          onClose={() => setSelectedInvoiceBookingId(null)}
          bookingId={selectedInvoiceBookingId}
        />
      )}
    </div>
  );
}
