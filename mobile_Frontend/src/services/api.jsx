// api.js
import axios from "axios";

// ✅ CORRECT BASE URL for Laravel backend
export const API_BASE_URL = "http://127.0.0.1:8000/api/";

// ✅ Fallback image
export const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f";

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// ✅ Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ✅ Media resolver - FIXED
export const resolveMediaUrl = (src) => {
  if (!src) return FALLBACK_IMAGE;
  if (src.startsWith("http")) return src;
  if (src.startsWith("data:image")) return src;
  const normalized = String(src).replace(/^\//, "");
  if (normalized.startsWith("storage/")) {
    return `http://127.0.0.1:8000/${normalized}`;
  }
  return `${API_BASE_URL}${normalized}`;
};

// ✅ Keep old name as alias
export const resolveImageUrl = resolveMediaUrl;

export default api;