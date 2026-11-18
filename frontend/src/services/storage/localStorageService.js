/**
 * LocalStorage Service - Contexte MoversGo Tunisie
 */

const STORAGE_KEYS = {
  CURRENT_USER: "moveflow_tn_user",
  REQUESTS: "moveflow_tn_requests",
  QUOTES: "moveflow_tn_quotes",
  BOOKINGS: "moveflow_tn_bookings",
  COMPANIES: "moveflow_tn_companies",
  USERS: "moveflow_tn_all_users",
  NOTIFICATIONS: "moveflow_tn_notifications",
  REVIEWS: "moveflow_tn_reviews",
  TRANSACTIONS: "moveflow_tn_transactions",
};

export const localStorageService = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Error reading localStorage key "${key}":`, e);
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Error writing to localStorage key "${key}":`, e);
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Error removing localStorage key "${key}":`, e);
    }
  },

  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn("Error clearing MoversGo storage:", e);
    }
  },

  KEYS: STORAGE_KEYS,
};
