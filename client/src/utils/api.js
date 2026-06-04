export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const API_ROOT = `${API_BASE_URL.replace(/\/$/, "")}/api`;

export const apiUrl = (path) => {
  const cleanBase = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
};