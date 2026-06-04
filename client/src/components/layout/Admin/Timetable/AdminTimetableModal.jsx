import { useEffect, useState } from "react";
import { DAYS, getEndTimeFromStart, START_TIMES } from "./adminTimetableUtils";

const initialForm = {
  id: "",
  day_of_week: "Monday",
  start_time: "09:00",
  end_time: "10:00",
  subject: "",
  teacher_id: "",
  room_number: "",
};

const AdminTimetableModal = ({
  isOpen,
  mode,
  slot,
  initialDay,
  initialStartTime,
  professors,
  isSaving,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState(initialForm);

  const isEditMode = mode === "edit";

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && slot) {
      setFormData({
        id: slot.id || "",
        day_of_week: slot.day_of_week || "Monday",
        start_time: slot.start_time || "09:00",
        end_time: slot.end_time || getEndTimeFromStart(slot.start_time || "09:00"),
        subject: slot.subject || "",
        teacher_id: slot.teacher_id || "",
        room_number: slot.room_number || "",
      });
    } else {
      const startTime = initialStartTime || "09:00";

      setFormData({
        ...initialForm,
        day_of_week: initialDay || "Monday",
        start_time: startTime,
        end_time: getEndTimeFromStart(startTime),
      });
    }
  }, [isOpen, isEditMode, slot, initialDay, initialStartTime]);

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

    setFormData((prev) => {
      if (name === "start_time") {
        return {
          ...prev,
          start_time: value,
          end_time: getEndTimeFromStart(value),
        };
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formData);
  };

  return (
    <div
      className="admin-timetable-modal-overlay active"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="admin-timetable-modal">
        <div className="admin-timetable-modal-top-border"></div>

        <button
          type="button"
          className="admin-timetable-modal-close"
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

        <div className="admin-timetable-modal-content">
          <h2 className="admin-timetable-modal-title font-royal">
            {isEditMode ? "Edit Timetable Slot" : "Add New Slot"}
          </h2>

          <form className="admin-timetable-modal-form" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="adminEditDay">Day</label>
              <select
                id="adminEditDay"
                name="day_of_week"
                value={formData.day_of_week}
                onChange={handleChange}
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-timetable-time-row">
              <div>
                <label htmlFor="adminEditStartTime">Start Time</label>
                <select
                  id="adminEditStartTime"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                >
                  {START_TIMES.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="adminEditEndTime">End Time</label>
                <input
                  id="adminEditEndTime"
                  name="end_time"
                  type="text"
                  value={formData.end_time}
                  readOnly
                  className="admin-timetable-readonly-input"
                />
              </div>
            </div>

            <div>
              <label htmlFor="adminEditSubject">Subject</label>
              <input
                id="adminEditSubject"
                name="subject"
                type="text"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="adminEditTeacher">Professor</label>
              <select
                id="adminEditTeacher"
                name="teacher_id"
                value={formData.teacher_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a Professor...</option>
                {professors.map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.name} ({professor.department || "N/A"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="adminEditRoom">Room Number</label>
              <input
                id="adminEditRoom"
                name="room_number"
                type="text"
                value={formData.room_number}
                onChange={handleChange}
                required
                placeholder="e.g. GS3"
              />
            </div>

            <button
              type="submit"
              className="admin-timetable-save-btn"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>

            {isEditMode && (
              <button
                type="button"
                className="admin-timetable-delete-btn"
                onClick={() => onDelete(formData.id)}
                disabled={isSaving}
              >
                Delete Slot
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminTimetableModal;