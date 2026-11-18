import React from "react";
import { cn } from "../../utils/cn";
import { TrendingUp, TrendingDown } from "lucide-react";

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel = "vs mois précédent",
  color = "brand",
  className = "",
}) {
  const colorSchemes = {
    brand: "bg-brand-50 text-brand-600 border-brand-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-sky-50 text-sky-600 border-sky-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
  };

  const isPositive = trend && !trend.startsWith("-");

  return (
    <div
      className={cn(
        "bg-white rounded-card p-5 border border-slate-200/80 shadow-subtle hover:shadow-card transition-all duration-200",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
            {value}
          </h3>
        </div>
        {Icon && (
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center border",
              colorSchemes[color] || colorSchemes.brand
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {trend ? (
            <div className="flex items-center gap-1.5 font-medium">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold",
                  isPositive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                )}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {trend}
              </span>
              <span className="text-slate-400">{trendLabel}</span>
            </div>
          ) : (
            <span className="text-slate-500">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}

