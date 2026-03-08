const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://marketscope-backend1.onrender.com";

export const API_BASE_URL = API_BASE.replace(/\/$/, "");

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}