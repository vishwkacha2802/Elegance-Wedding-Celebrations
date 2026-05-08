import axios from "axios";

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }

  if (typeof window !== "undefined") {
    const isLocalHost =
      window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

    if (isLocalHost) {
      return "http://127.0.0.1:8000/api";
    }
  }

  return "/api";
};

const axiosInstance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token =
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("elegance_admin_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default axiosInstance;
