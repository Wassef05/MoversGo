import React from "react";
import { motion } from "framer-motion";
import { formatCurrency } from "../../utils/cn";
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
  AreaChart,
  Area
} from "recharts";
import { TrendingUp, ArrowUpRight, BarChart3, Map, DollarSign, Calendar } from "lucide-react";

export function AdminAnalyticsPage() {
  const analyticsData = [
    { month: "Oct", dem: 138, dev: 395, tx: 118400, conv: 32 },
    { month: "Nov", dem: 152, dev: 440, tx: 142200, conv: 35 },
    { month: "Déc", dem: 146, dev: 425, tx: 131800, conv: 33 },
    { month: "Jan", dem: 188, dev: 580, tx: 194500, conv: 38 },
    { month: "Fév", dem: 224, dev: 730, tx: 246800, conv: 41 },
    { month: "Mar", dem: 295, dev: 910, tx: 384200, conv: 44 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Rapports & Analytics Avancés
            </h1>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
              Marché Tunisie
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Métriques de conversion, croissance des déménagements et flux financiers en Dinars Tunisiens (DT)
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold bg-white p-1 rounded-xl border border-slate-200">
          <span className="px-3 py-1.5 rounded-lg bg-slate-900 text-white shadow-xs">Semestre 2026</span>
        </div>
      </div>

      {/* Top 3 High-level Analytics KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <p className="text-xs text-slate-400 font-semibold uppercase">Panier Moyen Déménagement</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">890 DT</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">+8.5% avec monte-charge extérieur</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <p className="text-xs text-slate-400 font-semibold uppercase">Taux de Transformation Devis</p>
          <p className="text-2xl font-extrabold text-brand-600 mt-1">44%</p>
          <span className="text-[11px] text-slate-500 mt-1 block">Demandes concrétisées en réservation</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-subtle">
          <p className="text-xs text-slate-400 font-semibold uppercase">Délai Moyen Réception 1ère Offre</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">38 min</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Sur Tunis, Sousse et Sfax</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Demandes vs Devis */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Demandes de Déménagement & Devis Déposés</h3>
              <p className="text-xs text-slate-500">Volume mensuel sur les 24 gouvernorats</p>
            </div>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">
              Ratio ~3.1 devis / demande
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="dem" name="Demandes publiées" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dev" name="Devis émis par les pros" fill="#e11d48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Brut Mensuel en DT */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Volume d'Affaires Brut Mensuel (DT)</h3>
              <p className="text-xs text-slate-500">Montant total des déménagements contractualisés</p>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              Dinar Tunisien
            </span>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${val / 1000}k DT`}
                />
                <Tooltip
                  formatter={(value) => [`${formatCurrency(value)}`, "Volume Brut"]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="tx"
                  name="Volume Brut (DT)"
                  stroke="#10b981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#txGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
