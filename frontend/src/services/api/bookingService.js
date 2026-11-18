import { apiClient } from "./apiClient";

export const bookingService = {
  async getMyBookings(params = {}) {
    const res = await apiClient.get("/bookings/my", { params });
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.bookings)
          ? res.bookings
          : [];
    return list;
  },

  async getCompanyBookings(params = {}) {
    const res = await apiClient.get("/bookings/company", { params });
    const list = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.bookings)
          ? res.bookings
          : [];
    return list;
  },

  async getBookingById(id) {
    const res = await apiClient.get(`/bookings/${id}`);
    const data = res?.data !== undefined ? res.data : res;
    return data?.booking || data;
  },

  async updateServiceStatus(id, serviceStatus, note) {
    const res = await apiClient.patch(`/bookings/${id}/status`, { serviceStatus, note });
    const data = res?.data !== undefined ? res.data : res;
    return data?.booking || data;
  },

  async cancelBooking(id, cancellationReason) {
    const res = await apiClient.post(`/bookings/${id}/cancel`, { cancellationReason });
    const data = res?.data !== undefined ? res.data : res;
    return data?.booking || data;
  },

  async requestPayment(id, payload = {}) {
    const res = await apiClient.post(`/bookings/${id}/request-payment`, payload);
    const data = res?.data !== undefined ? res.data : res;
    return data?.booking || data;
  },

  async payDeposit(id, paymentData = {}) {
    const res = await apiClient.post(`/bookings/${id}/pay-deposit`, paymentData);
    const data = res?.data !== undefined ? res.data : res;
    return data?.booking || data;
  },

  async confirmCashDeposit(id) {
    const res = await apiClient.post(`/bookings/${id}/confirm-cash-deposit`);
    const data = res?.data !== undefined ? res.data : res;
    return data;
  },

  async getInvoice(id) {
    const res = await apiClient.get(`/bookings/${id}/invoice`);
    const data = res?.data !== undefined ? res.data : res;
    return data?.invoice || data;
  },

  async signInvoice(bookingId, signatureData) {
    const res = await apiClient.post(`/bookings/${bookingId}/invoice/sign`, signatureData);
    const data = res?.data !== undefined ? res.data : res;
    return data?.invoice || data;
  },

  async signClientInvoice(bookingId, signatureData) {
    const res = await apiClient.post(`/bookings/${bookingId}/invoice/sign-client`, signatureData);
    const data = res?.data !== undefined ? res.data : res;
    return data?.invoice || data;
  },

  async sendMovingReminder(bookingId) {
    const res = await apiClient.post(`/bookings/${bookingId}/remind`);
    const data = res?.data !== undefined ? res.data : res;
    return data;
  },
};

