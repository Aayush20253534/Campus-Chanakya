import { useEffect, useState } from "react";

const initialForm = {
  adminTitle: "",
  description: "",
  category: "Academic",
  deadline: "",
  tags: "",
  files: [],
};

const AdminAnnouncementModal = ({
  isOpen,
  mode,
  announcement,
  isSaving,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState(initialForm);

  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && announcement) {
      setFormData({
        adminTitle: announcement.admin_given_title || "",
        description: announcement.ai_generated_descriptive_summary || "",
        category: announcement.ai_generated_category || "Academic",
        deadline: announcement.extracted_deadline || "",
        tags: Array.isArray(announcement.ai_generated_tags)
          ? announcement.ai_generated_tags.join(", ")
          : "",
        files: [],
      });
    } else {
      setFormData(initialForm);
    }
  }, [isOpen, isEditMode, announcement]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFilesChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      files: Array.from(event.target.files || []),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <div
      className="admin-announcement-modal-overlay active"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="admin-announcement-modal">
        <div className="admin-announcement-modal-top-border"></div>

        <button
          type="button"
          className="admin-announcement-modal-close"
          onClick={onClose}
        >
          <svg
            style={{ width: 20, height: 20 }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="admin-announcement-modal-content">
          <h2 className="admin-announcement-modal-title font-royal">
            {isEditMode ? "Edit Announcement Metadata" : "Add Announcement"}
          </h2>

          <form className="admin-announcement-modal-form" onSubmit={handleSubmit}>
            <div className="full-width">
              <label htmlFor="adminTitle">Admin Title</label>
              <input
                id="adminTitle"
                name="adminTitle"
                type="text"
                value={formData.adminTitle}
                onChange={handleChange}
                required
                placeholder="E.g., Mid Sem Exam Notice"
              />
            </div>

            <div className="full-width">
              <label htmlFor="description">
                Description / Notes for Chanakya
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Type the content here. AI will detect category, deadline, and tags automatically."
              />
            </div>

            {isEditMode && (
              <>
                <div>
                  <label htmlFor="category">Category (AI Detected)</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="Academic">Academic</option>
                    <option value="Examination">Examination</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Placement">Placement</option>
                    <option value="Clubs & Societies">
                      Clubs & Societies
                    </option>
                  </select>
                </div>

                <div>
                  <label htmlFor="deadline">Deadline (AI Detected)</label>
                  <input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={handleChange}
                  />
                </div>

                <div className="full-width">
                  <label htmlFor="tags">Tags (AI Detected)</label>
                  <input
                    id="tags"
                    name="tags"
                    type="text"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="e.g., urgent, event, exam"
                  />
                </div>
              </>
            )}

            {!isEditMode && (
              <div className="full-width">
                <label htmlFor="files">Upload Files (Images/PDFs)</label>
                <input
                  id="files"
                  name="files"
                  type="file"
                  multiple
                  onChange={handleFilesChange}
                />
                <small>Chanakya will analyze these files.</small>
              </div>
            )}

            <button
              type="submit"
              className="admin-announcement-save-btn"
              disabled={isSaving}
            >
              {isSaving
                ? "Processing..."
                : isEditMode
                ? "Update Metadata"
                : "Upload & Process"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAnnouncementModal;