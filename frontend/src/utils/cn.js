import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS class names cleanly
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Tunisian Dinars (DT)
 */
export function formatCurrency(amount) {
  if (amount === undefined || amount === null) return "0 DT";
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  const formatted = new Intl.NumberFormat("fr-TN", {
    maximumFractionDigits: 0,
  }).format(num);
  return `${formatted} DT`;
}

/**
 * Format date in French/Tunisian context
 */
export function formatDate(dateString, options = {}) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("fr-TN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  }).format(date);
}

const BACKEND_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1").replace(/\/api\/v1\/?$/, "");

/**
 * Format image / logo URL served from backend static uploads
 * Safely handles Windows path separators (\), nullish string values, and missing base URLs.
 */
export function getLogoUrl(logo) {
  if (!logo || typeof logo !== "string") return null;
  const trimmed = logo.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;

  // Replace Windows backslashes with forward slashes
  const clean = trimmed.replace(/\\/g, "/").replace(/^\/+/, "");

  if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("data:")) {
    return clean;
  }
  return `${BACKEND_URL}/${clean}`;
}

