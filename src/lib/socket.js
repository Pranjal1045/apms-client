import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

let socket = null;

// Global online users store — updated by socket events, read by any component
let _onlineUsers = [];
const _listeners = new Set();

export const subscribeToOnlineUsers = (cb) => {
  _listeners.add(cb);
  // Immediately give current state so no missed events on mount
  cb([..._onlineUsers]);
  return () => _listeners.delete(cb);
};

const _broadcastOnline = (ids) => {
  _onlineUsers = ids.map(String);
  _listeners.forEach(cb => cb([..._onlineUsers]));
};

/**
 * connectSocket() — no token argument needed.
 * withCredentials: true sends the httpOnly JWT cookie automatically.
 */
export const connectSocket = () => {
  if (socket?.connected) return socket;

  if (socket) {
    socket.connect();
    return socket;
  }

  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("connect_error", (err) => {
    console.warn("⚠️ Socket error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("🔌 Socket disconnected:", reason);
  });

  // Central online_users listener — updates global store immediately
  socket.on("online_users", (userIds) => {
    _broadcastOnline(userIds);
  });

  return socket;
};

export const getSocket    = () => socket;
export const getOnlineUsers = () => [..._onlineUsers];

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    _onlineUsers = [];
    _listeners.forEach(cb => cb([]));
  }
};
