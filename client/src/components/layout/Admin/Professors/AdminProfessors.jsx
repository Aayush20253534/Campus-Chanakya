import { useEffect, useMemo, useState } from "react";
import AdminLayout from "../shared/AdminLayout";
import AdminProfessorCard from "./AdminProfessorCard";
import AdminProfessorModal from "./AdminProfessorModal";
import AdminProfessorSearch from "./AdminProfessorSearch";
import {
  API_BASE,
  buildProfessorPayload,
  getAuthHeaders,
  normalizeProfessorsResponse,
} from "./adminProfessorsUtils";
import "./AdminProfessors.css";

const AdminProfessors = () => {
  const [professors, setProfessors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedProfessor, setSelectedProfessor] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    fetchProfessors(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  const fetchProfessors = async (query = "") => {
    setLoading(true);

    try {
      const endpoint = query
        ? `${API_BASE}/api/admin/professors?search=${encodeURIComponent(query)}`
        : `${API_BASE}/api/admin/professors`;

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
      setProfessors(normalizeProfessorsResponse(data));
    } catch (error) {
      console.error("Fetch professors error:", error);
      setProfessors([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (professor) => {
    setSelectedProfessor(professor);
    setModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedProfessor(null);
    setModalOpen(false);
  };

  const handleSaveProfessor = async (formData) => {
    if (!selectedProfessor?.id) return;

    setIsSaving(true);

    try {
      const payload = buildProfessorPayload(formData);

      const response = await fetch(
        `${API_BASE}/api/admin/professors/${selectedProfessor.id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Failed to update professor");
      }

      alert(data?.message || "Professor record updated successfully!");
      closeEditModal();
      fetchProfessors(debouncedSearchTerm);
    } catch (error) {
      console.error("Save professor error:", error);
      alert(error.message || "Connection Error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async (professorId) => {
    const confirmed = window.confirm(
      `Are you sure you want to reset password for ${professorId}? It will become '${professorId}'.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/professors/${professorId}/reset-password`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Could not reset password");
      }

      alert(data?.message || "Password reset successful.");
    } catch (error) {
      console.error("Reset professor password error:", error);
      alert(error.message || "Network Error");
    }
  };

  const hasProfessors = useMemo(() => professors.length > 0, [professors]);

  return (
    <AdminLayout>
      <section className="admin-professors-page">
        <section className="admin-professors-title-section">
          <div className="admin-professors-title-decoration">
            <svg
              className="admin-professors-title-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>

            <h1 className="admin-professors-title font-royal">
              Professor Management
            </h1>

            <svg
              className="admin-professors-title-icon flipped"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <p className="admin-professors-subtitle">
            Admin portal for managing faculty records and details
          </p>
        </section>

        <AdminProfessorSearch value={searchTerm} onChange={setSearchTerm} />

        <section className="admin-professors-grid">
          {loading ? (
            <div className="admin-professors-empty-text">
              Loading professor records...
            </div>
          ) : !hasProfessors ? (
            <div className="admin-professors-empty-text">
              No professors found.
            </div>
          ) : (
            professors.map((professor, index) => (
              <AdminProfessorCard
                key={professor.id}
                professor={professor}
                index={index}
                onEdit={openEditModal}
                onResetPassword={handleResetPassword}
              />
            ))
          )}
        </section>

        <AdminProfessorModal
          isOpen={modalOpen}
          professor={selectedProfessor}
          isSaving={isSaving}
          onClose={closeEditModal}
          onSave={handleSaveProfessor}
        />
      </section>
    </AdminLayout>
  );
};

export default AdminProfessors;