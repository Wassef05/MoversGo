import { apiClient } from "./apiClient";

export const recommendationService = {
  /**
   * Fetch smart recommended moving requests for the authenticated company
   */
  async getCompanyRecommendations(params = {}) {
    const res = await apiClient.get("/recommendations/company", { params });
    const payload = res?.data !== undefined ? res.data : res;
    return {
      recommendations: Array.isArray(payload?.recommendations) ? payload.recommendations : [],
      pagination: payload?.pagination || { total: 0, page: 1, limit: 12, pages: 1 },
      companyLocation: payload?.companyLocation || null,
    };
  },

  /**
   * Fetch company opportunity KPIs
   */
  async getCompanyRecommendationStats() {
    const res = await apiClient.get("/recommendations/company/stats");
    const payload = res?.data !== undefined ? res.data : res;
    return payload?.stats || {
      totalRecommended: 0,
      newOpportunities: 0,
      nearbyCount: 0,
      perfectServiceMatches: 0,
      averageScore: 0,
    };
  },

  /**
   * Fetch coordinates & summary for interactive map
   */
  async getRecommendationMapData() {
    const res = await apiClient.get("/recommendations/company/map");
    const payload = res?.data !== undefined ? res.data : res;
    return {
      company: payload?.company || null,
      markers: Array.isArray(payload?.markers) ? payload.markers : [],
    };
  },

  /**
   * Fetch compatibility breakdown for a specific request
   */
  async getRecommendationBreakdown(requestId) {
    const res = await apiClient.get(`/recommendations/company/${requestId}`);
    const payload = res?.data !== undefined ? res.data : res;
    return {
      request: payload?.request || null,
      recommendation: payload?.recommendation || null,
    };
  },

  /**
   * Update company recommendation preferences
   */
  async updateRecommendationSettings(settings) {
    const res = await apiClient.put("/recommendations/settings", settings);
    return res?.data !== undefined ? res.data : res;
  },
};
