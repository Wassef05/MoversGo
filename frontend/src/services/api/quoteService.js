import { apiClient } from "./apiClient";

export const quoteService = {
  async createQuote(formData) {
    const isMultipart = formData instanceof FormData;
    const res = await apiClient.post("/quotes", formData, {
      headers: isMultipart ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data;
  },

  async getMyQuotes(params = {}) {
    const res = await apiClient.get("/quotes/company", { params });
    return res.data;
  },

  async getClientQuotes(params = {}) {
    const res = await apiClient.get("/quotes/client", { params });
    return res.data;
  },

  async getQuoteById(id) {
    const res = await apiClient.get(`/quotes/${id}`);
    const data = res?.data !== undefined ? res.data : res;
    return data?.quote || data;
  },

  async updateQuote(id, quoteData) {
    const res = await apiClient.put(`/quotes/${id}`, quoteData);
    return res.data;
  },

  async acceptQuote(id) {
    const res = await apiClient.post(`/quotes/${id}/accept`);
    return res.data;
  },

  async rejectQuote(id, reason = "") {
    const res = await apiClient.post(`/quotes/${id}/reject`, { reason });
    return res.data;
  },

  async cancelQuote(id) {
    const res = await apiClient.delete(`/quotes/${id}`);
    return res.data;
  },
};

