import { apiClient } from "./apiClient";

export const requestService = {
  async createRequest(formData) {
    const isMultipart = formData instanceof FormData;
    const res = await apiClient.post("/moving-requests", formData, {
      headers: isMultipart ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data;
  },

  async getMyRequests(params = {}) {
    const res = await apiClient.get("/moving-requests/my", { params });
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.requests)
      ? res.requests
      : [];
    return list;
  },

  async getAvailableRequests(params = {}) {
    const res = await apiClient.get("/moving-requests/available", { params });
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.requests)
      ? res.requests
      : [];
    return list;
  },

  async getRequestById(id) {
    const res = await apiClient.get(`/moving-requests/${id}`);
    const data = res?.data !== undefined ? res.data : res;
    return data?.request || data?.movingRequest || data;
  },

  async updateRequest(id, formData) {
    const isMultipart = formData instanceof FormData;
    const res = await apiClient.put(`/moving-requests/${id}`, formData, {
      headers: isMultipart ? { "Content-Type": "multipart/form-data" } : {},
    });
    return res.data;
  },

  async deleteRequest(id) {
    const res = await apiClient.delete(`/moving-requests/${id}`);
    return res.data;
  },

  async markRequestViewed(id) {
    const res = await apiClient.post(`/moving-requests/${id}/view`);
    return res.data;
  },

  async getPublicRequests(params = {}) {
    const res = await apiClient.get("/moving-requests/public", { params });
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.requests)
      ? res.requests
      : [];
    return list;
  },

  async getPublicRequestById(id) {
    const res = await apiClient.get(`/moving-requests/public/${id}`);
    const data = res?.data !== undefined ? res.data : res;
    return data?.request || data?.movingRequest || data;
  },
};

