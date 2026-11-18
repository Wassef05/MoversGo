import { apiClient } from "./apiClient";

export const reviewService = {
  async createReview(reviewData) {
    const res = await apiClient.post("/reviews", reviewData);
    return res?.data !== undefined ? res.data : res;
  },

  async getMyReviews() {
    const res = await apiClient.get("/reviews/my");
    return res?.data !== undefined ? res.data : res;
  },

  async getPublicReviews(params = {}) {
    try {
      const res = await apiClient.get("/reviews/public", { params });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.reviews)
        ? res.reviews
        : [];
      return list;
    } catch {
      return [];
    }
  },

  async getCompanyReviews(companyId, params = {}) {
    const rawId = typeof companyId === "object" && companyId !== null
      ? (companyId._id || companyId.id || "")
      : companyId;
    const id = String(rawId || "").trim();
    if (!id || id === "[object Object]") {
      return { success: true, data: [], reviews: [], total: 0 };
    }
    const res = await apiClient.get(`/reviews/company/${id}`, { params });
    return res?.data !== undefined ? res.data : res;
  },

  async respondToReview(id, responseText) {
    const text = typeof responseText === "string" ? responseText : responseText?.text || responseText?.responseText;
    const res = await apiClient.post(`/reviews/${id}/respond`, {
      text,
      responseText: text,
      response: text,
    });
    return res?.data !== undefined ? res.data : res;
  },

  async togglePublishReview(id) {
    const res = await apiClient.patch(`/reviews/${id}/toggle-publish`);
    return res?.data !== undefined ? res.data : res;
  },
};
