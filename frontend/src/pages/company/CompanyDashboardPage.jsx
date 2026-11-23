import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationContext";
import { requestService } from "../../services/api/requestService";
import { quoteService } from "../../services/api/quoteService";
import { bookingService } from "../../services/api/bookingService";
import { companyService } from "../../services/api/companyService";
import { recommendationService } from "../../services/api/recommendationService";
import { StatCard } from "../../components/common/StatCard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { formatCurrency, formatDate } from "../../utils/cn";
import { toast } from "sonner";
import {
  TrendingUp,
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  CalendarCheck2,
  CalendarDays,
  Truck,
  ArrowRight,
  Eye,
  MapPin,
  Clock,
  Sparkles,
  Percent,
  ShieldAlert,
  AlertCircle,
  Upload,
  FileCheck,
  BellRing,
  Send,
  User,
  Phone
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

export function CompanyDashboardPage() {
  const { currentUser } = useAuth();
  const { onBookingUpdate, onRequestUpdate, onQuoteUpdate } = useNotifications();
  const [requests, setRequests] = useState([]);
  const [recommendedRequests, setRecommendedRequests] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [companyProfile, setCompanyProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingRne, setUploadingRne] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState(null);

  const loadData = async () => {
    try {
      const [reqRes, recRes, quoteRes, bookRes, profileRes, statsRes] = await Promise.all([
        requestService.getAvailableRequests().catch(() => ({ data: [] })),
        recommendationService.getCompanyRecommendations({ limit: 4, sortBy: "score" }).catch(() => ({ recommendations: [] })),
        quoteService.getMyQuotes().catch(() => ({ data: [] })),
        bookingService.getCompanyBookings({ limit: 20 }).catch(() => ({ data: [] })),
        companyService.getMyProfile().catch(() => null),
        companyService.getCompanyStatistics().catch(() => null),
      ]);

      const reqList = Array.isArray(reqRes)
        ? reqRes
        : Array.isArray(reqRes?.data)
          ? reqRes.data
          : Array.isArray(reqRes?.requests)
            ? reqRes.requests
            : [];

      const recList = Array.isArray(recRes?.recommendations)
        ? recRes.recommendations
        : Array.isArray(recRes)
          ? recRes
          : [];

      const quoteList = Array.isArray(quoteRes)
        ? quoteRes
        : Array.isArray(quoteRes?.data)
          ? quoteRes.data
          : Array.isArray(quoteRes?.quotes)
            ? quoteRes.quotes
            : [];

      const bookList = Array.isArray(bookRes)
        ? bookRes
        : Array.isArray(bookRes?.data)
          ? bookRes.data
          : Array.isArray(bookRes?.bookings)
            ? bookRes.bookings
            : [];

      const rawStats = statsRes?.overview
        ? statsRes
        : (statsRes?.data?.overview ? statsRes.data : (statsRes?.data || statsRes));

      setRequests(reqList);
      setRecommendedRequests(recList);
      setQuotes(quoteList);
      setBookings(bookList);
      if (profileRes?.data?.company) {
        setCompanyProfile(profileRes.data.company);
      } else if (profileRes?.company) {
        setCompanyProfile(profileRes.company);
      }
      if (rawStats?.overview) {
        setStats(rawStats);
      }
    } catch (err) {
      console.error("Erreur chargement dashboard entreprise:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unregBooking = onBookingUpdate("*", () => {
      loadData();
    });
    const unregRequest = onRequestUpdate(() => {
      loadData();
    });
    const unregQuote = onQuoteUpdate?.(() => {
      loadData();
    });
    return () => {
      unregBooking();
      unregRequest();
      if (typeof unregQuote === "function") unregQuote();
    };
  }, [currentUser, onBookingUpdate, onRequestUpdate, onQuoteUpdate]);

  const handleResubmitRne = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier PDF ou image valide.");
      return;
    }

    setUploadingRne(true);
    const formData = new FormData();
    formData.append("rneDocument", file);

    try {
      const res = await companyService.resubmitRne(formData);
      if (res?.data?.company) {
        setCompanyProfile(res.data.company);
      }
      toast.success("Nouvel extrait RNE transmis à l'administrateur !", {
        description: "Votre dossier a été soumis pour ré-examen prioritaire par l'administration MoversGo.",
      });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur lors du téléversement du RNE");
    } finally {
      setUploadingRne(false);
    }
  };

  const revenueData = stats?.monthlyTimeline && stats.monthlyTimeline.length > 0
    ? stats.monthlyTimeline.map((m) => ({
      month: m.month,
      ca: m.caNet || m.ca || 0,
      caTTC: m.ca || 0,
      moves: m.moves || 0,
    }))
    : [
      { month: "Juil", ca: 0, moves: 0 },
      { month: "Août", ca: 0, moves: 0 },
      { month: "Sep", ca: 0, moves: 0 },
      { month: "Oct", ca: 0, moves: 0 },
      { month: "Nov", ca: bookings.reduce((sum, b) => sum + (b.netToCompany || b.totalAmount || 0), 0), moves: bookings.length },
    ];

  const totalRevenue = stats?.overview?.caTotal ?? bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const acceptedQuotes = stats?.overview?.acceptedQuotes ?? quotes.filter((q) => q.status === "accepted").length;
  const totalQuotesCount = stats?.overview?.totalQuotes ?? quotes.length;
  const acceptanceRate = totalQuotesCount > 0
    ? `${Math.round((acceptedQuotes / totalQuotesCount) * 100)}%`
    : "0%";

  const comp = companyProfile || currentUser?.company;
  const isNeedsRectification = comp?.verificationStatus === "needs_rectification" || (comp?.verificationStatus === "rejected" && comp?.rectificationNotes);
  const isPendingVerification = !isNeedsRectification && (comp?.verificationStatus === "pending" || comp?.verificationStatus === "under_review");

  const handleQuickReminder = async (booking, e) => {
    if (e) e.stopPropagation();
    const bId = booking._id || booking.id;
    setSendingReminderId(bId);
    try {
      const res = await bookingService.sendMovingReminder(bId);
      toast.success(res?.message || "Rappel de déménagement envoyé avec succès au client !");
      setBookings((prev) =>
        prev.map((item) =>
          (item._id || item.id) === bId
            ? {
              ...item,
              lastReminderSentAt: res?.data?.lastReminderSentAt || new Date().toISOString(),
              remindersCount: (item.remindersCount || 0) + 1,
            }
            : item
        )
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Erreur lors de l'envoi du rappel.");
    } finally {
      setSendingReminderId(null);
    }
  };

  const getCountdownBadge = (scheduledDate) => {
    if (!scheduledDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(scheduledDate);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Passé (${Math.abs(diffDays)}j)`, color: "bg-slate-100 text-slate-600 border-slate-200" };
    }
    if (diffDays === 0) {
      return { text: "Aujourd'hui !", color: "bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse" };
    }
    if (diffDays === 1) {
      return { text: "Demain (J-1)", color: "bg-amber-100 text-amber-800 border-amber-300 font-bold" };
    }
    if (diffDays <= 3) {
      return { text: `Dans ${diffDays}j (J-${diffDays})`, color: "bg-amber-50 text-amber-700 border-amber-200 font-semibold" };
    }
    return { text: `Dans ${diffDays}j`, color: "bg-blue-50 text-blue-700 border-blue-200" };
  };

  return (
    <div className="space-y-8">
      {/* Alert Banner: Rectification Required */}
      {isNeedsRectification && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-500/30 text-amber-950 shadow-subtle flex flex-col md:flex-row items-start md:items-center justify-between gap-5 backdrop-blur-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider bg-amber-200/90 text-amber-950 px-2.5 py-0.5 rounded-md">
                  Action Requise • Rectification Dossier RNE
                </span>
                <span className="text-xs text-amber-900 font-semibold">
                  Instruction administrative MoversGo Tunisie
                </span>
              </div>
              <p className="text-xs text-amber-950 font-bold leading-relaxed bg-white/80 p-3.5 rounded-2xl border border-amber-200">
                "{comp?.rectificationNotes || comp?.rejectionReason || "Veuillez fournir un extrait RNE officiel datant de moins de 3 mois et vérifier vos coordonnées légales."}"
              </p>
              <p className="text-[11px] text-amber-800">
                Téléversez ci-contre une copie PDF nette de votre extrait RNE officiel (validité &lt; 3 mois) pour déclencher l'audit immédiat et activer votre compte.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 self-end md:self-auto flex-shrink-0 w-full sm:w-auto">
            <label className="cursor-pointer px-5 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto">
              <Upload className="w-4 h-4" />
              <span>{uploadingRne ? "Envoi en cours..." : "Téléverser nouvel Extrait RNE (PDF)"}</span>
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg"
                className="hidden"
                disabled={uploadingRne}
                onChange={handleResubmitRne}
              />
            </label>
          </div>
        </div>
      )}

      {/* Alert Banner for Pending Approval */}
      {isPendingVerification && (
        <div className="p-5 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 shadow-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <span>Dossier d'agrément en cours d'audit administratif</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md">
                  Vérification RNE
                </span>
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                Votre extrait RNE et vos pièces légales sont en cours de validation par l'équipe administrative de MoversGo Tunisie. Vous recevrez une notification par email dès la validation finale de votre compte professionnel.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-300 flex-shrink-0">
            Délai moyen : &lt; 24h ouvrées
          </span>
        </div>
      )}

      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-slate-800">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portail Professionnel • {currentUser?.company?.companyName || "Entreprise Partenaire"}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bonjour {currentUser?.firstName || "Partenaire"} 👋
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
            Il y a <strong>{requests.length} nouvelles demandes</strong> sur vos trajets habituels. Soumettez vos devis pour optimiser vos retours à vide.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link
            to="/company/recommendations"
            className="px-5 py-3 rounded-xl bg-[#800020] hover:bg-[#660019] transition-colors text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm border border-white/20 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Opportunités recommandées</span>
          </Link>
          <Link
            to="/company/requests"
            className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-white font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 whitespace-nowrap"
          >
            <FileText className="w-4 h-4 text-brand-400" />
            <span>Toutes les demandes</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Demandes à pourvoir"
          value={requests.length}
          subtitle="Sur votre zone"
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Devis transmis"
          value={totalQuotesCount}
          subtitle={`${acceptedQuotes} acceptés`}
          icon={FileSpreadsheet}
          color="purple"
        />
        <StatCard
          title="Taux d'acceptation"
          value={acceptanceRate}
          trend={stats?.overview?.benchmark || "+4.2%"}
          trendLabel=""
          icon={Percent}
          color="emerald"
        />
        <StatCard
          title="Chiffre d'Affaires"
          value={formatCurrency(totalRevenue)}
          trend={stats?.overview?.caGrowthPercent || "+28%"}
          trendLabel="vs période préc."
          icon={TrendingUp}
          color="brand"
        />
      </div>

      {/* Revenue Evolution Chart */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">Évolution du Chiffre d'Affaires Net (6 derniers mois)</h3>
            <p className="text-xs text-slate-500">Montant net perçu via MoversGo avec transparence des commissions</p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full self-start sm:self-auto">
            Croissance : {stats?.overview?.caGrowthPercent || "+28%"}
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="ca"
                name="Chiffre d'affaires (DT)"
                stroke="#e11d48"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#caGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* UPCOMING TOURS & INTERVENTIONS WIDGET */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-subtle space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-[#800020] flex items-center justify-center border border-rose-100 flex-shrink-0">
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Planning des Tournées & Interventions à Venir
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-[#800020] border border-rose-200">
                  {bookings.length} planifiée(s)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Prochaines missions programmées • Déclenchez des rappels clients en un clic
              </p>
            </div>
          </div>

          <Link
            to="/company/calendar"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs self-start sm:self-auto"
          >
            <CalendarDays className="w-3.5 h-3.5 text-rose-300" />
            <span>Ouvrir le calendrier complet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs space-y-2">
            <CalendarCheck2 className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold text-slate-600">Aucune intervention programmée pour le moment.</p>
            <p className="text-[11px] text-slate-500">
              Dès qu'un client valide son devis, la mission s'inscrira automatiquement dans vos tournées.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.slice(0, 3).map((b) => {
              const bId = b._id || b.id;
              const dateVal = b.scheduledDate || b.movingDate || b.movingRequest?.preferredDate;
              const countdown = getCountdownBadge(dateVal);
              const isSending = sendingReminderId === bId;
              const clientName = `${b.client?.firstName || ""} ${b.client?.lastName || ""}`.trim() || "Client";
              const depCity = b.movingRequest?.departureAddress?.city || "Départ";
              const arrCity = b.movingRequest?.arrivalAddress?.city || "Arrivée";

              return (
                <div
                  key={bId}
                  className="p-4 rounded-2xl border border-slate-200/90 hover:border-[#800020]/40 transition-all bg-white flex flex-col justify-between gap-3 shadow-xs group"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                        <Clock className="w-3.5 h-3.5 text-[#800020]" />
                        <span>{formatDate(dateVal)} • {b.scheduledTime || "08:00"}</span>
                      </div>
                      {countdown && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${countdown.color}`}>
                          {countdown.text}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#800020] transition-colors">
                        {depCity} ➔ {arrCity}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 font-medium">
                          <User className="w-3 h-3 text-slate-400" />
                          {clientName}
                        </span>
                        <span>•</span>
                        <span>{b.movingRequest?.volumeEstimate || 20} m³</span>
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <StatusBadge status={b.serviceStatus || "preparation"} />
                      {b.remindersCount > 0 ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Rappel envoyé ({b.remindersCount}x)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Rappel non envoyé</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={(e) => handleQuickReminder(b, e)}
                      disabled={isSending}
                      className="flex-1 py-1.5 px-3 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
                      title="Envoyer un rappel email + notification in-app"
                    >
                      {isSending ? (
                        <span>Envoi...</span>
                      ) : (
                        <>
                          <BellRing className="w-3 h-3 text-amber-600" />
                          <span>Rappel client</span>
                        </>
                      )}
                    </button>

                    <Link
                      to={`/company/bookings/${bId}`}
                      className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Détails</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RECOMMENDED OPPORTUNITIES SECTION */}
      <div className="bg-white rounded-3xl p-6 border border-rose-100 shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#800020] animate-pulse" />
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Déménagements recommandés pour votre entreprise
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Annonces triées par compatibilité géographique, services et capacités de votre flotte.
            </p>
          </div>
          <Link
            to="/company/recommendations"
            className="text-xs font-bold text-[#800020] hover:text-[#660019] flex items-center gap-1 self-start sm:self-auto bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors"
          >
            <span>Explorer toutes les opportunités</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recommendedRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Aucune recommandation prioritaire disponible actuellement.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedRequests.slice(0, 4).map((r) => {
              const score = r.score ?? r.recommendation?.score ?? 80;
              const dist = r.distanceKm ?? r.recommendation?.distanceKm;
              const isExcellent = score >= 85;

              return (
                <div
                  key={r._id || r.id}
                  className="p-4 rounded-2xl border border-slate-200/90 hover:border-rose-200 hover:shadow-xs transition-all bg-white flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${isExcellent
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-blue-50 text-blue-800 border-blue-200"
                          }`}
                      >
                        {score}% compatible • {isExcellent ? "Excellent" : "Bon"}
                      </span>

                      {dist !== null && dist !== undefined && (
                        <span className="text-[11px] font-mono font-bold text-[#800020] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{dist} km</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-[#800020] transition-colors line-clamp-1">
                      {r.customTitle || r.title || `Déménagement ${r.departureAddress?.city} → ${r.arrivalAddress?.city}`}
                    </h4>

                    <div className="text-xs text-slate-500 space-y-1">
                      <p className="flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#800020] flex-shrink-0" />
                        <span>{r.departureAddress?.city || r.departure?.city} ➔ {r.arrivalAddress?.city || r.arrival?.city}</span>
                      </p>
                      <p className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{formatDate(r.preferredDate || r.desiredDate)}</span>
                        <span>•</span>
                        <span>{r.estimatedVolume || r.inventory?.estimatedVolume || 0} m³</span>
                        {r.estimatedBudget && (
                          <>
                            <span>•</span>
                            <span className="text-slate-600 font-semibold">{r.estimatedBudget}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Link
                      to={`/company/requests/${r._id || r.id}`}
                      className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 text-center"
                    >
                      Détails
                    </Link>
                    <Link
                      to={`/company/quotes/new/${r._id || r.id}`}
                      className="flex-1 py-1.5 px-3 rounded-lg bg-[#800020] hover:bg-[#660019] text-white text-xs font-bold text-center transition-colors shadow-xs"
                    >
                      Proposer devis
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available Requests Grid */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Dernières demandes publiées par des particuliers</h3>
            <p className="text-xs text-slate-500">Examinez les accès et proposez un devis compétitif</p>
          </div>
          <Link
            to="/company/requests"
            className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <span>Voir toutes ({requests.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {requests.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Aucune demande disponible pour le moment.
            </div>
          ) : (
            requests.slice(0, 3).map((r) => (
              <div key={r._id || r.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{r.title}</h4>
                    <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full">
                      {r.inventory?.estimatedVolume || r.estimatedVolume || 0} m³
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-brand-600" />
                      {r.departure?.city || r.departureAddress?.city} ➔ {r.arrival?.city || r.arrivalAddress?.city}
                    </span>
                    <span>•</span>
                    <span>Prévu le {formatDate(r.desiredDate || r.preferredDate)}</span>
                    <span>•</span>
                    <span>Budget indicatif : ~{formatCurrency(r.budgetEstimate || r.estimatedBudget || 800)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-shrink-0 self-end md:self-center">
                  <Link
                    to={`/company/requests/${r._id || r.id}`}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Détails
                  </Link>
                  <Link
                    to={`/company/quotes/new/${r._id || r.id}`}
                    className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold hover:bg-brand-700 transition-colors shadow-brand"
                  >
                    Émettre un devis
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

