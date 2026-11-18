import { apiClient } from "./apiClient";

export const notificationService = {
  async getNotifications(params = {}) {
    const res = await apiClient.get("/notifications", { params });
    return res.data;
  },

  async markAsRead(id) {
    const res = await apiClient.patch(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllRead() {
    const res = await apiClient.patch("/notifications/read-all");
    return res.data;
  },

  async deleteNotification(id) {
    const res = await apiClient.delete(`/notifications/${id}`);
    return res.data;
  },
};

