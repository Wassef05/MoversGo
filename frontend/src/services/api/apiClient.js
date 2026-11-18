import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor: attach Bearer token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("moveflow_tn_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors & data unwrapping
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message:
        error.response?.data?.message ||
        error.message ||
        "Une erreur est survenue lors de la communication avec le serveur.",
      statusCode: error.response?.status || 500,
      errors: error.response?.data?.errors || null,
      raw: error,
    };

    // If 401 and not already on auth pages, optional session clearance
    if (error.response?.status === 401 && !window.location.pathname.startsWith("/login")) {
      // Don't auto-redirect if checking auth state
      if (!error.config?.url?.includes("/auth/me")) {
        console.warn("Session expired or unauthorized request");
      }
    }

    return Promise.reject(customError);
  }
);

