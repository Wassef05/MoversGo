import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

let socket = null;

export const initSocket = () => {
  const token = localStorage.getItem("moveflow_tn_token");
  if (!token) {
    disconnectSocket();
    return null;
  }

  // If socket already exists with a different token or is disconnected, reset it
  if (socket) {
    if (socket.auth?.token !== token) {
      disconnectSocket();
    } else if (socket.connected) {
      return socket;
    }
  }

  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("⚡ Connected to MoversGo real-time gateway");
    });

    socket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from real-time gateway:", reason);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
    });
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    try {
      socket.disconnect();
    } catch (_) {}
    socket = null;
  }
};

