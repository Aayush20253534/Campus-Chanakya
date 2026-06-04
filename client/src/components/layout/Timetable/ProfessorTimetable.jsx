import { useEffect, useState } from "react";

import DashboardLayout from "../shared/DashboardLayout";
import ProfessorTimetableTable from "./ProfessorTimetableTable";
import ProfessorTimetableModal from "./ProfessorTimetableModal";
import { authFetch } from "../../../utils/auth";

import "./Timetable.css";

const ProfessorTimetable = () => {
  const [professorName, setProfessorName] = useState("");
  const [timetable, setTimetable] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessorTimetable();
  }, []);

  const loadProfessorTimetable = async () => {
    try {
      setLoading(true);

      const data = await authFetch("/professor/dashboard");

      setProfessorName(data?.professor_name || "");

      const formatted = Array.isArray(data?.classes)
        ? data.classes.map((item) => ({
            id: item.id,
            day: item.day_of_week,
            start: String(item.start_time || "").slice(0, 5),
            end: String(item.end_time || "").slice(0, 5),
            subject: item.subject || "Unknown",
            section: `${item.year}Yr - ${item.section}`,
            room: item.room_number || "TBD",
          }))
        : [];

      setTimetable(formatted);
    } catch (error) {
      console.error("Failed to load professor timetable:", error);
      setTimetable([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activePage="Timetable">
      <div className="timetable-page-container">
        <div className="timetable-page-header">
          <div className="timetable-title-wrap">
            <svg
              className="timetable-scroll-icon"
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

            <h1 className="timetable-page-title">My Timetable</h1>

            <svg
              className="timetable-scroll-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ transform: "scaleX(-1)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>

          {professorName && (
            <div className="professor-info">{professorName}</div>
          )}
        </div>

        {loading ? (
          <div className="timetable-loading">
            Loading your royal schedule...
          </div>
        ) : (
          <ProfessorTimetableTable
            timetable={timetable}
            onClassClick={setSelectedClass}
          />
        )}

        <ProfessorTimetableModal
          classData={selectedClass}
          onClose={() => setSelectedClass(null)}
        />
      </div>
    </DashboardLayout>
  );
};

export default ProfessorTimetable;