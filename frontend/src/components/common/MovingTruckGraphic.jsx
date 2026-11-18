import React, { useState } from "react";
import { motion } from "framer-motion";
import { Truck, ShieldCheck, Box } from "lucide-react";

/* -------------------------------------------------------------------------
   MovingTruckGraphic — Real photo of a red moving truck in a custom
   multi-point polygon shape (diagonal-motion burst) on a light background.
   -------------------------------------------------------------------------*/
export function MovingTruckGraphic() {
  const [imgError, setImgError] = useState(false);

  /* Fallback chain: three Unsplash URLs for a red/white moving truck */
  const [imgSrc, setImgSrc] = useState(
    "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=900&auto=format&fit=crop&q=80"
  );
  const fallbacks = [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=900&auto=format&fit=crop&q=80",
  ];
  const [fallbackIndex, setFallbackIndex] = useState(0);

  const handleError = () => {
    if (fallbackIndex < fallbacks.length) {
      setImgSrc(fallbacks[fallbackIndex]);
      setFallbackIndex((i) => i + 1);
    } else {
      setImgError(true);
    }
  };

  return (
    <div className="relative w-full max-w-[520px] mx-auto select-none">

      {/* ── Soft ambient glow behind the shape ── */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-30px] right-[-40px] w-72 h-72 rounded-full bg-brand-100/70 blur-3xl" />
        <div className="absolute bottom-[-20px] left-[-20px] w-56 h-56 rounded-full bg-rose-100/60 blur-3xl" />
      </div>

      {/* ── Photo in exceptional clip-path shape ──
            Shape: "speed-burst" — a dynamic 8-point polygon that looks like
            the image is flying out of the frame, wider in the centre and
            clipped diagonally at both ends.                                  */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative"
        style={{
          /* Custom speed-burst polygon:
             Top-left corner pulled inward; bottom-right corner open wide.
             Creates a dramatic parallelogram-like "motion cut" shape.       */
          clipPath:
            "polygon(6% 0%, 100% 0%, 100% 78%, 94% 100%, 0% 100%, 0% 22%)",
          borderRadius: "0px",          /* let clip-path do the shaping */
        }}
      >
        {imgError ? (
          /* ── SVG fallback if all image URLs fail ── */
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-brand-50 to-rose-50 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Truck className="w-20 h-20 mx-auto mb-3 text-brand-300" />
              <p className="text-sm font-medium">Image non disponible</p>
            </div>
          </div>
        ) : (
          <img
            src={imgSrc}
            onError={handleError}
            alt="Camion de déménagement MoversGo Tunisie"
            className="w-full object-cover aspect-[4/3] block"
            style={{ display: "block" }}
          />
        )}

        {/* ── Subtle brand colour overlay at bottom edge ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, rgba(225,29,72,0.18) 0%, transparent 50%)",
          }}
        />

        {/* ── MoversGo badge pinned to the photo ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-white/60"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold text-slate-700 tracking-wide">
            Service Actif • Tunisie 🇹🇳
          </span>
        </motion.div>

        {/* ── "FLOTTE CAPITONNÉE" tag (top right) ── */}
        <div className="absolute top-4 right-4 bg-brand-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full shadow-lg">
          FLOTTE CAPITONNÉE
        </div>
      </motion.div>

      {/* ── Decorative thin border accent line (echoes the polygon angle) ── */}
      <div
        className="absolute -bottom-2 -left-2 -right-2 h-1 bg-gradient-to-r from-brand-500 via-rose-400 to-amber-400 rounded-full opacity-60 pointer-events-none"
        style={{ clipPath: "polygon(6% 0%, 100% 0%, 94% 100%, 0% 100%)" }}
      />

      {/* ── Trust pill badges ── */}
      <div className="grid grid-cols-3 gap-2.5 mt-5">
        {[
          {
            icon: Truck,
            label: "Camion 30m³",
            sub: "Capitonné & Hayon",
            color: "text-brand-600 bg-brand-50 border-brand-100",
          },
          {
            icon: Box,
            label: "Monte-Charge",
            sub: "Jusqu'au 10e étage",
            color: "text-sky-600 bg-sky-50 border-sky-100",
          },
          {
            icon: ShieldCheck,
            label: "Assuré 100%",
            sub: "STAR / COMAR",
            color: "text-emerald-600 bg-emerald-50 border-emerald-100",
          },
        ].map(({ icon: Icon, label, sub, color }) => (
          <motion.div
            key={label}
            whileHover={{ y: -3, scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="flex flex-col items-center text-center p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle hover:shadow-card transition-all"
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center mb-1.5 border ${color}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold text-slate-800 leading-tight">
              {label}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Live region ticker ── */}
      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Actif dans :{" "}
            <strong className="text-slate-700">
              Grand Tunis, Sousse, Sfax, Cap Bon
            </strong>
          </span>
        </span>
        <span className="font-mono font-bold text-brand-500">
          24 GOV.
        </span>
      </div>
    </div>
  );
}
