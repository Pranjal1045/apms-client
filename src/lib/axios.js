import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api/v1",
  withCredentials: true,
  timeout: 30000,
});

// Public auth pages — never force-redirect these to /login on 401
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

// Response interceptor — handle token expiry
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isPublicPage = PUBLIC_PATHS.some(p => window.location.pathname.startsWith(p));
    if (error.response?.status === 401 && !isPublicPage) {
      // Token expired on a protected page — redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
