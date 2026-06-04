export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

export const buildStudentPayload = (formData) => {
  return {
    name: formData.name,
    email: formData.email,
    gender: formData.gender,
    dob: formData.dob,
    department: formData.department,
    section: formData.section,
    year: Number(formData.year),
  };
};

export const normalizeStudentsResponse = (data) => {
  return Array.isArray(data) ? data : [];
};

export const getStudentDisplayValue = (value, fallback = "-") => {
  return value || fallback;
};