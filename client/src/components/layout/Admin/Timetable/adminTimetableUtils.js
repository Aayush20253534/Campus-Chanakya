export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export const START_TIMES = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

export const YEARS = [
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
];

export const SECTIONS = [
  { value: "A", label: "Section A" },
  { value: "B", label: "Section B" },
  { value: "C", label: "Section C" },
];

export const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
  "Content-Type": "application/json",
});

export const getEndTimeFromStart = (startTime) => {
  const hour = Number(String(startTime).split(":")[0]);
  const nextHour = hour + 1;

  return `${String(nextHour).padStart(2, "0")}:00`;
};

export const findSlot = (slots, day, startTime) => {
  return slots.find(
    (slot) => slot.day_of_week === day && slot.start_time === startTime
  );
};

export const buildSlotPayload = ({ year, section, formData }) => ({
  year: Number(year),
  section,
  day_of_week: formData.day_of_week,
  start_time: formData.start_time,
  end_time: formData.end_time,
  subject: formData.subject,
  teacher_id: formData.teacher_id,
  room_number: formData.room_number,
});