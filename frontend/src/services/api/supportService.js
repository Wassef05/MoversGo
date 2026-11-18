import { apiClient } from "./apiClient";

// NOTE: apiClient interceptor already returns response.data
// res from apiClient = {success, data, message, pagination}

export const supportService = {
  async createTicket(ticketData) {
    return await apiClient.post("/support", ticketData);
  },

  async getMyTickets(params = {}) {
    return await apiClient.get("/support/my", { params });
  },

  async getTicketById(id) {
    return await apiClient.get(`/support/${id}`);
  },

  async addMessage(id, content) {
    // Returns {success, data: {ticket: {...}}, message}
    return await apiClient.post(`/support/${id}/messages`, { content });
  },
};
