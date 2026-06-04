import { useEffect, useState } from "react";
import AdminLayout from "../shared/AdminLayout";
import AdminTimetableFilters from "./AdminTimetableFilters";
import AdminTimetableModal from "./AdminTimetableModal";
import AdminTimetableTable from "./AdminTimetableTable";
import {
  API_BASE,
  buildSlotPayload,
  getAuthHeaders,
} from "./adminTimetableUtils";
import "./AdminTimetable.css";

const AdminTimetable = () => {
  const [year, setYear] = useState("1");
  const [section, setSection] = useState("A");

  const [slots, setSlots] = useState([]);
  const [professors, setProfessors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [initialDay, setInitialDay] = useState("Monday");
  const [initialStartTime, setInitialStartTime] = useState("09:00");

  useEffect(() => {
    loadProfessors();
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [year, section]);

  const loadProfessors = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/professors`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Failed to load professors");

      const data = await response.json();
      setProfessors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load professors error:", error);
      setProfessors([]);
    }
  };

  const loadTimetable = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/timetable?year=${year}&section=${section}`,
        {
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) throw new Error("Failed to load timetable");

      const data = await response.json();
      setSlots(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Load timetable error:", error);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (slot) => {
    setModalMode("edit");
    setSelectedSlot(slot);
    setModalOpen(true);
  };

  const openAddModal = (day = "Monday", startTime = "09:00") => {
    setModalMode("add");
    setSelectedSlot(null);
    setInitialDay(day);
    setInitialStartTime(startTime);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSlot(null);
    setModalMode("add");
  };

  const handleSave = async (formData) => {
    setIsSaving(true);

    try {
      const payload = buildSlotPayload({
        year,
        section,
        formData,
      });

      const slotId = formData.id;

      const response = await fetch(
        slotId
          ? `${API_BASE}/api/admin/timetable/${slotId}`
          : `${API_BASE}/api/admin/timetable`,
        {
          method: slotId ? "PUT" : "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Error saving timetable slot");
      }

      closeModal();
      await loadTimetable();
    } catch (error) {
      console.error("Save timetable slot error:", error);
      alert(error.message || "Error saving timetable slot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (slotId) => {
    if (!slotId) return;

    const confirmed = window.confirm("Are you sure you want to remove this class?");
    if (!confirmed) return;

    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/timetable/${slotId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Error deleting timetable slot");
      }

      closeModal();
      await loadTimetable();
    } catch (error) {
      console.error("Delete timetable slot error:", error);
      alert(error.message || "Error deleting timetable slot");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout>
      <section className="admin-timetable-page">
        <section className="admin-timetable-title-section">
          <div className="admin-timetable-title-decoration">
            <svg
              className="admin-timetable-title-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>

            <h1 className="admin-timetable-title font-royal">
              Timetable Management
            </h1>

            <svg
              className="admin-timetable-title-icon flipped"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>

          <p className="admin-timetable-subtitle">
            Admin portal for managing timetables by Year and Section
          </p>
        </section>

        <AdminTimetableFilters
          year={year}
          section={section}
          onYearChange={setYear}
          onSectionChange={setSection}
        />

        <AdminTimetableTable
          slots={slots}
          loading={loading}
          onSlotClick={openEditModal}
          onFreeSlotClick={openAddModal}
        />

        <button
          type="button"
          className="admin-timetable-add-slot-btn"
          onClick={() => openAddModal()}
        >
          Add New Slot
        </button>

        <AdminTimetableModal
          isOpen={modalOpen}
          mode={modalMode}
          slot={selectedSlot}
          initialDay={initialDay}
          initialStartTime={initialStartTime}
          professors={professors}
          isSaving={isSaving}
          onClose={closeModal}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </section>
    </AdminLayout>
  );
};

export default AdminTimetable;