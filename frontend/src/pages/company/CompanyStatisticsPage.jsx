import React from "react";
import { formatCurrency } from "../../utils/cn";
import { TrendingUp, Truck, Percent, Award } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line
} from "recharts";

export function CompanyStatisticsPage() {
  const monthlyData = [
    { month: "Oct", ca: 7200, devisAcceptes: 5, volume: 140 },
    { month: "Nov", ca: 8400, devisAcceptes: 6, volume: 165 },
    { month: "Déc", ca: 11200, devisAcceptes: 8, volume: 220 },
    { month: "Jan", ca: 9800, devisAcceptes: 7, volume: 180 },
    { month: "Fév", ca: 14600, devisAcceptes: 11, volume: 295 },
    { month: "Mar", ca: 18200, devisAcceptes: 14, volume: 380 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Statistiques & Analyse de Performance</h1>
        <p className="text-xs text-slate-500">Indicateurs clés d'activité et volumes transportés sur la marketplace</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <p className="text-xs text-slate-500 font-semibold uppercase">CA Total Annuel</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">69 400 DT</p>
          <span className="text-[11px] font-bold text-emerald-600 mt-1 block">+28% vs année n-1</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <p className="text-xs text-slate-500 font-semibold uppercase">Volume Transporté</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">1 380 m³</p>
          <span className="text-[11px] text-slate-400 mt-1 block">51 déménagements</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <p className="text-xs text-slate-500 font-semibold uppercase">Panier Moyen</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">890 DT</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Par prestation</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <p className="text-xs text-slate-500 font-semibold uppercase">Conversion Devis</p>
          <p className="text-2xl font-extrabold text-brand-600 mt-1">42%</p>
          <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">Top 5% transporteurs</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CA Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-slate-900">Chiffre d'Affaires Mensuel (DT)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                <Bar dataKey="ca" name="CA Net (DT)" fill="#e11d48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume Chart */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-subtle space-y-4">
          <h3 className="text-base font-bold text-slate-900">Volume Transporté Mensuel (m³)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                <Line
                  type="monotone"
                  dataKey="volume"
                  name="Volume (m³)"
                  stroke="#0ea5e9"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

