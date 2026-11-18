import { apiClient } from "./apiClient";

export const adminService = {
  async getDashboardStats() {
    const res = await apiClient.get("/admin/dashboard");
    return res.data;
  },

  async getAllUsers(params = {}) {
    const res = await apiClient.get("/admin/users", { params });
    return res.data;
  },

  async getUserById(id) {
    const res = await apiClient.get("/admin/users/" + id);
    return res.data;
  },

  async updateUserStatus(id, isActive) {
    const res = await apiClient.patch(`/admin/users/${id}/status`, { isActive });
    return res.data;
  },

  async deleteUser(id, permanent = false) {
    const res = await apiClient.delete(`/admin/users/${id}${permanent ? '?permanent=true' : ''}`);
    return res.data;
  },

  async getAllCompanies(params = {}) {
    const res = await apiClient.get("/admin/companies", { params });
    return res.data;
  },

  async getPendingCompanies() {
    const res = await apiClient.get("/admin/companies/pending");
    return res.data;
  },

  async approveCompany(id) {
    const res = await apiClient.patch(`/admin/companies/${id}/approve`);
    return res.data;
  },

  async rejectCompany(id, rejectionReason, isRectification = false) {
    const res = await apiClient.patch(`/admin/companies/${id}/reject`, { rejectionReason, rectificationNotes: rejectionReason, isRectification });
    return res.data;
  },

  async requestCompanyRectification(id, notes) {
    const res = await apiClient.patch(`/admin/companies/${id}/rectify`, { notes, rectificationNotes: notes });
    return res.data;
  },

  async suspendCompany(id) {
    const res = await apiClient.patch(`/admin/companies/${id}/suspend`);
    return res.data;
  },

  async getAllRequests(params = {}) {
    const res = await apiClient.get("/admin/requests", { params });
    return res.data;
  },

  async getAllQuotes(params = {}) {
    const res = await apiClient.get("/admin/quotes", { params });
    return res.data;
  },

  async getAllBookings(params = {}) {
    const res = await apiClient.get("/admin/bookings", { params });
    return res.data;
  },

  async getAllReviews(params = {}) {
    const res = await apiClient.get("/admin/reviews", { params });
    return res.data;
  },

  async moderateReview(id, status, rejectionReason = "") {
    const res = await apiClient.patch(`/admin/reviews/${id}/moderate`, { status, rejectionReason });
    return res.data;
  },

  async getTransactions(params = {}) {
    const res = await apiClient.get("/admin/transactions", { params });
    return res.data;
  },

  async getAllTickets(params = {}) {
    // apiClient interceptor already unwraps response.data → returns {success, data, pagination}
    return await apiClient.get("/admin/support", { params });
  },

  async getTicketById(id) {
    return await apiClient.get(`/admin/support/${id}`);
  },

  async updateTicketStatus(id, status, assignedAdmin = null) {
    return await apiClient.patch(`/admin/support/${id}/status`, { status, assignedAdmin });
  },

  async getAllContactMessages(params = {}) {
    return await apiClient.get("/admin/contact", { params });
  },

  async replyToContactMessage(id, replyMessage, adminNotes = "") {
    return await apiClient.post(`/admin/contact/${id}/reply`, { replyMessage, adminNotes });
  },

  async updateContactMessageStatus(id, status, adminNotes = "") {
    return await apiClient.patch(`/admin/contact/${id}`, { status, adminNotes });
  },

  async deleteContactMessage(id) {
    return await apiClient.delete(`/admin/contact/${id}`);
  },

  async deleteReview(id) {
    const res = await apiClient.delete(`/admin/reviews/${id}`);
    return res.data;
  },
};


