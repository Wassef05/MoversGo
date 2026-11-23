import { apiClient } from "./apiClient";

export const companyService = {
  async getPublicCompanies(params = {}) {
    const res = await apiClient.get("/companies", { params });
    return res.data;
  },

  async getPublicCompanyById(id) {
    const res = await apiClient.get(`/companies/${id}`);
    return res.data;
  },

  async getMyProfile() {
    const res = await apiClient.get("/companies/me");
    return res.data;
  },

  async updateMyProfile(profileData) {
    const res = await apiClient.put("/companies/me", profileData);
    return res.data;
  },

  async uploadLogo(formData) {
    const res = await apiClient.post("/companies/me/logo", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async uploadDocument(formData) {
    const res = await apiClient.post("/companies/me/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async resubmitRne(formData) {
    const res = await apiClient.post("/companies/me/resubmit-rne", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async deleteDocument(docId) {
    const res = await apiClient.delete(`/companies/me/documents/${docId}`);
    return res.data;
  },

  async getCompanyStatistics() {
    const res = await apiClient.get("/companies/statistics");
    const payload = res?.overview ? res : (res?.data !== undefined ? res.data : res);
    return payload;
  },
};

