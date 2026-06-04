import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../shared/AdminLayout";
import AdminAnnouncementCard from "./AdminAnnouncementCard";
import AdminAnnouncementFilters from "./AdminAnnouncementFilters";
import AdminAnnouncementModal from "./AdminAnnouncementModal";
import {
  ANNOUNCEMENT_CATEGORIES,
  BACKEND_URL,
  getAuthHeaders,
} from "./adminAnnouncementsUtils";
import "./AdminAnnouncements.css";

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredAnnouncements = useMemo(() => {
    if (activeCategory === "All") return announcements;

    return announcements.filter((announcement) => {
      const category = announcement.ai_generated_category || "General";
      return category === activeCategory;
    });
  }, [activeCategory, announcements]);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/announcements?admin_view=true`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch announcements");
      }

      const data = await response.json();

      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Announcement fetch error:", error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setEditingAnnouncement(null);
    setModalOpen(true);
  };

  const openEditModal = (announcement) => {
    setModalMode("edit");
    setEditingAnnouncement(announcement);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAnnouncement(null);
    setModalMode("add");
  };

  const handleDisable = async (announcementId) => {
    const confirmed = window.confirm(
      "Are you sure you want to disable this announcement? It will be hidden from students."
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/announcements/${announcementId}/disable`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to disable announcement");
      }

      await fetchAnnouncements();
    } catch (error) {
      console.error("Disable announcement error:", error);
      alert("Failed to disable announcement.");
    }
  };

  const handleEnable = async (announcementId) => {
    const confirmed = window.confirm(
      "Are you sure you want to enable this announcement? It will appear on student feeds."
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/announcements/${announcementId}/enable`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to enable announcement");
      }

      await fetchAnnouncements();
    } catch (error) {
      console.error("Enable announcement error:", error);
      alert("Failed to enable announcement.");
    }
  };

  const handleModalSubmit = async (formData) => {
    setIsSaving(true);

    try {
      if (modalMode === "edit" && editingAnnouncement) {
        const payload = {
          admin_given_title: formData.adminTitle,
          ai_generated_category: formData.category,
          extracted_deadline: formData.deadline || null,
          ai_generated_tags: formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          ai_generated_descriptive_summary: formData.description,
        };

        const response = await fetch(
          `${BACKEND_URL}/api/announcements/${editingAnnouncement.id}/update`,
          {
            method: "PUT",
            headers: {
              ...getAuthHeaders(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          throw new Error("Update failed");
        }

        alert("Updated successfully!");
      } else {
        const uploadData = new FormData();
        uploadData.append("title", formData.adminTitle);
        uploadData.append("notes", formData.description);

        formData.files.forEach((file) => {
          uploadData.append("files", file);
        });

        const response = await fetch(`${BACKEND_URL}/api/announcements/add`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: uploadData,
        });

        if (!response.ok) {
          const err = await response.json().catch(() => null);
          throw new Error(err?.detail || "Upload failed");
        }

        alert("Upload started! Chanakya is analyzing content in the background.");
      }

      closeModal();
      await fetchAnnouncements();
    } catch (error) {
      console.error("Save announcement error:", error);
      alert(error.message || "An error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <section className="admin-announcements-page">
        <div className="admin-announcements-top-filter-wrap">
          <AdminAnnouncementFilters
            categories={ANNOUNCEMENT_CATEGORIES}
            activeCategory={activeCategory}
            onChangeCategory={setActiveCategory}
          />
        </div>

        <section className="admin-announcements-title-section">
          <div className="admin-announcements-title-decoration">
            <svg
              className="admin-announcements-title-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>

            <h1 className="admin-announcements-title font-royal">
              Announcement Management
            </h1>

            <svg
              className="admin-announcements-title-icon flipped"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>

          <p className="admin-announcements-subtitle">
            Admin portal for creating, editing, and managing announcements
          </p>
        </section>

        <section className="admin-announcements-grid">
          {loading ? (
            <div className="admin-announcement-loading-text">
              Loading announcements...
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="admin-announcement-loading-text">
              No announcements found.
            </div>
          ) : (
            filteredAnnouncements.map((announcement, index) => (
              <AdminAnnouncementCard
                key={announcement.id}
                announcement={announcement}
                index={index}
                onEdit={openEditModal}
                onEnable={handleEnable}
                onDisable={handleDisable}
              />
            ))
          )}
        </section>

        <button
          type="button"
          className="admin-announcement-fab"
          onClick={openAddModal}
          title="Add New Announcement"
        >
          +
        </button>

        <AdminAnnouncementModal
          isOpen={modalOpen}
          mode={modalMode}
          announcement={editingAnnouncement}
          isSaving={isSaving}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
        />
      </section>
    </AdminLayout>
  );
};

export default AdminAnnouncements;