import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { bookingService } from "../../services/api/bookingService";
import { formatCurrency, formatDate } from "../../utils/cn";
import { StatusBadge } from "../../components/common/StatusBadge";
import InvoiceModal from "../../components/common/InvoiceModal";
import { CreditCard, Download, ShieldCheck, CheckCircle2, Clock, FileText, Printer, Lock } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function ClientPaymentsPage() {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingInvoiceId, setSelectedBookingInvoiceId] = useState(null);
  const [invoiceAutoPrint, setInvoiceAutoPrint] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const bookings = await bookingService.getMyBookings();
        const list = Array.isArray(bookings) ? bookings : [];

        // Build payment transactions list from client bookings
        const txList = list.map((b) => {
          const comp = b.company || {};
          const isPaid = b.paymentStatus === "deposit_paid" || b.paymentStatus === "fully_paid";
          return {
            id: b._id,
            bookingId: b._id,
            companyName: comp.companyName || b.companyName || "Déménageur Partenaire",
            type: "Acompte de confirmation (30%)",
            date: b.depositPaidAt || b.createdAt,
            amount: b.depositAmount || Math.round((b.totalAmount || 0) * 0.3),
            totalAmount: b.totalAmount || 0,
            status: isPaid ? "completed" : b.paymentRequested ? "pending" : "deposit_pending",
            isPaid,
            paymentMode: b.requestedPaymentMode || "virement",
          };
        });

        setPayments(txList);
      } catch (err) {
        console.error("Erreur chargement paiements client:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  const handleDownloadInvoice = (id) => {
    setSelectedBookingInvoiceId(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Paiements & Acomptes</h1>
          <p className="text-xs text-slate-500">
            Historique de vos règlements d'acomptes et suivi du compte séquestre garanti
          </p>
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Fonds protégés à 100% par le séquestre MoversGo</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Réf. Réservation</th>
                <th className="py-3.5 px-4">Prestation</th>
                <th className="py-3.5 px-4">Déménageur</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Montant Acompte</th>
                <th className="py-3.5 px-4">État Séquestre</th>
                <th className="py-3.5 px-4 text-right">Action / Reçu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Chargement de vos transactions...
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Aucun règlement enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                payments.map((tx) => {
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        <Link
                          to={`/client/bookings/${tx.bookingId}`}
                          className="hover:text-brand-600 underline"
                        >
                          #{String(tx.id).slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 font-medium">{tx.type}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{tx.companyName}</td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(tx.date)}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-3.5 px-4">
                        {tx.isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Consigné (Payé)</span>
                          </span>
                        ) : tx.paymentMode === "espece" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <span>Espèces le jour J</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            <span>En attente de paiement</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {tx.isPaid ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setInvoiceAutoPrint(false);
                                setSelectedBookingInvoiceId(tx.bookingId);
                              }}
                              className="p-1.5 px-2.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-800 font-semibold inline-flex items-center gap-1.5 transition-colors"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Facture Finale</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setInvoiceAutoPrint(true);
                                setSelectedBookingInvoiceId(tx.bookingId);
                              }}
                              className="p-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold inline-flex items-center gap-1.5 transition-colors shadow-xs"
                              title="Imprimer la Facture Finale en PDF"
                            >
                              <Printer className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Imprimer</span>
                            </button>
                          </div>
                        ) : (
                          <Link
                            to={`/client/bookings/${tx.bookingId}`}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] inline-flex items-center gap-1 shadow-xs"
                          >
                            <CreditCard className="w-3 h-3" />
                            <span>Régler l'acompte</span>
                          </Link>
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

      {/* Official Invoice Modal */}
      <InvoiceModal
        isOpen={!!selectedBookingInvoiceId}
        onClose={() => {
          setSelectedBookingInvoiceId(null);
          setInvoiceAutoPrint(false);
        }}
        bookingId={selectedBookingInvoiceId}
        autoPrint={invoiceAutoPrint}
      />
    </div>
  );
}
