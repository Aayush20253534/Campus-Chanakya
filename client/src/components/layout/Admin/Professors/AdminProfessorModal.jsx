import { useEffect, useState } from "react";

const initialForm = {
  name: "",
  email: "",
  department: "",
};

const AdminProfessorModal = ({
  isOpen,
  professor,
  isSaving,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (!isOpen) return;

    if (professor) {
      setFormData({
        name: professor.name || "",
        email: professor.email || "",
        department: professor.department || "",
      });
    } else {
      setFormData(initialForm);
    }
  }, [isOpen, professor]);

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

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="admin-professor-modal-overlay active"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="admin-professor-modal">
        <div className="admin-professor-modal-top-border"></div>

        <button
          type="button"
          className="admin-professor-modal-close"
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

        <div className="admin-professor-modal-content">
          <h2 className="admin-professor-modal-title font-royal">
            Edit Professor Details
          </h2>

          <p className="admin-professor-modal-subtitle">
            Update official records for the faculty database.
          </p>

          <form className="admin-professor-modal-form" onSubmit={handleSubmit}>
            <div className="full-width">
              <label htmlFor="professorName">Full Name</label>
              <input
                id="professorName"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="full-width">
              <label htmlFor="professorEmail">Official Email</label>
              <input
                id="professorEmail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="full-width">
              <label htmlFor="professorDepartment">
                Subject / Department
              </label>
              <input
                id="professorDepartment"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Mathematics-I"
                required
              />
            </div>

            <button
              type="submit"
              className="admin-professor-save-btn"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminProfessorModal;