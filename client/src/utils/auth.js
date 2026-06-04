import { API_ROOT } from "./api";

export const getToken = () => {
  return localStorage.getItem("access_token");
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("access_token");
  return Boolean(token);
};

export const getUserName = () => {
  return localStorage.getItem("user_name") || "Scholar";
};

export const logout = () => {
  localStorage.clear();
  window.location.href = "/";
};

export const authFetch = async (endpoint, options = {}) => {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok) {
    throw new Error("Request failed");
  }

  return response.json();
};