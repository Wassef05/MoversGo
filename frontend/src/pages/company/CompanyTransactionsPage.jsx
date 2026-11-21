import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Clock,
  CalendarCheck,
  Receipt,
  ArrowRight,
  Banknote,
  CreditCard,
  CheckCircle2,
  Hourglass,
  FileText,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { bookingService } from '../../services/api/bookingService';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatCurrency, formatDate } from '../../utils/cn';
import InvoiceModal from '../../components/common/InvoiceModal';
import PaymentReceiptModal from '../../components/common/PaymentReceiptModal';

function getDepositPercent(b) {
  // 1. Direct from company's quote (source of truth)
  if (b?.quote?.depositPercent && Number(b.quote.depositPercent) > 0) {
    return Number(b.quote.depositPercent);
  }
  if (b?.quote?.depositPercentage && Number(b.quote.depositPercentage) > 0) {
    return Number(b.quote.depositPercentage);
  }
  if (b?.quote?.pricing?.depositPercentage && Number(b.quote.pricing.depositPercentage) > 0) {
    return Number(b.quote.pricing.depositPercentage);
  }

  // 2. Exact mathematical calculation on Total TTC (depositAmount / totalAmount)
  const tot = b?.totalAmount || b?.quote?.totalPrice || 0;
  const dep = b?.depositAmount || b?.quote?.depositAmount || 0;
  if (tot > 0 && dep > 0) {
    const computed = Math.round((dep / tot) * 100);
    if (computed > 0) return computed;
  }

  // 3. From booking if available
  if (b?.depositPercent && Number(b.depositPercent) > 0) {
    return Number(b.depositPercent);
  }

  return 30;
}

export function CompanyTransactionsPage() {
  const { onBookingUpdate } = useNotifications();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('received');
  const [selectedReceiptBooking, setSelectedReceiptBooking] = useState(null);
  const [selectedInvoiceBookingId, setSelectedInvoiceBookingId] = useState(null);

  const fetchBookings = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await bookingService.getCompanyBookings();
      setBookings(Array.isArray(data) ? data : data.bookings ?? []);
    } catch (err) {
      if (!silent) setError('Impossible de charger les transactions. Veuillez réessayer.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // ── Real-time update on socket event ──────────────────────────────────────
  useEffect(() => {
    const unregister = onBookingUpdate('*', () => {
      fetchBookings(true);
    });
    return unregister;
  }, [onBookingUpdate, fetchBookings]);

  /* ── Computed data ───────────────────────────────────────────── */
  const depositReceived = bookings.filter(
    (b) => b.paymentStatus === 'deposit_paid' || b.paymentStatus === 'fully_paid'
  );

  const pendingSettlement = bookings.filter(
    (b) => b.paymentStatus === 'deposit_pending' && b.paymentRequested === true
  );

  const totalEncaisse = depositReceived.reduce(
    (sum, b) => sum + (b.depositAmount ?? 0),
    0
  );

  const totalEnAttente = pendingSettlement.reduce(
    (sum, b) => sum + (b.depositAmount ?? 0),
    0
  );

  const totalActif = bookings.filter((b) => b.serviceStatus !== 'cancelled').length;

  /* ── Helpers ─────────────────────────────────────────────────── */
  const clientName = (b) => {
    if (!b.client) return '—';
    return `${b.client.firstName ?? ''} ${b.client.lastName ?? ''}`.trim() || '—';
  };

  const shortRef = (id) => (id ? `#${String(id).slice(-8).toUpperCase()}` : '—');

  const paymentMethodLabel = (mode) => {
    if (mode === 'virement') return 'Carte / Virement';
    if (mode === 'espece') return 'Espèces (Jour J)';
    return mode ?? '—';
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Paiements & Transactions Financières
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Suivi des acomptes perçus sous compte séquestre et des règlements en attente client
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>Séquestre Garanti MoversGo</span>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-xs font-medium text-red-600 border border-red-200">
          {error}
        </div>
      )}

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total encaissé */}
        <div className="flex items-start gap-4 rounded-3xl bg-white p-6 shadow-subtle ring-1 ring-black/5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
            <TrendingUp className="text-emerald-600" size={22} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Total encaissé
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(totalEncaisse)} TND
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {depositReceived.length} acompte{depositReceived.length !== 1 ? 's' : ''} reçu{depositReceived.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* En attente */}
        <div className="flex items-start gap-4 rounded-3xl bg-white p-6 shadow-subtle ring-1 ring-black/5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50">
            <Clock className="text-amber-500" size={22} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Solde en attente client
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(totalEnAttente)} TND
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {pendingSettlement.length} règlement{pendingSettlement.length !== 1 ? 's' : ''} demandé{pendingSettlement.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Réservations actives */}
        <div className="flex items-start gap-4 rounded-3xl bg-white p-6 shadow-subtle ring-1 ring-black/5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
            <CalendarCheck className="text-blue-500" size={22} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Missions actives
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{totalActif}</p>
            <p className="mt-0.5 text-xs text-gray-500">réservations en cours</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="rounded-3xl bg-white shadow-subtle ring-1 ring-black/5 overflow-hidden">
        {/* Tab nav */}
        <div className="flex border-b border-gray-100 px-6 pt-4">
          <button
            onClick={() => setActiveTab('received')}
            className={`relative mr-6 pb-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'received'
                ? 'text-brand-600 font-bold'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <Receipt size={15} />
              Acomptes reçus
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  activeTab === 'received'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {depositReceived.length}
              </span>
            </span>
            {activeTab === 'received' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-brand-600" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`relative pb-3 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'pending'
                ? 'text-brand-600 font-bold'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className="flex items-center gap-2">
              <Hourglass size={15} />
              En attente de règlement
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  activeTab === 'pending'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {pendingSettlement.length}
              </span>
            </span>
            {activeTab === 'pending' && (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-t-full bg-brand-600" />
            )}
          </button>
        </div>

        {/* ── Tab: Acomptes reçus ── */}
        {activeTab === 'received' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">
                Chargement des transactions...
              </div>
            ) : depositReceived.length === 0 ? (
              <EmptyState
                icon={<Receipt className="text-gray-300" size={40} />}
                title="Aucun acompte reçu pour le moment"
                description="Les acomptes validés par vos clients apparaîtront ici."
              />
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-3.5 text-left">Réf. Réservation</th>
                    <th className="px-6 py-3.5 text-left">Client</th>
                    <th className="px-6 py-3.5 text-left">Date de paiement</th>
                    <th className="px-6 py-3.5 text-center">Taux Acompte</th>
                    <th className="px-6 py-3.5 text-right">Montant acompte</th>
                    <th className="px-6 py-3.5 text-left">Méthode</th>
                    <th className="px-6 py-3.5 text-right">Reste à recevoir</th>
                    <th className="px-6 py-3.5 text-right">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700">
                  {depositReceived.map((b) => {
                    const pct = getDepositPercent(b);
                    return (
                      <tr
                        key={b._id}
                        className="transition-colors hover:bg-gray-50/70"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                          <Link
                            to={`/company/bookings/${b._id}`}
                            className="hover:text-brand-600 underline"
                          >
                            {shortRef(b._id)}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{clientName(b)}</p>
                          {b.client?.phone && (
                            <p className="text-[11px] text-gray-400">{b.client.phone}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {b.depositPaidAt ? formatDate(b.depositPaidAt) : '—'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200">
                            {pct}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-emerald-700 text-sm">
                            {formatCurrency(b.depositAmount ?? 0)} TND
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                            {b.requestedPaymentMode === 'virement' ? (
                              <CreditCard size={13} className="text-blue-500" />
                            ) : (
                              <Banknote size={13} className="text-emerald-500" />
                            )}
                            {paymentMethodLabel(b.requestedPaymentMode)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {b.paymentStatus === 'fully_paid' ? (
                            <span className="font-bold text-emerald-600">Soldé 100%</span>
                          ) : (
                            <span className="font-semibold text-gray-800">
                              {formatCurrency(b.remainingAmount ?? 0)} TND
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptBooking(b)}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2.5 py-1.5 transition shadow-xs cursor-pointer"
                              title="Voir et télécharger la fiche de reçu"
                            >
                              <FileText size={13} className="text-emerald-600" />
                              <span>Reçu</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedInvoiceBookingId(b._id)}
                              className="inline-flex items-center gap-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-2.5 py-1.5 transition shadow-xs cursor-pointer"
                              title="Consulter la facture finale"
                            >
                              <Printer size={13} className="text-emerald-400" />
                              <span>Facture</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: En attente de règlement ── */}
        {activeTab === 'pending' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">
                Chargement des transactions...
              </div>
            ) : pendingSettlement.length === 0 ? (
              <EmptyState
                icon={<Hourglass className="text-gray-300" size={40} />}
                title="Aucun règlement en attente"
                description="Tous les acomptes demandés ont été réglés."
              />
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-3.5 text-left">Réf. Réservation</th>
                    <th className="px-6 py-3.5 text-left">Client</th>
                    <th className="px-6 py-3.5 text-center">Taux Acompte</th>
                    <th className="px-6 py-3.5 text-right">Montant acompte</th>
                    <th className="px-6 py-3.5 text-left">Date prévue</th>
                    <th className="px-6 py-3.5 text-left">Mode demandé</th>
                    <th className="px-6 py-3.5 text-center">Statut</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-slate-700">
                  {pendingSettlement.map((b) => {
                    const pct = getDepositPercent(b);
                    return (
                      <tr
                        key={b._id}
                        className="transition-colors hover:bg-gray-50/70"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                          {shortRef(b._id)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{clientName(b)}</p>
                          {b.client?.phone && (
                            <p className="text-[11px] text-gray-400">{b.client.phone}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-bold border border-brand-200">
                            {pct}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-amber-700 text-sm">
                            {formatCurrency(b.depositAmount ?? 0)} TND
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {b.scheduledDate ? formatDate(b.scheduledDate) : '—'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                            {b.requestedPaymentMode === 'virement' ? (
                              <CreditCard size={13} className="text-blue-500" />
                            ) : (
                              <Banknote size={13} className="text-emerald-500" />
                            )}
                            {paymentMethodLabel(b.requestedPaymentMode)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                            <Clock size={11} className="text-amber-600" />
                            En attente client
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/company/bookings/${b._id}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700 shadow-brand"
                          >
                            <span>Gérer</span>
                            <ArrowRight size={12} />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Fiche de Reçu Modal ── */}
      <PaymentReceiptModal
        isOpen={!!selectedReceiptBooking}
        onClose={() => setSelectedReceiptBooking(null)}
        booking={selectedReceiptBooking}
      />

      {/* ── Invoice modal ── */}
      <InvoiceModal
        isOpen={!!selectedInvoiceBookingId}
        onClose={() => setSelectedInvoiceBookingId(null)}
        bookingId={selectedInvoiceBookingId}
      />
    </div>
  );
}

/* ── Empty state helper ──────────────────────────────────────────── */
function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon}
      <p className="font-semibold text-gray-500">{title}</p>
      <p className="max-w-xs text-sm text-gray-400">{description}</p>
    </div>
  );
}
