import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { dataService } from "../../services/mock/dataService";
import { StatCard } from "../../components/common/StatCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { RatingStars } from "../../components/common/RatingStars";
import { formatCurrency, formatDate } from "../../utils/cn";
import {
  FileText,
  FileSpreadsheet,
  CalendarCheck2,
  CreditCard,
  PlusCircle,
  ArrowRight,
  Truck,
  MapPin,
  Clock,
  Scale,
  Sparkles,
  Edit3
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export function ClientDashboardPage() {
  const { currentUser } = useAuth();
  const { onBookingUpdate, onQuoteUpdate, onRequestUpdate } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      const allReqs = await dataService.getRequests();
      const allQuotes = await dataService.getQuotes();
      const allBookings = await dataService.getBookings();

      const myId = (currentUser?._id || currentUser?.id)?.toString();
      const userReqs = allReqs.filter((r) => {
        const rClientId = (r.clientId || r.client?._id || r.client)?.toString();
        return (myId && rClientId === myId) || r.clientEmail === currentUser?.email;
      });

      const userBookings = allBookings.filter((b) => {
        const bClientId = (b.clientId || b.client?._id || b.client)?.toString();
        return (myId && bClientId === myId) || (b.clientName && currentUser?.firstName && b.clientName.includes(currentUser.firstName));
      });

      // User's quotes
      const reqIdSet = new Set((userReqs.length > 0 ? userReqs : allReqs).map((r) => (r._id || r.id)?.toString()));
      const userQuotes = allQuotes.filter((q) => {
        const qReqId = (q.requestId || q.movingRequest?._id || q.movingRequest)?.toString();
        return !qReqId || reqIdSet.has(qReqId);
      });

      setRequests(userReqs.length > 0 ? userReqs : allReqs);
      setQuotes(userQuotes.length > 0 ? userQuotes : allQuotes);
      setBookings(userBookings.length > 0 ? userBookings : allBookings);
    } catch (err) {
      console.error("Erreur chargement données dashboard client:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    const unregisterBooking = onBookingUpdate?.("*", () => {
      loadData();
    });
    const unregisterQuote = onQuoteUpdate?.(() => {
      loadData();
    });
    const unregisterRequest = onRequestUpdate?.(() => {
      loadData();
    });
    return () => {
      if (typeof unregisterBooking === "function") unregisterBooking();
      if (typeof unregisterQuote === "function") unregisterQuote();
      if (typeof unregisterRequest === "function") unregisterRequest();
    };
  }, [currentUser, onBookingUpdate, onQuoteUpdate, onRequestUpdate]);

  const nextBooking = bookings.find((b) => b.status === "confirmed") || bookings[0];

  const totalSpent = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const chartData = [
    { month: "Jan", devis: 2, depenses: 495 },
    { month: "Fév", devis: 3, depenses: 1595 },
    { month: "Mar", devis: 1, depenses: 0 },
    { month: "Avr", devis: 0, depenses: 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
            <span className="w-3.5 h-3.5" />
            <span>Espace Particulier Actif</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bonjour {currentUser?.firstName || "Yassine"}
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Vous avez <strong>{quotes.length} devis en attente d'examen</strong>. Comparez les offres de nos déménageurs partenaires pour réserver au meilleur prix.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 z-10 w-full md:w-auto">
          <Link
            to="/client/requests/new"
            className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 transition-colors text-white font-bold text-xs flex items-center justify-center gap-2 shadow-brand shadow-sm whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nouveau projet</span>
          </Link>
          <Link
            to="/client/compare"
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 whitespace-nowrap"
          >
            <Scale className="w-4 h-4 text-brand-400" />
            <span>Comparer mes devis</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Demandes publiées"
          value={requests.length}
          subtitle="Projets en ligne"
          icon={FileText}
          color="brand"
        />
        <StatCard
          title="Devis reçus"
          value={quotes.length}
          subtitle="Propositions chiffrées"
          icon={FileSpreadsheet}
          color="blue"
        />
        <StatCard
          title="Réservations"
          value={bookings.length}
          subtitle="Déménagements validés"
          icon={CalendarCheck2}
          color="emerald"
        />
        <StatCard
          title="Dépenses cumulées"
          value={formatCurrency(totalSpent)}
          subtitle="Acomptes & Soldes"
          icon={CreditCard}
          color="purple"
        />
      </div>

      {/* Next Move Alert / Spotlight */}
      {nextBooking && (
        <div className="bg-white rounded-3xl p-6 border border-brand-200/80 shadow-card relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
                    Prochain Déménagement Confirmé
                  </span>
                  <StatusBadge status={nextBooking.status} />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {nextBooking.departureCity} ➔ {nextBooking.arrivalCity}
                </h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(nextBooking.movingDate)} à {nextBooking.movingTime}
                  </span>
                  <span>•</span>
                  <span>Transporteur : <strong>{nextBooking.companyName}</strong></span>
                  <span>•</span>
                  <span>Volume : <strong>{nextBooking.volume}</strong></span>
                </p>
              </div>
            </div>

            <Link
              to={`/client/bookings/${nextBooking._id || nextBooking.id}`}
              className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <span>Suivre la prestation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Grid: Requests & Recent Quotes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Requests Table */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Mes dernières demandes</h3>
              <p className="text-xs text-slate-500">Statut des projets et propositions reçues</p>
            </div>
            <Link
              to="/client/requests"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {requests.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Aucune demande en cours. Créez votre première demande pour recevoir des devis !
              </div>
            ) : (
              requests.map((req) => (
                <div key={req._id || req.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <Link
                      to={`/client/requests/${req._id || req.id}`}
                      className="text-sm font-bold text-slate-900 hover:text-brand-600 transition-colors line-clamp-1"
                    >
                      {req.title}
                    </Link>
                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{req.departure?.city || req.departureAddress?.city} ➔ {req.arrival?.city || req.arrivalAddress?.city}</span>
                      <span>•</span>
                      <span>{req.inventory?.estimatedVolume || req.estimatedVolume || 0} m³</span>
                      <span>•</span>
                      <span>Prévu le {formatDate(req.desiredDate || req.preferredDate)}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={req.status} />
                    {(!req.quotesCount || req.quotesCount === 0) && req.status === "pending" && (
                      <Link
                        to={`/client/requests/${req._id || req.id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-50 transition-colors"
                        title="Modifier cette demande"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Link>
                    )}
                    <Link
                      to={`/client/requests/${req._id || req.id}`}
                      className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
                      title="Voir les détails"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Quotes & Comparison Spotlight */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Derniers devis reçus</h3>
              <p className="text-xs text-slate-500">Offres des entreprises de déménagement</p>
            </div>
            <Link
              to="/client/quotes"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {quotes.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Aucun devis reçu pour le moment.
              </div>
            ) : (
              quotes.map((q) => (
                <div
                  key={q._id || q.id}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">{q.companyName || q.company?.companyName || "Déménageur partenaire"}</p>
                    <RatingStars rating={q.companyRating || q.company?.averageRating || 5} count={q.companyReviewsCount || q.company?.totalReviews || 1} size="xs" />
                    <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{q.requestTitle || q.movingRequest?.title || "Déménagement"}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-extrabold text-slate-900">
                      {formatCurrency(q.pricing?.total || q.totalPrice || 0)}
                    </p>
                    <Link
                      to={`/client/quotes/${q._id || q.id}`}
                      className="text-[11px] font-bold text-brand-600 hover:underline mt-0.5 block"
                    >
                      Examiner le devis
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2">
            <Link
              to="/client/compare"
              className="w-full py-2.5 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold hover:bg-brand-100 transition-colors flex items-center justify-center gap-2"
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Ouvrir la table de comparaison</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
        <h3 className="text-base font-bold text-slate-900">Historique des devis et dépenses (2024)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  borderColor: "#1e293b",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="depenses" name="Dépenses (€)" fill="#e11d48" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

