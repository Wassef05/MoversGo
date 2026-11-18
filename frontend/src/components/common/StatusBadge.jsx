import React from "react";
import { APP_CONFIG } from "../../config/appConfig";
import { cn } from "../../utils/cn";

export function StatusBadge({ status, className = "" }) {
  const config = APP_CONFIG.statusConfigs[status] || {
    label: status,
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </span>
  );
}

