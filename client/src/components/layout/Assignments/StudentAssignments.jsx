import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../shared/DashboardLayout";
import { authFetch } from "../../../utils/auth";

import AssignmentCalendar from "./AssignmentCalendar";
import AssignmentFilters from "./AssignmentFilters";
import AssignmentCard from "./AssignmentCard";
import AssignmentModal from "./AssignmentModal";

import {
  filterAssignments,
  normalizeAssignment,
  sortAssignments,
} from "./assignmentsUtils";

import "./Assignments.css";

const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const [currentFilter, setCurrentFilter] = useState("all");
  const [currentSort, setCurrentSort] = useState("deadline");

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      const data = await authFetch("/student/assignments");

      const formatted = Array.isArray(data)
        ? data.map((item) => normalizeAssignment(item))
        : [];

      setAssignments(formatted);
    } catch (error) {
      console.error("Failed to load assignments:", error);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  const visibleAssignments = useMemo(() => {
    const filtered = filterAssignments(assignments, currentFilter);
    return sortAssignments(filtered, currentSort);
  }, [assignments, currentFilter, currentSort]);

  return (
    <DashboardLayout activePage="Assignments">
      <div className="assignments-container">
        <section className="assignments-title-section">
          <div className="assignments-title-decoration">
            <svg
              className="assignments-scroll-icon"
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

            <h1 className="assignments-page-title font-royal">
              Assignments
            </h1>

            <svg
              className="assignments-scroll-icon"
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

          <p className="assignments-page-subtitle">
            Track your pending, submitted and upcoming assignments
          </p>
        </section>

        <div className="assignments-calendar-toggle-wrap">
          <button
            className={`assignments-calendar-toggle ${
              calendarOpen ? "open" : ""
            }`}
            onClick={() => setCalendarOpen((prev) => !prev)}
          >
            {calendarOpen ? (
              <>
                <svg
                  className="assignments-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                Close Calendar
              </>
            ) : (
              <>
                <svg
                  className="assignments-icon"
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
                View Deadline Calendar
              </>
            )}
          </button>
        </div>

        {calendarOpen && <AssignmentCalendar assignments={assignments} />}

        <AssignmentFilters
          currentFilter={currentFilter}
          setCurrentFilter={setCurrentFilter}
          currentSort={currentSort}
          setCurrentSort={setCurrentSort}
        />

        <section className="assignments-grid">
          {loading ? (
            <div className="assignments-empty-state">
              <h2>Loading assignments...</h2>
            </div>
          ) : visibleAssignments.length === 0 ? (
            <div className="assignments-empty-state">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

              <h2>No assignments found</h2>
              <p>You're all caught up! Enjoy your time.</p>
            </div>
          ) : (
            visibleAssignments.map((assignment, index) => (
              <AssignmentCard
                key={assignment.id}
                assignment={assignment}
                index={index}
                onOpen={() => setSelectedAssignment(assignment)}
              />
            ))
          )}
        </section>
      </div>

      <AssignmentModal
        assignment={selectedAssignment}
        onClose={() => setSelectedAssignment(null)}
      />
    </DashboardLayout>
  );
};

export default StudentAssignments;