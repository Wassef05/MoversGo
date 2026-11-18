import { apiClient } from "./apiClient";

export const messageService = {
  // Returns { conversations: [...] }
  async getConversations() {
    const res = await apiClient.get("/conversations");
    // apiClient intercepts → res = { success, data: { conversations: [...] }, message }
    // res.data = { conversations: [...] }
    return res?.data || res;
  },

  // Returns { conversation: {...} }
  async getOrCreateConversation(participantId, bookingId = null) {
    const res = await apiClient.post("/conversations", { participantId, bookingId });
    // apiClient intercepts → res = { success, data: { conversation: {...} }, message }
    // res.data = { conversation: {...} }
    return res?.data || res;
  },

  // Returns array of messages (paginated)
  async getMessages(conversationId, params = {}) {
    const res = await apiClient.get(`/conversations/${conversationId}/messages`, { params });
    // apiClient intercepts → res = { success, data: [...messages], pagination, message }
    // res.data = [...messages] (array)
    return res?.data || res;
  },

  // Returns { message: {...} }
  async sendMessage(conversationId, formData) {
    const isMultipart = formData instanceof FormData;
    const res = await apiClient.post(`/conversations/${conversationId}/messages`, formData, {
      headers: isMultipart ? { "Content-Type": "multipart/form-data" } : {},
    });
    // res = { success, data: { message: {...} }, message: "..." }
    // res.data = { message: {...} }
    return res?.data || res;
  },

  async blockUser(targetUserId) {
    const res = await apiClient.post(`/users/block/${targetUserId}`);
    return res.data;
  },

  async unblockUser(targetUserId) {
    const res = await apiClient.delete(`/users/block/${targetUserId}`);
    return res.data;
  },

  async getBlockedList() {
    const res = await apiClient.get("/users/block/list");
    return res.data;
  },
};

