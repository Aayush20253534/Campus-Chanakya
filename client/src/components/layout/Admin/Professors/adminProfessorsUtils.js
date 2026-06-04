export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const normalizeProfessorsResponse = (data) => {
  return Array.isArray(data) ? data : [];
};

export const buildProfessorPayload = (formData) => {
  return {
    name: formData.name,
    email: formData.email,
    department: formData.department,
  };
};

export const getProfessorValue = (value, fallback = "N/A") => {
  return value || fallback;
};