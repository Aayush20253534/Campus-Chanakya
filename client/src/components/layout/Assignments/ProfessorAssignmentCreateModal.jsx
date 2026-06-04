import { useState } from "react";

import { API_ROOT } from "../../../utils/api";

const ProfessorAssignmentCreateModal = ({
  open,
  classes,
  onClose,
  onCreated,
}) => {
  const [form, setForm] = useState({
    title: "",
    classValue: "",
    deadline: "",
    description: "",
    file: null,
  });

  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setForm({
      title: "",
      classValue: "",
      deadline: "",
      description: "",
      file: null,
    });
  };

  const createAssignment = async () => {
    if (!form.title.trim() || !form.classValue || !form.deadline) {
      alert("Title, Class, and Deadline are required.");
      return;
    }

    try {
      setSubmitting(true);

      const classData = JSON.parse(form.classValue);

      const formData = new FormData();
      formData.append("subject", classData.subject);
      formData.append("section", classData.section);
      formData.append("year", classData.year);
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("deadline", form.deadline);

      if (form.file) {
        formData.append("file", form.file);
      }

      const response = await fetch(`${API_ROOT}/assignments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to publish assignment.");
      }

      alert("Assignment Published Successfully!");
      resetForm();
      onClose();
      await onCreated();
    } catch (error) {
      console.error("Create assignment error:", error);
      alert(error.message || "Connection to server failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="prof-assignment-modal-overlay active" onClick={onClose}>
      <div
        className="prof-assignment-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="prof-assignment-modal-header">
          Create New Assignment
        </div>

        <div className="prof-assignment-modal-body">
          <div className="prof-assignment-form-group">
            <label>Assignment Title</label>
            <input
              type="text"
              placeholder="e.g. Unit Test - 3"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>

          <div className="prof-assignment-form-group">
            <label>Select Class</label>
            <select
              value={form.classValue}
              onChange={(e) => updateField("classValue", e.target.value)}
            >
              <option value="">Select Class...</option>

              {classes.map((cls, index) => (
                <option
                  key={`${cls.subject}-${cls.section}-${cls.year}-${index}`}
                  value={JSON.stringify(cls)}
                >
                  {cls.subject} ({cls.section} - Year {cls.year})
                </option>
              ))}
            </select>
          </div>

          <div className="prof-assignment-form-group">
            <label>Deadline</label>
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(e) => updateField("deadline", e.target.value)}
            />
          </div>

          <div className="prof-assignment-form-group">
            <label>Description / Instructions</label>
            <textarea
              rows="4"
              placeholder="Enter detailed instructions..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </div>

          <div className="prof-assignment-form-group">
            <label>Attachment Optional</label>
            <input
              type="file"
              onChange={(e) => updateField("file", e.target.files[0] || null)}
            />
          </div>

          <div className="prof-assignment-form-actions">
            <button
              className="prof-assignment-btn prof-assignment-btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              className="prof-assignment-btn prof-assignment-btn-primary"
              onClick={createAssignment}
              disabled={submitting}
            >
              {submitting ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorAssignmentCreateModal;