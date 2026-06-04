import { API_BASE_URL } from "./api";

export const getToken = () => {
  return localStorage.getItem("access_token");
};

export const getRole = () => {
  return (localStorage.getItem("role") || "").toLowerCase().trim();
};

export const getUserName = () => {
  return localStorage.getItem("user_name") || "";
};

export const getUserYear = () => {
  return localStorage.getItem("user_year") || "";
};

export const getUserSection = () => {
  return localStorage.getItem("user_section") || "";
};

export const getUserDepartment = () => {
  return localStorage.getItem("user_department") || "";
};

export const getUserRegNo = () => {
  return localStorage.getItem("user_reg_no") || "";
};

export const getUserHostel = () => {
  return localStorage.getItem("user_hostel") || "Not Assigned";
};

export const isAuthenticated = () => {
  return Boolean(getToken());
};

export const logout = () => {
  localStorage.clear();
  window.location.href = "/";
};

export const authFetch = async (endpoint, options = {}) => {
  const token = getToken();

  const cleanBase = API_BASE_URL.replace(/\/$/, "");
  let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  if (!cleanEndpoint.startsWith("/api/")) {
    cleanEndpoint = `/api${cleanEndpoint}`;
  }

  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${cleanBase}${cleanEndpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    logout();
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || "Request failed");
  }

  return response.json();
};