import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../shared/AdminLayout";
import AdminStudentCard from "./AdminStudentCard";
import AdminStudentModal from "./AdminStudentModal";
import AdminStudentSearch from "./AdminStudentSearch";
import {
  API_BASE,
  buildStudentPayload,
  getAuthHeaders,
  normalizeStudentsResponse,
} from "./adminStudentsUtils";
import "./AdminStudents.css";

const AdminStudents = () => {
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    fetchStudents(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const fetchStudents = async (query = "") => {
    setLoading(true);

    try {
      const endpoint = query
        ? `${API_BASE}/api/admin/students?search=${encodeURIComponent(query)}`
        : `${API_BASE}/api/admin/students`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (response.status === 403) {
        alert("Access Denied: Admin privileges required.");
        localStorage.clear();
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      setStudents(normalizeStudentsResponse(data));
    } catch (error) {
      console.error("Fetch students error:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedStudent(null);
    setModalOpen(false);
  };

  const handleSaveStudent = async (formData) => {
    if (!selectedStudent?.id) return;

    setIsSaving(true);

    try {
      const payload = buildStudentPayload(formData);

      const response = await fetch(
        `${API_BASE}/api/admin/students/${selectedStudent.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to update student");
      }

      alert(data?.message || "Student updated successfully.");
      closeEditModal();
      fetchStudents(debouncedSearchTerm);
    } catch (error) {
      console.error("Save student error:", error);
      alert(error.message || "Connection Error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (studentId) => {
    const confirmed = window.confirm(`Reset password for ${studentId}?`);

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/students/${studentId}/reset-password`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reset password.");
      }

      alert("Password reset successful.");
    } catch (error) {
      console.error("Reset password error:", error);
      alert(error.message || "Network Error");
    }
  };

  const hasStudents = useMemo(() => students.length > 0, [students]);

  return (
    <AdminLayout>
      <section className="admin-students-page">
        <section className="admin-students-title-section">
          <h1 className="admin-students-title font-royal">
            Student Records
          </h1>
          <p className="admin-students-subtitle">
            Manage official student data
          </p>
        </section>

        <AdminStudentSearch value={searchTerm} onChange={setSearchTerm} />

        <section className="admin-students-grid">
          {loading ? (
            <div className="admin-students-empty-text">Loading...</div>
          ) : !hasStudents ? (
            <div className="admin-students-empty-text">
              No records found.
            </div>
          ) : (
            students.map((student, index) => (
              <AdminStudentCard
                key={student.id}
                student={student}
                index={index}
                onEdit={openEditModal}
                onResetPassword={handleResetPassword}
              />
            ))
          )}
        </section>

        <AdminStudentModal
          isOpen={modalOpen}
          student={selectedStudent}
          isSaving={isSaving}
          onClose={closeEditModal}
          onSave={handleSaveStudent}
        />
      </section>
    </AdminLayout>
  );
};

export default AdminStudents;