import { useEffect, useState } from "react";

import DashboardLayout from "../shared/DashboardLayout";
import TimetableTable from "./TimetableTable";
import TimetableModal from "./TimetableModal";
import { authFetch } from "../../../utils/auth";

import "./Timetable.css";

const StudentTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTimetable();
  }, []);

  const loadTimetable = async () => {
    try {
      const data = await authFetch("/attendance/timetable");
      setTimetable(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load timetable:", error);
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

            <h1 className="timetable-page-title">Timetable</h1>

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
        </div>

        {loading ? (
          <div className="timetable-loading">
            Loading your royal schedule...
          </div>
        ) : (
          <TimetableTable
            timetable={timetable}
            onClassClick={setSelectedClass}
          />
        )}

        <TimetableModal
          classData={selectedClass}
          onClose={() => setSelectedClass(null)}
        />
      </div>
    </DashboardLayout>
  );
};

export default StudentTimetable;