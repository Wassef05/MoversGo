import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { bookingService } from "../../services/api/bookingService";
import { formatCurrency, formatDate } from "../../utils/cn";
import { StatusBadge } from "../../components/common/StatusBadge";
import InvoiceModal from "../../components/common/InvoiceModal";
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
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// ─── helpers ────────────────────────────────────────────────────────────────

function getDepositPercent(b) {
  return b?.quote?.depositPercent ?? b?.depositPercent ?? 20;
}

function getSequestreState(b) {
  if (b.paymentStatus === "deposit_paid" || b.paymentStatus === "paid") {
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
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3.5 w-3.5" /> Consigné
      </span>
    );
  if (state === "en_attente")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        <Clock className="h-3.5 w-3.5" /> En attente
      </span>
    );
  if (state === "especes")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
        <Banknote className="h-3.5 w-3.5" /> Espèces
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">
      —
    </span>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function ClientPaymentsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invoiceBooking, setInvoiceBooking] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await bookingService.getMyBookings();
        setBookings(Array.isArray(data) ? data : []);
      } catch (err) {
        toast.error("Impossible de charger vos paiements.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── derived stats ──────────────────────────────────────────────────────────

  const paidBookings = bookings.filter(
    (b) =>
      b.paymentStatus === "deposit_paid" ||
      b.paymentStatus === "paid"
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
        b.paymentStatus !== "paid"
    )
    .reduce((sum, b) => sum + (b.depositAmount ?? 0), 0);

  const escrowBookings = bookings.filter((b) => b.paymentRequested);

  // ── loading skeleton ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg
            className="h-8 w-8 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          <span className="text-sm">Chargement des paiements…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-6">
      {/* ── header ── */}
      <div className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <CreditCard className="h-6 w-6 text-brand-600" />
          Mes Paiements & Séquestre
        </h1>
        <p className="text-sm text-gray-500">
          Suivi de vos acomptes, fonds en séquestre et historique de transactions.
        </p>
      </div>

      {/* ── stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total acomptes consignés */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-xl bg-brand-50 p-2.5">
            <TrendingUp className="h-5 w-5 text-brand-600" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Total acomptes consignés
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(totalDeposits)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {paidBookings.length} réservation{paidBookings.length !== 1 ? "s" : ""} payée{paidBookings.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Fonds en séquestre */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-xl bg-green-50 p-2.5">
            <Lock className="h-5 w-5 text-green-600" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Fonds en séquestre
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(escrowFunds)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Fonds bloqués chez MoversGo jusqu'au déménagement
          </p>
        </div>

        {/* En attente de règlement */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-xl bg-amber-50 p-2.5">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            En attente de règlement
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatCurrency(pendingSettlement)}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Acomptes demandés non encore réglés
          </p>
        </div>
      </div>

      {/* ── escrow section ── */}
      {escrowBookings.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <ShieldCheck className="h-5 w-5 text-brand-600" />
            État du Séquestre
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {escrowBookings.map((b) => {
              const state = getSequestreState(b);
              const pct = getDepositPercent(b);
              const isPaid = state === "consigne" || state === "especes";

              return (
                <div
                  key={b._id}
                  className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  {/* company */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 leading-tight">
                        {b.company?.companyName ?? "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        Réf.&nbsp;
                        <span className="font-mono">
                          {String(b._id).slice(-8).toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <SequestreBadge booking={b} />
                  </div>

                  {/* amounts */}
                  <div className="flex justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Montant séquestré</p>
                      <p className="font-bold text-gray-900">
                        {formatCurrency(b.depositAmount ?? 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Acompte</p>
                      <p className="font-semibold text-brand-600">{pct}%</p>
                    </div>
                  </div>

                  {/* state label */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {state === "consigne" && (
                      <>
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        Fonds consignés — débloqués à la fin du déménagement.
                      </>
                    )}
                    {state === "en_attente" && (
                      <>
                        <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                        Acompte demandé par le déménageur. Réglez pour confirmer.
                      </>
                    )}
                    {state === "especes" && (
                      <>
                        <Banknote className="h-4 w-4 shrink-0 text-blue-500" />
                        Paiement en espèces — à remettre le jour J.
                      </>
                    )}
                  </div>

                  {/* CTA */}
                  {!isPaid && (
                    <Link
                      to={`/client/bookings/${b._id}`}
                      className="mt-auto flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
                    >
                      Régler l'acompte
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
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <FileText className="h-5 w-5 text-brand-600" />
          Historique des transactions
        </h2>

        {bookings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
            <CreditCard className="h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-400">
              Aucune transaction pour le moment.
            </p>
            <Link
              to="/client/search"
              className="text-sm font-medium text-brand-600 hover:underline"
            >
              Trouver un déménageur →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 text-left">Réf. Réservation</th>
                  <th className="px-4 py-3 text-left">Prestation</th>
                  <th className="px-4 py-3 text-left">Déménageur</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Montant acompte</th>
                  <th className="px-4 py-3 text-right">Reste à régler</th>
                  <th className="px-4 py-3 text-center">Séquestre</th>
                  <th className="px-4 py-3 text-center">Action / Reçu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map((b) => {
                  const pct = getDepositPercent(b);
                  const isPaid =
                    b.paymentStatus === "deposit_paid" ||
                    b.paymentStatus === "paid";
                  const date = b.depositPaidAt ?? b.createdAt;

                  return (
                    <tr
                      key={b._id}
                      className="transition-colors hover:bg-gray-50/60"
                    >
                      {/* ref */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-gray-500">
                          #{String(b._id).slice(-8).toUpperCase()}
                        </span>
                      </td>

                      {/* prestation */}
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">
                          Acompte de confirmation ({pct}%)
                        </span>
                      </td>

                      {/* company */}
                      <td className="px-4 py-3 text-gray-700">
                        {b.company?.companyName ?? "—"}
                      </td>

                      {/* date */}
                      <td className="px-4 py-3 text-gray-500">
                        {date ? formatDate(date) : "—"}
                      </td>

                      {/* deposit amount */}
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(b.depositAmount ?? 0)}
                      </td>

                      {/* remaining */}
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(b.remainingAmount ?? 0)}
                      </td>

                      {/* badge */}
                      <td className="px-4 py-3 text-center">
                        <SequestreBadge booking={b} />
                      </td>

                      {/* action */}
                      <td className="px-4 py-3 text-center">
                        {isPaid ? (
                          <button
                            onClick={() => setInvoiceBooking(b)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            Facture
                          </button>
                        ) : b.paymentRequested ? (
                          <Link
                            to={`/client/bookings/${b._id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700"
                          >
                            Régler
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
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
      <div className="flex items-start gap-3 rounded-2xl border border-brand-100 bg-brand-50/40 px-5 py-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-brand-700">
            Vos fonds sont protégés par MoversGo.
          </span>{" "}
          Votre acompte est conservé en séquestre et ne sera libéré au déménageur
          qu'une fois votre déménagement terminé et validé.
        </div>
      </div>

      {/* ── invoice modal ── */}
      {invoiceBooking && (
        <InvoiceModal
          booking={invoiceBooking}
          onClose={() => setInvoiceBooking(null)}
        />
      )}
    </div>
  );
}
