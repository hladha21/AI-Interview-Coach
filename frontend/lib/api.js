import axios from "axios";
import { getToken } from "./auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_NODE_API,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If 401, redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err.response?.data || err);
  }
);

export default api;