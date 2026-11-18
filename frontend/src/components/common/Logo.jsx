import React from "react";
import { Link } from "react-router-dom";

/* ─────────────────────────────────────────────────────────────
   MoversGo – Professional Logo
   Uses the MoversGo brand image assets from /public/
   isLight = true  → used on dark backgrounds (transparent logo)
   showTagline     → shows the sub-line under the logo
─────────────────────────────────────────────────────────────────*/
export function Logo({ className = "", isLight = false, showTagline = false }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 group flex-shrink-0 ${className}`}>
      <img
        src="/Logo MoversGo-transparent.png"
        alt="MoversGo"
        className="h-14 w-auto object-contain"
        style={{ maxWidth: "220px" }}
      />
    </Link>
  );
}
export function Logo2({ className = "", isLight = false, showTagline = false }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 group flex-shrink-0 ${className}`}>
      <img
        src="/Logo_white.png"
        alt="MoversGo"
        className="h-18 w-auto object-contain"
        style={{ maxWidth: "220px" }}
      />
    </Link>
  );
}