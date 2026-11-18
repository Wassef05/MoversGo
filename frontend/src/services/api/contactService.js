import { apiClient } from "./apiClient";

// NOTE: apiClient interceptor already returns response.data
// So `res` from apiClient calls is already the parsed body: {success, data, pagination, message}

export const contactService = {
  /**
   * Submit public contact form
   * Returns the full response body
   */
  async submitContactMessage(data) {
    return await apiClient.post("/contact", data);
  },

  /**
   * Admin: fetch all contact requests with filters
   * Returns {success, data: [...], pagination, message}
   */
  async getAllContactMessages(params = {}) {
    return await apiClient.get("/admin/contact", { params });
  },

  /**
   * Admin: get single contact message detail
   */
  async getContactMessageById(id) {
    return await apiClient.get(`/admin/contact/${id}`);
  },

  /**
   * Admin: update message status / notes
   */
  async updateContactMessageStatus(id, status, adminNotes = "") {
    return await apiClient.patch(`/admin/contact/${id}`, { status, adminNotes });
  },

  /**
   * Admin: send email reply to contact message
   */
  async replyToContactMessage(id, replyMessage, adminNotes = "") {
    return await apiClient.post(`/admin/contact/${id}/reply`, { replyMessage, adminNotes });
  },

  /**
   * Admin: delete contact message
   */
  async deleteContactMessage(id) {
    return await apiClient.delete(`/admin/contact/${id}`);
  },
};
