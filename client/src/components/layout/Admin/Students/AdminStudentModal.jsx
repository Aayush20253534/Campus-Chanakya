import { useEffect, useState } from "react";

const initialForm = {
  name: "",
  email: "",
  gender: "Male",
  dob: "",
  department: "",
  section: "",
  year: "",
};

const AdminStudentModal = ({ isOpen, student, isSaving, onClose, onSave }) => {
  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    if (!isOpen) return;

    if (student) {
      setFormData({
        name: student.name || "",
        email: student.email || "",
        gender: student.gender || "Male",
        dob: student.dob || "",
        department: student.department || "",
        section: student.section || "",
        year: student.year || "",
      });
    } else {
      setFormData(initialForm);
    }
  }, [isOpen, student]);

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
      className="admin-student-modal-overlay active"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="admin-student-modal">
        <div className="admin-student-modal-top-border"></div>

        <button
          type="button"
          className="admin-student-modal-close"
          onClick={onClose}
        >
          ✕
        </button>

        <div className="admin-student-modal-content">
          <h2 className="admin-student-modal-title font-royal">
            Edit Student
          </h2>

          <form className="admin-student-modal-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="studentName">Name</label>
              <input
                id="studentName"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="studentEmail">Email</label>
              <input
                id="studentEmail"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="studentGender">Gender</label>
              <select
                id="studentGender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="studentDob">DOB</label>
              <input
                id="studentDob"
                name="dob"
                type="date"
                value={formData.dob}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="studentDepartment">Department</label>
              <input
                id="studentDepartment"
                name="department"
                type="text"
                value={formData.department}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="studentSection">Section</label>
              <input
                id="studentSection"
                name="section"
                type="text"
                value={formData.section}
                onChange={handleChange}
              />
            </div>

            <div className="full-width">
              <label htmlFor="studentYear">Year</label>
              <input
                id="studentYear"
                name="year"
                type="number"
                min="1"
                max="4"
                value={formData.year}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="admin-student-save-btn"
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

export default AdminStudentModal;