import React, { useState, useEffect } from "react";
import { companyService } from "../../services/api/companyService";
import { useNotifications } from "../../contexts/NotificationContext";
import { StatCard } from "../../components/common/StatCard";
import { formatCurrency } from "../../utils/cn";
import { toast } from "sonner";
import {
  TrendingUp,
  Truck,
  Percent,
  Award,
  RefreshCw,
  ShieldCheck,
  Building2,
  Home,
  Briefcase,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Receipt,
  Coins
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { Link } from "react-router-dom";

export function CompanyStatisticsPage() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { onBookingUpdate, onQuoteUpdate, onRequestUpdate } = useNotifications();

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await companyService.getCompanyStatistics();
      const payload = res?.overview ? res : (res?.data?.overview ? res.data : (res?.data || res));
      if (payload && (payload.overview || payload.monthlyTimeline)) {
        setStatsData(payload);
      }
      if (isManual) {
        toast.success("Statistiques actualisées avec succès");
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des statistiques:", err);
      if (isManual) {
        toast.error("Impossible de rafraîchir les statistiques");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const unregBooking = onBookingUpdate?.("*", () => {
      fetchStats();
    });
    const unregQuote = onQuoteUpdate?.(() => {
      fetchStats();
    });
    const unregRequest = onRequestUpdate?.(() => {
      fetchStats();
    });
    return () => {
      if (typeof unregBooking === "function") unregBooking();
      if (typeof unregQuote === "function") unregQuote();
      if (typeof unregRequest === "function") unregRequest();
    };
  }, [onBookingUpdate, onQuoteUpdate, onRequestUpdate]);

  const overview = statsData?.overview || {
    caTotal: 0,
    caNet: 0,
    depositReceived: 0,
    platformCommissions: 0,
    remainingToCollect: 0,
    caGrowthPercent: "+28% vs n-1",
    volumeTotal: 0,
    completedMoves: 0,
    activeMoves: 0,
    totalBookings: 0,
    averageBasket: 0,
    averageVolume: 0,
    conversionRate: 0,
    totalQuotes: 0,
    acceptedQuotes: 0,
    rejectedQuotes: 0,
    pendingQuotes: 0,
    benchmark: "En phase de démarrage",
  };

  const monthlyTimeline = statsData?.monthlyTimeline || [];
  const housingDistribution = statsData?.housingDistribution || [];
  const serviceStatuses = statsData?.serviceStatusBreakdown || {
    preparation: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  const hasData = overview.totalBookings > 0 || overview.totalQuotes > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Statistiques & Analyse de Performance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Indicateurs clés d'activité, rentabilité financière et volumes transportés sur MoversGo
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing || loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-subtle flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-brand-600" : "text-slate-400"}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl border border-slate-200/80"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: CA Total */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">CA Total Annuel</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    {formatCurrency(overview.caTotal)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-600">{overview.caGrowthPercent}</span>
                <span className="text-slate-500 text-[11px]">Net: {formatCurrency(overview.caNet)}</span>
              </div>
            </div>

            {/* Card 2: Volume Transporté */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Volume Transporté</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    {overview.volumeTotal} m³
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">
                  {overview.completedMoves + overview.activeMoves} déménagement{overview.completedMoves + overview.activeMoves > 1 ? "s" : ""}
                </span>
                <span className="text-slate-400 text-[11px]">~{overview.averageVolume} m³/course</span>
              </div>
            </div>

            {/* Card 3: Panier Moyen */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Panier Moyen</p>
                  <p className="text-2xl font-extrabold text-slate-900 mt-1">
                    {formatCurrency(overview.averageBasket)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Par prestation</span>
                <span className="text-slate-400 text-[11px]">{overview.totalBookings} réservations</span>
              </div>
            </div>

            {/* Card 4: Conversion Devis */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-card transition-all flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Conversion Devis</p>
                  <p className="text-2xl font-extrabold text-brand-600 mt-1">
                    {overview.conversionRate}%
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-600 text-[11px]">{overview.benchmark}</span>
                <span className="text-slate-400 text-[11px]">
                  {overview.acceptedQuotes}/{overview.totalQuotes} devis
                </span>
              </div>
            </div>
          </div>

          {/* Bordereau Transparence Financière & Commissions */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#800020] text-white flex items-center justify-center shadow-md">
                  <ShieldCheck className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                    Transparence Financière & Décompte MoversGo
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Règles 100% Claires
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    La commission MoversGo (2% par tranche de 10% d'acompte) s'applique uniquement sur l'acompte encaissé.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Net Garanti</span>
                <span className="text-xl font-black text-emerald-400">{formatCurrency(overview.caNet)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Facturé TTC</p>
                <p className="text-lg font-bold text-white mt-1">{formatCurrency(overview.caTotal)}</p>
                <span className="text-[10px] text-slate-500">Montant total des devis validés</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Acomptes Reçus</p>
                <p className="text-lg font-bold text-sky-400 mt-1">{formatCurrency(overview.depositReceived)}</p>
                <span className="text-[10px] text-slate-500">Sécurisés en ligne par carte</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Commission MoversGo</p>
                <p className="text-lg font-bold text-amber-400 mt-1">{formatCurrency(overview.platformCommissions)}</p>
                <span className="text-[10px] text-slate-500">Prélevée sur l'acompte reçu</span>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-[11px] font-semibold text-slate-400 uppercase">Solde Main Propre</p>
                <p className="text-lg font-bold text-emerald-400 mt-1">{formatCurrency(overview.remainingToCollect)}</p>
                <span className="text-[10px] text-slate-500">Payé à 100% à la livraison</span>
              </div>
            </div>
          </div>

          {/* Dynamic Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: CA Mensuel */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Chiffre d'Affaires Mensuel (DT)</h3>
                  <p className="text-xs text-slate-500">Comparaison CA TTC facturé vs Net encaissé par l'entreprise</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-brand-600 inline-block"></span>
                    <span className="text-slate-600 font-medium">CA TTC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
                    <span className="text-slate-600 font-medium">Net</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val, name) => [
                        `${Number(val).toLocaleString()} DT`,
                        name === "ca" ? "CA Facturé TTC" : "CA Net Entreprise",
                      ]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item?.monthFull || label;
                      }}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#1e293b",
                        borderRadius: "12px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="ca" name="ca" fill="#800020" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="caNet" name="caNet" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Volume Mensuel & Déménagements */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Volume Transporté Mensuel (m³)</h3>
                  <p className="text-xs text-slate-500">Cubage cumulé transporté et volume de courses effectuées</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span>
                    <span className="text-slate-600 font-medium">m³ transportés</span>
                  </div>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip
                      formatter={(val) => [`${val} m³`, "Volume total"]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item?.monthFull || label;
                      }}
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
                      dataKey="volume"
                      name="Volume (m³)"
                      stroke="#0ea5e9"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#volumeGrad)"
                      dot={{ r: 4, fill: "#0ea5e9" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Breakdown Cards: Housing & Operational Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Housing Type Distribution */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Répartition par Type de Logement</h3>
                  <p className="text-xs text-slate-500">Typologie des biens déménagés pris en charge</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <Layers className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                {housingDistribution.map((h, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span className="flex items-center gap-2">
                        {h.label.includes("Villa") ? (
                          <Home className="w-3.5 h-3.5 text-brand-600" />
                        ) : h.label.includes("Bureau") ? (
                          <Briefcase className="w-3.5 h-3.5 text-sky-600" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-purple-600" />
                        )}
                        {h.label}
                      </span>
                      <span className="text-slate-500">
                        {h.count} course{h.count > 1 ? "s" : ""} ({h.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(h.percentage, h.count > 0 ? 5 : 0)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Status Breakdown */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">État Opérationnel des Prestations</h3>
                  <p className="text-xs text-slate-500">Suivi en direct du déroulement des déménagements</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">En préparation</span>
                  </div>
                  <p className="text-2xl font-extrabold text-amber-900 mt-2">{serviceStatuses.preparation}</p>
                  <p className="text-[11px] text-amber-700/80 mt-0.5">Dossiers et plannings réservés</p>
                </div>

                <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/60">
                  <div className="flex items-center gap-2 text-sky-700">
                    <Truck className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">En cours de route</span>
                  </div>
                  <p className="text-2xl font-extrabold text-sky-900 mt-2">{serviceStatuses.in_progress}</p>
                  <p className="text-[11px] text-sky-700/80 mt-0.5">Camions en transit / chargement</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60">
                  <div className="flex items-center gap-2 text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Terminés</span>
                  </div>
                  <p className="text-2xl font-extrabold text-emerald-900 mt-2">{serviceStatuses.completed}</p>
                  <p className="text-[11px] text-emerald-700/80 mt-0.5">Livrés et clôturés avec succès</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Coins className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Total Réservations</span>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mt-2">{overview.totalBookings}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Contrats signés via la plateforme</p>
                </div>
              </div>
            </div>
          </div>

          {/* Motivational Help / Quick Actions */}
          {!hasData && (
            <div className="p-6 rounded-3xl bg-brand-50/50 border border-brand-200/60 text-brand-950 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold">Commencez à générer vos statistiques</h4>
                <p className="text-xs text-brand-800 mt-1">
                  Répondez aux demandes disponibles sur vos trajets et soumettez vos devis pour alimenter vos indicateurs d'activité en temps réel.
                </p>
              </div>
              <Link
                to="/company/requests"
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <span>Consulter les demandes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
