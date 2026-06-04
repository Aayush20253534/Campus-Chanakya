import { useState } from "react";

import {
  getCalendarDays,
  isTodayDate,
  MONTH_NAMES,
  WEEK_DAYS,
} from "./assignmentsUtils";

const AssignmentCalendar = ({ assignments }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const days = getCalendarDays(selectedMonth, selectedYear, assignments);

  const goPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
      return;
    }

    setSelectedMonth((prev) => prev - 1);
  };

  const goNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
      return;
    }

    setSelectedMonth((prev) => prev + 1);
  };

  return (
    <section className="assignments-section assignments-calendar-section">
      <div className="assignments-calendar-heading-row">
        <h2>
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
          Deadline Calendar
        </h2>

        <div className="assignments-calendar-controls">
          <button onClick={goPrevMonth}>
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <span className="assignments-current-month">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>

          <button onClick={goNextMonth}>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="assignments-calendar-grid">
        {WEEK_DAYS.map((day) => (
          <div className="assignments-calendar-day-header" key={day}>
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          const today =
            !day.otherMonth &&
            isTodayDate(day.number, selectedMonth, selectedYear);

          return (
            <div
              key={`${day.number}-${index}`}
              className={[
                "assignments-calendar-day",
                day.otherMonth ? "other-month" : "",
                today ? "today" : "",
                day.assignments.length > 0 ? "has-assignment" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="assignments-calendar-day-number">
                {day.number}
              </div>

              {day.assignments.length > 0 && (
                <div className="assignments-calendar-indicators">
                  {day.assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className={`assignments-indicator-dot indicator-${assignment.priority}`}
                    ></div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default AssignmentCalendar;