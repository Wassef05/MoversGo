import { apiClient } from "./apiClient";

export const authService = {
  async register(userData) {
    const isFormData = typeof FormData !== 'undefined' && userData instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await apiClient.post("/auth/register", userData, config);
    if (res.data?.token) {
      localStorage.setItem("moveflow_tn_token", res.data.token);
    }
    return res.data;
  },

  async login(email, password, role) {
    const res = await apiClient.post("/auth/login", { email, password, role });
    if (res.data?.token) {
      localStorage.setItem("moveflow_tn_token", res.data.token);
    }
    return res.data;
  },

  async googleAuth(googleData) {
    const res = await apiClient.post("/auth/google", googleData);
    if (res.data?.token) {
      localStorage.setItem("moveflow_tn_token", res.data.token);
    }
    return res.data;
  },

  async googleInit(payload) {
    const res = await apiClient.post("/auth/google/init", payload);
    return res.data;
  },

  async googleVerifyCode(email, code) {
    const res = await apiClient.post("/auth/google/verify-code", { email, code });
    const token = res.data?.data?.token || res.data?.token;
    if (token) {
      localStorage.setItem("moveflow_tn_token", token);
    }
    return res.data;
  },

  async googleComplete(payload) {
    const res = await apiClient.post("/auth/google/complete", payload);
    const token = res.data?.data?.token || res.data?.token;
    if (token) {
      localStorage.setItem("moveflow_tn_token", token);
    }
    return res.data;
  },

  async getMe() {
    const res = await apiClient.get("/auth/me");
    return res.data?.user;
  },

  async logout() {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      localStorage.removeItem("moveflow_tn_token");
    }
  },

  async verifyEmail(email, code) {
    const res = await apiClient.post("/auth/verify-email", { email, code });
    const token = res?.data?.token || res?.token;
    if (token) {
      localStorage.setItem("moveflow_tn_token", token);
    }
    return res?.data || res;
  },

  async resendVerification(email) {
    return apiClient.post("/auth/resend-verification", { email });
  },

  async forgotPassword(email) {
    return apiClient.post("/auth/forgot-password", { email });
  },

  async resetPassword(token, email, password) {
    return apiClient.post("/auth/reset-password", { token, email, password });
  },

  async changePassword(currentPassword, newPassword) {
    return apiClient.put("/auth/change-password", { currentPassword, newPassword });
  },

  async updateProfile(profileData) {
    const isFormData = typeof FormData !== 'undefined' && profileData instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const res = await apiClient.put("/users/profile", profileData, config);
    const token = res.data?.data?.token || res.data?.token;
    if (token) {
      localStorage.setItem("moveflow_tn_token", token);
    }
    return res.data;
  },
};

