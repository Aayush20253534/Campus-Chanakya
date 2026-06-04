export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  "Content-Type": "application/json",
});

export const getUserRole = () => {
  return (localStorage.getItem("role") || "").toLowerCase().trim();
};

export const normalizeFeedResponse = (data) => {
  return Array.isArray(data) ? data : [];
};

export const getAuthorTagClass = (author = "") => {
  return String(author).includes("Prof") ? "tag-professor" : "tag-student";
};

export const getPostTagClass = (tagClass) => {
  return tagClass || "tag-general";
};