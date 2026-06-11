import axios from "axios";
import { getToken } from "./auth";

const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) return import.meta.env.VITE_BACKEND_URL;
  // Dynamically resolve backend host using the current page's hostname
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:5000`;
};

const api = axios.create({
  baseURL: getBackendUrl()
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
