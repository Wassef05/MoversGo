/**
 * MoversGo - Full-Stack Data Service Adapter
 * Bridges existing React components directly to real MongoDB REST API endpoints.
 * Clean, production-ready, zero mock data.
 */

import { requestService } from "../api/requestService";
import { quoteService } from "../api/quoteService";
import { bookingService } from "../api/bookingService";
import { companyService } from "../api/companyService";
import { reviewService } from "../api/reviewService";
import { notificationService } from "../api/notificationService";
import { adminService } from "../api/adminService";
import { localStorageService } from "../storage/localStorageService";

// Clean up any legacy mock keys from browser localStorage
try {
  const legacyKeys = [
    "moveflow_tn_users",
    "moveflow_tn_companies",
    "moveflow_tn_requests",
    "moveflow_tn_quotes",
    "moveflow_tn_bookings",
    "moveflow_tn_transactions",
    "moveflow_tn_reviews",
    "moveflow_tn_notifications",
  ];
  legacyKeys.forEach((k) => localStorage.removeItem(k));
} catch { }

export const dataService = {
  // ===================== REQUESTS =====================
  async getRequests(params = {}) {
    try {
      const user = localStorageService.get(localStorageService.KEYS.CURRENT_USER);
      if (user?.role === "company") {
        const res = await requestService.getAvailableRequests(params);
        if (res?.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
      } else if (user?.role === "admin") {
        const res = await adminService.getAllRequests(params);
        if (res?.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
      } else {
        const res = await requestService.getMyRequests(params);
        if (res?.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
      }
    } catch (err) {
      console.warn("getRequests error:", err.message);
    }
    return [];
  },

  async getRequestById(id) {
    try {
      const res = await requestService.getRequestById(id);
      return res?.data?.movingRequest || res?.data?.request || res?.data || res || null;
    } catch (err) {
      console.warn("getRequestById error:", err.message);
      return null;
    }
  },

  async createRequest(requestData) {
    const res = await requestService.createRequest(requestData);
    return res?.data?.movingRequest || res?.data?.request || res?.data || res;
  },

  async updateRequest(id, updates) {
    const res = await requestService.updateRequest(id, updates);
    return res?.data?.movingRequest || res?.data?.request || res?.data || res;
  },

  // ===================== QUOTES =====================
  async getQuotes(params = {}) {
    try {
      const user = localStorageService.get(localStorageService.KEYS.CURRENT_USER);
      if (user?.role === "company") {
        const res = await quoteService.getMyQuotes(params);
        if (res?.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
      } else if (user?.role === "admin") {
        const res = await adminService.getAllQuotes(params);
        if (res?.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
      } else {
        const res = await quoteService.getClientQuotes(params);
        if (res?.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
      }
    } catch (err) {
      console.warn("getQuotes error:", err.message);
    }
    return [];
  },

  async getQuotesByRequestId(requestId) {
    try {
      const res = await quoteService.getClientQuotes({ movingRequest: requestId });
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.warn("getQuotesByRequestId error:", err.message);
    }
    return [];
  },

  async getQuoteById(id) {
    try {
      const res = await quoteService.getQuoteById(id);
      return res?.data?.quote || res?.data || res || null;
    } catch (err) {
      console.warn("getQuoteById error:", err.message);
      return null;
    }
  },

  async createQuote(quoteData) {
    const res = await quoteService.createQuote(quoteData);
    return res?.data?.quote || res?.data || res;
  },

  async acceptQuote(quoteId, currentUser) {
    const res = await quoteService.acceptQuote(quoteId);
    return res?.data || res;
  },

  // ===================== COMPANIES =====================
  async getCompanies(params = {}) {
    try {
      const res = await companyService.getPublicCompanies(params);
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.warn("getCompanies error:", err.message);
    }
    return [];
  },

  async getCompanyById(id) {
    try {
      const res = await companyService.getPublicCompanyById(id);
      return res?.data?.company || res?.data || res || null;
    } catch (err) {
      console.warn("getCompanyById error:", err.message);
      return null;
    }
  },

  async updateCompanyStatus(companyId, status, notes = "") {
    if (status === "approved" || status === "verified") {
      return adminService.approveCompany(companyId);
    } else if (status === "needs_rectification") {
      return adminService.requestCompanyRectification(companyId, notes);
    } else {
      return adminService.rejectCompany(companyId, notes || "Dossier non conforme");
    }
  },

  // ===================== USERS =====================
  async getUsers(params = {}) {
    try {
      const res = await adminService.getAllUsers(params);
      if (res?.data?.users && Array.isArray(res.data.users)) return res.data.users;
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.warn("getUsers error:", err.message);
    }
    return [];
  },

  async updateUserStatus(userId, status) {
    return adminService.updateUserStatus(userId, status === "active" || status === true);
  },

  // ===================== BOOKINGS =====================
  async getBookings(params = {}) {
    try {
      const res = await bookingService.getMyBookings(params);
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.warn("getBookings error:", err.message);
    }
    return [];
  },

  async getBookingById(id) {
    try {
      const res = await bookingService.getBookingById(id);
      return res?.data?.booking || res?.data || res || null;
    } catch (err) {
      console.warn("getBookingById error:", err.message);
      return null;
    }
  },

  // ===================== TRANSACTIONS =====================
  async getTransactions(params = {}) {
    try {
      const res = await adminService.getTransactions(params);
      if (res?.data?.transactions && Array.isArray(res.data.transactions)) return res.data.transactions;
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.warn("getTransactions error:", err.message);
    }
    return [];
  },

  // ===================== REVIEWS =====================
  async getReviews(params = {}) {
    try {
      const user = localStorageService.get(localStorageService.KEYS.CURRENT_USER);
      if (user?.role === "admin") {
        const res = await adminService.getAllReviews(params);
        if (res?.data && Array.isArray(res.data)) return res.data;
        if (Array.isArray(res)) return res;
      } else {
        const res = await reviewService.getPublicReviews(params);
        if (Array.isArray(res)) return res;
        if (res?.data && Array.isArray(res.data)) return res.data;
      }
    } catch (err) {
      // Silently fall back to empty array for non-admin context
      return [];
    }
    return [];
  },

  async createReview(reviewData) {
    const res = await reviewService.createReview(reviewData);
    return res?.data?.review || res?.data || res;
  },

  async moderateReview(reviewId, status) {
    return adminService.moderateReview(reviewId, status);
  },

  // ===================== NOTIFICATIONS =====================
  async getNotifications(params = {}) {
    try {
      const res = await notificationService.getNotifications(params);
      if (res?.data && Array.isArray(res.data)) return res.data;
      if (Array.isArray(res)) return res;
    } catch (err) {
      console.warn("getNotifications error:", err.message);
    }
    return [];
  },

  async markNotificationAsRead(id) {
    return notificationService.markAsRead(id);
  },

  // ===================== ADMIN STATS =====================
  async getAdminStats() {
    try {
      const res = await adminService.getDashboardStats();
      if (res?.data?.stats) return res.data.stats;
      if (res?.data) return res.data;
    } catch (err) {
      console.warn("getAdminStats error:", err.message);
    }
    return null;
  },
};
