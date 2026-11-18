import React from "react";
import { MapPin, ExternalLink, Navigation } from "lucide-react";

export function LocationBadge({
  city,
  governorate,
  street,
  latitude,
  longitude,
  label = "Localisation GPS",
  showMapLink = true,
  className = "",
  size = "md", // "sm" | "md"
}) {
  const hasCoords = typeof latitude === "number" && typeof longitude === "number" && !isNaN(latitude) && !isNaN(longitude);
  const formattedAddress = [street, city, governorate].filter(Boolean).join(", ");
  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formattedAddress + ", Tunisie")}`;

  if (size === "sm") {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-medium ${className}`}>
        <MapPin className="w-3 h-3 text-emerald-600 flex-shrink-0" />
        <span className="truncate max-w-[180px]">
          {city || governorate || "Position définie"}{" "}
          {hasCoords && `(${latitude.toFixed(2)}, ${longitude.toFixed(2)})`}
        </span>
        {showMapLink && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Ouvrir dans Google Maps"
            className="text-emerald-700 hover:text-emerald-900 ml-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <Navigation className="w-3.5 h-3.5 text-brand-600" />
          <span>{label}</span>
        </div>
        {showMapLink && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline"
          >
            <span>Voir sur carte</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <div className="text-slate-600 space-y-0.5">
        {formattedAddress && (
          <p className="font-semibold text-slate-800 truncate">{formattedAddress}</p>
        )}
        {hasCoords ? (
          <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>GPS : {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E</span>
          </p>
        ) : (
          <p className="text-[11px] text-slate-400">Coordonnées GPS estimées selon le gouvernorat</p>
        )}
      </div>
    </div>
  );
}

