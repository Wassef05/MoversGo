import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { bookingService } from "../../services/api/bookingService";
import { formatCurrency, formatDate } from "../../utils/cn";
import { StatusBadge } from "../../components/common/StatusBadge";
import InvoiceModal from "../../components/common/InvoiceModal";
import PaymentReceiptModal from "../../components/common/PaymentReceiptModal";
import {
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  Lock,
  Banknote,
  TrendingUp,
  ArrowRight,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// ─── helpers ────────────────────────────────────────────────────────────────

function getDepositPercent(b) {
  if (b?.depositPercent != null) return b.depositPercent;
  if (b?.quote?.depositPercent != null) return b.quote.depositPercent;
  const tot = b?.totalAmount || b?.quote?.totalPrice || 0;
  const dep = b?.depositAmount || b?.quote?.depositAmount || 0;
  if (tot > 0 && dep > 0) {
    return Math.round((dep / tot) * 100);
  }
  return 30;
}

function getSequestreState(b) {
  if (b.paymentStatus === "deposit_paid" || b.paymentStatus === "paid" || b.paymentStatus === "fully_paid") {
    if (b.requestedPaymentMode === "espece") return "especes";
    return "consigne";
  }
  if (b.paymentRequested) return "en_attente";
  return "none";
}

function SequestreBadge({ booking }) {
  const state = getSequestreState(booking);
  if (state === "consigne")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Consigné (Séquestre)
      </span>
    );
  if (state === "en_attente")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200 animate-pulse">
        <Clock className="h-3.5 w-3.5 text-amber-600" /> En attente de paiement
      </span>
    );
  if (state === "especes")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 border border-blue-200">
        <Banknote className="h-3.5 w-3.5 text-blue-600" /> Espèces le jour J
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
      —
    </span>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function ClientPaymentsPage() {
  const { user } = useAuth();
  const { onBookingUpdate } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState(null);
  const [selectedInvoiceBookingId, setSelectedInvoiceBookingId] = useState(null);
  const [invoiceAutoPrint, setInvoiceAutoPrint] = useState(false);

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await bookingService.getMyBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silent) toast.error("Impossible de charger vos paiements.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // ── Real-time auto-refresh without page reload ─────────────────────────────
  useEffect(() => {
    const unregister = onBookingUpdate("*", () => {
      // Reload quietly when company requests payment or payment completes
      loadBookings(true);
    });
    return unregister;
  }, [onBookingUpdate, loadBookings]);

  // ── derived stats ──────────────────────────────────────────────────────────

  const paidBookings = bookings.filter(
    (b) =>
      b.paymentStatus === "deposit_paid" ||
      b.paymentStatus === "paid" ||
      b.paymentStatus === "fully_paid"
  );

  const totalDeposits = paidBookings.reduce(
    (sum, b) => sum + (b.depositAmount ?? 0),
    0
  );

  const escrowFunds = paidBookings
    .filter((b) => b.requestedPaymentMode !== "espece")
    .reduce((sum, b) => sum + (b.depositAmount ?? 0), 0);

  const pendingSettlement = bookings
    .filter(
      (b) =>
        b.paymentRequested &&
        b.paymentStatus !== "deposit_paid" &&
        b.paymentStatus !== "paid" &&
        b.paymentStatus !== "fully_paid"
    )
    .reduce((sum, b) => sum + (b.depositAmount ?? 0), 0);

  const escrowBookings = bookings.filter((b) => b.paymentRequested);

  // ── loading skeleton ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Chargement des paiements & séquestre…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-6">
      {/* ── header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 tracking-tight">
            <CreditCard className="h-6 w-6 text-brand-600" />
            Mes Paiements & Séquestre
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Suivi en temps réel de vos acomptes, état du compte séquestre et reçus certifiés MoversGo.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Fonds 100% protégés sous séquestre</span>
        </div>
      </div>

      {/* ── stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total acomptes consignés */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-subtle">
          <div className="mb-3 inline-flex rounded-2xl bg-brand-50 p-2.5">
            <TrendingUp className="h-5 w-5 text-brand-600" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total acomptes consignés
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {formatCurrency(totalDeposits)} TND
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {paidBookings.length} réservation{paidBookings.length !== 1 ? "s" : ""} avec acompte réglé
          </p>
        </div>

        {/* Fonds en séquestre */}
        <div className="rounded-3xl border border-emerald-200/80 bg-white p-5 shadow-subtle">
          <div className="mb-3 inline-flex rounded-2xl bg-emerald-50 p-2.5">
            <Lock className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Fonds bloqués en séquestre
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-700">
            {formatCurrency(escrowFunds)} TND
          </p>
          <p className="mt-1 text-xs text-emerald-600/80">
            Sécurisés chez MoversGo jusqu'au déchargement
          </p>
        </div>

        {/* En attente de règlement */}
        <div className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-subtle">
          <div className="mb-3 inline-flex rounded-2xl bg-amber-50 p-2.5">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            En attente de versement
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-700">
            {formatCurrency(pendingSettlement)} TND
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Acomptes demandés non encore réglés
          </p>
        </div>
      </div>

      {/* ── escrow section ── */}
      {escrowBookings.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
              <ShieldCheck className="h-5 w-5 text-brand-600" />
              État du Séquestre par Réservation
            </h2>
            <span className="text-xs text-slate-400">
              Mise à jour en temps réel
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {escrowBookings.map((b) => {
              const state = getSequestreState(b);
              const pct = getDepositPercent(b);
              const isPaid = state === "consigne" || state === "especes";

              return (
                <div
                  key={b._id}
                  className="flex flex-col gap-3 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-subtle hover:border-slate-300 transition-colors"
                >
                  {/* company */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">
                        {b.company?.companyName ?? "Déménageur Agréé"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        Réf.&nbsp;
                        <span className="font-mono font-bold text-slate-700">
                          #{String(b._id).slice(-8).toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <SequestreBadge booking={b} />
                  </div>

                  {/* amounts */}
                  <div className="flex justify-between items-center rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm">
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Montant Acompte
                      </p>
                      <p className="font-extrabold text-slate-900 text-base">
                        {formatCurrency(b.depositAmount ?? 0)} TND
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                        Taux Devis
                      </p>
                      <span className="inline-block px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold text-xs border border-brand-200">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* state label */}
                  <div className="text-xs text-slate-600 min-h-[36px] flex items-center gap-1.5">
                    {state === "consigne" && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-800 font-medium">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        Fonds consignés sous séquestre — Débloqués à livraison.
                      </span>
                    )}
                    {state === "en_attente" && (
                      <span className="inline-flex items-center gap-1.5 text-amber-800 font-medium">
                        <Clock className="h-4 w-4 shrink-0 text-amber-600" />
                        Demande transmise. Effectuez le règlement pour valider.
                      </span>
                    )}
                    {state === "especes" && (
                      <span className="inline-flex items-center gap-1.5 text-blue-800 font-medium">
                        <Banknote className="h-4 w-4 shrink-0 text-blue-600" />
                        Acompte convenu en espèces à régler le jour J.
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  {isPaid ? (
                    <button
                      type="button"
                      onClick={() => setSelectedReceiptBooking(b)}
                      className="mt-auto flex items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-sm cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Consulter le Reçu & Séquestre</span>
                    </button>
                  ) : (
                    <Link
                      to={`/client/bookings/${b._id}`}
                      className="mt-auto flex items-center justify-center gap-1.5 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-700 shadow-brand"
                    >
                      <span>Régler l'acompte ({pct}%)</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── transactions table ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold text-slate-900">
            <FileText className="h-5 w-5 text-brand-600" />
            Historique des Transactions & Fiches de Reçu
          </h2>
        </div>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center">
            <CreditCard className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500 font-medium">
              Aucune transaction financière pour le moment.
            </p>
            <Link
              to="/client/requests/new"
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              Publier un besoin de déménagement →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-subtle">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="px-4 py-3.5">Réf. Réservation</th>
                  <th className="px-4 py-3.5">Prestation & Taux</th>
                  <th className="px-4 py-3.5">Déménageur</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5 text-right">Montant Acompte</th>
                  <th className="px-4 py-3.5 text-right">Reste à régler</th>
                  <th className="px-4 py-3.5 text-center">État Séquestre</th>
                  <th className="px-4 py-3.5 text-right">Action / Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bookings.map((b) => {
                  const pct = getDepositPercent(b);
                  const isPaid =
                    b.paymentStatus === "deposit_paid" ||
                    b.paymentStatus === "paid" ||
                    b.paymentStatus === "fully_paid";
                  const date = b.depositPaidAt ?? b.createdAt;

                  return (
                    <tr
                      key={b._id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      {/* ref */}
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/client/bookings/${b._id}`}
                          className="font-mono font-bold text-slate-900 hover:text-brand-600 underline"
                        >
                          #{String(b._id).slice(-8).toUpperCase()}
                        </Link>
                      </td>

                      {/* prestation with real deposit percent */}
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-900 block">
                          Acompte de confirmation
                        </span>
                        <span className="text-[11px] font-bold text-brand-600">
                          Taux choisi : {pct}% du devis
                        </span>
                      </td>

                      {/* company */}
                      <td className="px-4 py-3.5 font-semibold text-slate-800">
                        {b.company?.companyName ?? "—"}
                      </td>

                      {/* date */}
                      <td className="px-4 py-3.5 text-slate-500">
                        {date ? formatDate(date) : "—"}
                      </td>

                      {/* deposit amount */}
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        {formatCurrency(b.depositAmount ?? 0)} TND
                      </td>

                      {/* remaining */}
                      <td className="px-4 py-3.5 text-right text-slate-600 font-medium">
                        {formatCurrency(b.remainingAmount ?? 0)} TND
                      </td>

                      {/* badge */}
                      <td className="px-4 py-3.5 text-center">
                        <SequestreBadge booking={b} />
                      </td>

                      {/* action / receipt */}
                      <td className="px-4 py-3.5 text-right">
                        {isPaid ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Fiche de Reçu & Séquestre Modal (PNG download + print) */}
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptBooking(b)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1.5 text-xs transition shadow-xs cursor-pointer"
                              title="Consulter et télécharger la fiche de reçu en image"
                            >
                              <FileText className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Reçu (Image)</span>
                            </button>

                            {/* Facture Finale */}
                            <button
                              type="button"
                              onClick={() => {
                                setInvoiceAutoPrint(false);
                                setSelectedInvoiceBookingId(b._id);
                              }}
                              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-2 py-1.5 text-xs transition cursor-pointer"
                              title="Consulter la facture officielle"
                            >
                              <Printer className="h-3.5 w-3.5 text-slate-500" />
                              <span>Facture</span>
                            </button>
                          </div>
                        ) : b.paymentRequested ? (
                          <Link
                            to={`/client/bookings/${b._id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700 shadow-brand"
                          >
                            <span>Régler l'acompte</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── info banner ── */}
      <div className="flex items-start gap-3 rounded-3xl border border-brand-200/80 bg-brand-50/50 p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-bold text-brand-800 text-sm">
            Transparence Financière & Séquestre Garanti MoversGo
          </p>
          <p className="leading-relaxed">
            Votre versement d'acompte est sécurisé sur un compte séquestre bloqué et dédié.
            Aucun fond n'est reversé au déménageur avant la livraison conforme de vos biens.
            Chaque transaction génère un récépissé officiel téléchargeable en image PNG ou imprimable pour valoir ce que de droit.
          </p>
        </div>
      </div>

      {/* ── Fiche de Reçu & Séquestre Modal ── */}
      <PaymentReceiptModal
        isOpen={!!selectedReceiptBooking}
        onClose={() => setSelectedReceiptBooking(null)}
        booking={selectedReceiptBooking}
      />

      {/* ── Invoice Modal ── */}
      <InvoiceModal
        isOpen={!!selectedInvoiceBookingId}
        onClose={() => {
          setSelectedInvoiceBookingId(null);
          setInvoiceAutoPrint(false);
        }}
        bookingId={selectedInvoiceBookingId}
        autoPrint={invoiceAutoPrint}
      />
    </div>
  );
}
