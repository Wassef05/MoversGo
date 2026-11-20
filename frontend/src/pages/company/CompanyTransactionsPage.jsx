import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { bookingService } from '../../services/api/bookingService';
import { formatCurrency, formatDate } from '../../utils/cn';
import { InvoiceModal } from '../../components/common/InvoiceModal';

export function CompanyTransactionsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('received');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getCompanyBookings();
        setBookings(Array.isArray(data) ? data : data.bookings ?? []);
      } catch (err) {
        setError('Impossible de charger les transactions. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

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

  const shortRef = (id) => (id ? `#${String(id).slice(-6).toUpperCase()}` : '—');

  const paymentMethodLabel = (mode) => {
    if (mode === 'virement') return 'Virement';
    if (mode === 'espece') return 'Espèces';
    return mode ?? '—';
  };

  const paymentStatusBadge = (status) => {
    switch (status) {
      case 'fully_paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 size={12} /> Soldé
          </span>
        );
      case 'deposit_paid':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
            <CheckCircle2 size={12} /> Acompte reçu
          </span>
        );
      case 'deposit_pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            <Hourglass size={12} /> En attente
          </span>
        );
      default:
        return (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {status ?? '—'}
          </span>
        );
    }
  };

  const openInvoice = (booking) => {
    setSelectedBooking(booking);
    setShowInvoiceModal(true);
  };

  /* ── Render ──────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Chargement des transactions…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-2xl bg-red-50 px-8 py-6 text-center shadow">
          <p className="font-semibold text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-brand-600 px-5 py-2 text-sm font-medium text-white hover:bg-brand-700 transition"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transactions financières</h1>
        <p className="mt-1 text-sm text-gray-500">
          Suivi des acomptes reçus et des règlements en attente
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Total encaissé */}
        <div className="flex items-start gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
            <TrendingUp className="text-emerald-600" size={22} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Total encaissé
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(totalEncaisse)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {depositReceived.length} acompte{depositReceived.length !== 1 ? 's' : ''} reçu{depositReceived.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* En attente */}
        <div className="flex items-start gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50">
            <Clock className="text-amber-500" size={22} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Solde en attente
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatCurrency(totalEnAttente)}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {pendingSettlement.length} règlement{pendingSettlement.length !== 1 ? 's' : ''} à recevoir
            </p>
          </div>
        </div>

        {/* Réservations actives */}
        <div className="flex items-start gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
            <CalendarCheck className="text-blue-500" size={22} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Réservations actives
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{totalActif}</p>
            <p className="mt-0.5 text-xs text-gray-500">hors annulations</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        {/* Tab nav */}
        <div className="flex border-b border-gray-100 px-6 pt-4">
          <button
            onClick={() => setActiveTab('received')}
            className={`relative mr-6 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'received'
                ? 'text-brand-600'
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
            className={`relative pb-3 text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'text-brand-600'
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
            {depositReceived.length === 0 ? (
              <EmptyState
                icon={<Receipt className="text-gray-300" size={40} />}
                title="Aucun acompte reçu"
                description="Les acomptes validés par vos clients apparaîtront ici."
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-3 text-left">Réf. Réservation</th>
                    <th className="px-6 py-3 text-left">Client</th>
                    <th className="px-6 py-3 text-left">Date de paiement</th>
                    <th className="px-6 py-3 text-right">Montant acompte</th>
                    <th className="px-6 py-3 text-left">Méthode</th>
                    <th className="px-6 py-3 text-right">Reste à recevoir</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {depositReceived.map((b) => (
                    <tr
                      key={b._id}
                      className="transition-colors hover:bg-gray-50/70"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-700">
                        {shortRef(b._id)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{clientName(b)}</p>
                        {b.client?.phone && (
                          <p className="text-xs text-gray-400">{b.client.phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {b.depositPaidAt ? formatDate(b.depositPaidAt) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-emerald-700">
                          {formatCurrency(b.depositAmount ?? 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          {b.requestedPaymentMode === 'virement' ? (
                            <CreditCard size={13} className="text-blue-400" />
                          ) : (
                            <Banknote size={13} className="text-green-500" />
                          )}
                          {paymentMethodLabel(b.requestedPaymentMode)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {b.paymentStatus === 'fully_paid' ? (
                          <span className="font-medium text-emerald-600">Soldé</span>
                        ) : (
                          <span className="font-semibold text-gray-800">
                            {formatCurrency(b.remainingAmount ?? 0)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openInvoice(b)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 active:scale-95"
                        >
                          <FileText size={13} />
                          Facture
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Tab: En attente ── */}
        {activeTab === 'pending' && (
          <div className="overflow-x-auto">
            {pendingSettlement.length === 0 ? (
              <EmptyState
                icon={<Hourglass className="text-gray-300" size={40} />}
                title="Aucun règlement en attente"
                description="Les demandes d'acompte non encore réglées apparaîtront ici."
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <th className="px-6 py-3 text-left">Réf. Réservation</th>
                    <th className="px-6 py-3 text-left">Client</th>
                    <th className="px-6 py-3 text-right">Montant acompte</th>
                    <th className="px-6 py-3 text-left">Date prévue</th>
                    <th className="px-6 py-3 text-left">Mode demandé</th>
                    <th className="px-6 py-3 text-left">Statut</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {pendingSettlement.map((b) => (
                    <tr
                      key={b._id}
                      className="transition-colors hover:bg-amber-50/40"
                    >
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-700">
                        {shortRef(b._id)}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-800">{clientName(b)}</p>
                        {b.client?.phone && (
                          <p className="text-xs text-gray-400">{b.client.phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-semibold text-amber-700">
                          {formatCurrency(b.depositAmount ?? 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {b.depositPaidAt ? formatDate(b.depositPaidAt) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-gray-600">
                          {b.requestedPaymentMode === 'virement' ? (
                            <CreditCard size={13} className="text-blue-400" />
                          ) : (
                            <Banknote size={13} className="text-green-500" />
                          )}
                          {paymentMethodLabel(b.requestedPaymentMode)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{paymentStatusBadge(b.paymentStatus)}</td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          to={`/company/bookings/${b._id}`}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-600 px-3 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-600 hover:text-white active:scale-95"
                        >
                          Voir la réservation
                          <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ── Invoice modal ── */}
      {showInvoiceModal && selectedBooking && (
        <InvoiceModal
          booking={selectedBooking}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedBooking(null);
          }}
        />
      )}
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
