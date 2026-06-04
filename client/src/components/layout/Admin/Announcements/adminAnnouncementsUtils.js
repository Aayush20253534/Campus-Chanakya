export const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const ANNOUNCEMENT_CATEGORIES = [
  "All",
  "Academic",
  "Examination",
  "Administrative",
  "Placement",
  "Clubs & Societies",
];

export const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getAnnouncementTitle = (announcement) => {
  if (!announcement) return "Untitled Announcement";

  if (
    announcement.ai_generated_title &&
    announcement.ai_generated_title !== "Processing..."
  ) {
    return announcement.ai_generated_title;
  }

  return announcement.admin_given_title || "Untitled Announcement";
};

export const getAnnouncementSummary = (announcement) => {
  return (
    announcement?.ai_generated_descriptive_summary ||
    announcement?.ai_generated_short_summary ||
    "No description available."
  );
};

export const getAnnouncementTags = (announcement) => {
  return Array.isArray(announcement?.ai_generated_tags)
    ? announcement.ai_generated_tags
    : [];
};

export const buildAttachmentUrl = (path) => {
  if (!path) return "#";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
};