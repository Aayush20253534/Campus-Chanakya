import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { authFetch } from "../../../utils/auth";
import "./Attendance.css";

const getInitials = (name = "") => {
  return String(name)
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const getColorClassForPct = (pct) => {
  const n = Number(pct) || 0;

  if (n >= 75) return "good";
  if (n >= 60) return "warn";

  return "bad";
};

const formatTime = (time) => {
  if (!time) return "00:00";
  return String(time).slice(0, 5);
};

const isClassLive = (startTime, endTime) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [sh, sm] = formatTime(startTime).split(":").map(Number);
  const [eh, em] = formatTime(endTime).split(":").map(Number);

  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
};

const ProfessorAttendance = () => {
  const [activeView, setActiveView] = useState("schedule");

  const [professorName, setProfessorName] = useState("");
  const [todayClasses, setTodayClasses] = useState([]);
  const [reportClasses, setReportClasses] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});

  const [selectedReportClass, setSelectedReportClass] = useState("");
  const [reportRows, setReportRows] = useState([]);

  const [historyModal, setHistoryModal] = useState(null);
  const [historyRows, setHistoryRows] = useState([]);

  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDashboard();
    loadReportClasses();

    const intervalId = setInterval(loadDashboard, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const loadDashboard = async () => {
    try {
      setLoadingSchedule(true);

      const data = await authFetch("/professor/dashboard");

      setProfessorName(data?.professor_name || "");

      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];

      const todayName = days[new Date().getDay()];

      const classes = Array.isArray(data?.classes)
        ? data.classes
            .filter((cls) => cls.day_of_week === todayName)
            .map((cls) => {
              const start = formatTime(cls.start_time);
              const end = formatTime(cls.end_time);

              return {
                id: cls.id,
                time: `${start} - ${end}`,
                start_time: start,
                end_time: end,
                subject: cls.subject,
                room: cls.room_number || "TBD",
                section: `${cls.year}-${cls.section}`,
                year: cls.year,
                rawSection: cls.section,
                isLive: isClassLive(start, end),
                students: [],
              };
            })
        : [];

      setTodayClasses(classes);
    } catch (error) {
      console.error("Professor dashboard load error:", error);
      setTodayClasses([]);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const loadReportClasses = async () => {
    try {
      const data = await authFetch("/professor/reports/classes");
      setReportClasses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Report classes load error:", error);
      setReportClasses([]);
    }
  };

  const fetchRoster = async (classId) => {
    const data = await authFetch(`/professor/roster/${classId}`);

    if (Array.isArray(data?.students)) {
      return data.students.map((student) => ({
        id: student.reg_no,
        reg_no: student.reg_no,
        name: student.name,
        initial: getInitials(student.name),
        status: "unknown",
      }));
    }

    if (Array.isArray(data)) {
      return data.map((student) => ({
        id: student.reg_no,
        reg_no: student.reg_no,
        name: student.name,
        initial: getInitials(student.name),
        status: "unknown",
      }));
    }

    return [];
  };

  const openAttendanceModal = async (classData) => {
    setSelectedClass(classData);
    setStudents([]);
    setLoadingRoster(true);

    try {
      const roster = await fetchRoster(classData.id);
      setStudents(roster);

      setAttendanceData((prev) => {
        const next = { ...prev };
        next[classData.id] = next[classData.id] || {};

        roster.forEach((student) => {
          if (!(student.id in next[classData.id])) {
            next[classData.id][student.id] = "unknown";
          }
        });

        return next;
      });
    } catch (error) {
      console.error("Roster load error:", error);
      setStudents([]);
    } finally {
      setLoadingRoster(false);
    }
  };

  const closeAttendanceModal = () => {
    setSelectedClass(null);
    setStudents([]);
  };

  const updateStudentStatus = (studentId, status) => {
    if (!selectedClass) return;

    setAttendanceData((prev) => ({
      ...prev,
      [selectedClass.id]: {
        ...(prev[selectedClass.id] || {}),
        [studentId]: status,
      },
    }));
  };

  const markAll = (status) => {
    if (!selectedClass) return;

    const nextRecords = {};

    students.forEach((student) => {
      nextRecords[student.id] = status;
    });

    setAttendanceData((prev) => ({
      ...prev,
      [selectedClass.id]: nextRecords,
    }));
  };

  const summary = useMemo(() => {
    if (!selectedClass) {
      return {
        present: 0,
        absent: 0,
        total: 0,
      };
    }

    const classData = attendanceData[selectedClass.id] || {};

    return {
      present: Object.values(classData).filter((status) => status === "present")
        .length,
      absent: Object.values(classData).filter((status) => status === "absent")
        .length,
      total: students.length,
    };
  }, [attendanceData, selectedClass, students]);

  const saveAttendance = async () => {
    if (!selectedClass) return;

    const classRecords = attendanceData[selectedClass.id] || {};

    const records = Object.entries(classRecords)
      .filter(([, status]) => status === "present" || status === "absent")
      .map(([regNo, status]) => ({
        student_reg_no: regNo,
        status: status.charAt(0).toUpperCase() + status.slice(1),
      }));

    if (records.length === 0) {
      alert("Please mark attendance for at least one student.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        timetable_id: selectedClass.id,
        date: new Date().toISOString().split("T")[0],
        records,
      };

      const response = await authFetch("/professor/mark-bulk", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response?.status === "success") {
        alert("Attendance saved successfully!");
        closeAttendanceModal();
      } else {
        alert(response?.detail || "Failed to save attendance.");
      }
    } catch (error) {
      console.error("Save attendance error:", error);
      alert("Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const loadReportTable = async (classValue) => {
    setSelectedReportClass(classValue);
    setReportRows([]);

    if (!classValue) return;

    try {
      setLoadingReport(true);

      const cls = JSON.parse(classValue);

      const url = `/professor/reports/summary?subject=${encodeURIComponent(
        cls.subject
      )}&section=${cls.section}&year=${cls.year}`;

      const data = await authFetch(url);

      setReportRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Report table load error:", error);
      setReportRows([]);
    } finally {
      setLoadingReport(false);
    }
  };

  const openStudentHistory = async (row) => {
    if (!selectedReportClass) return;

    const cls = JSON.parse(selectedReportClass);

    setHistoryModal(row);
    setHistoryRows([]);
    setLoadingHistory(true);

    try {
      const url = `/professor/reports/student-history?subject=${encodeURIComponent(
        cls.subject
      )}&section=${cls.section}&year=${cls.year}&reg_no=${row.reg_no}`;

      const data = await authFetch(url);

      setHistoryRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Student history load error:", error);
      setHistoryRows([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <DashboardLayout activePage="Attendance">
      <div className="prof-attendance-page">
        <section className="prof-attendance-title-section">
          <div className="prof-attendance-title-decoration">
            <svg
              className="prof-attendance-scroll-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332-.477-4.5 1.253"
              />
            </svg>

            <h1 className="prof-attendance-page-title font-royal">
              Attendance Management
            </h1>

            <svg
              className="prof-attendance-scroll-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ transform: "scaleX(-1)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332-.477-4.5 1.253"
              />
            </svg>
          </div>

          <p className="prof-attendance-page-subtitle">
            Manage class schedules and attendance reports
          </p>

          {professorName && (
            <p className="prof-attendance-welcome">
              Welcome, {professorName}
            </p>
          )}
        </section>

        <div className="prof-attendance-view-toggle">
          <button
            className={`prof-attendance-toggle-btn ${
              activeView === "schedule" ? "active" : ""
            }`}
            onClick={() => setActiveView("schedule")}
          >
            Today's Schedule
          </button>

          <button
            className={`prof-attendance-toggle-btn ${
              activeView === "reports" ? "active" : ""
            }`}
            onClick={() => setActiveView("reports")}
          >
            Reports & History
          </button>
        </div>

        {activeView === "schedule" && (
          <section className="prof-attendance-section">
            <h2>📅 {todayLabel}</h2>

            <div className="prof-attendance-schedule">
              {loadingSchedule ? (
                <div className="prof-attendance-empty">
                  Loading schedule...
                </div>
              ) : todayClasses.length === 0 ? (
                <div className="prof-attendance-empty">
                  No classes scheduled for today.
                </div>
              ) : (
                todayClasses.map((classData) => (
                  <article
                    key={classData.id}
                    className={`prof-attendance-schedule-item ${
                      classData.isLive ? "live" : ""
                    }`}
                    onClick={() => openAttendanceModal(classData)}
                  >
                    {classData.isLive && (
                      <div className="prof-attendance-status-indicator"></div>
                    )}

                    <div className="prof-attendance-schedule-left">
                      <div className="prof-attendance-schedule-time">
                        {classData.time}
                      </div>

                      <div className="prof-attendance-schedule-subject">
                        {classData.subject}
                      </div>

                      <div className="prof-attendance-schedule-meta">
                        <span>📍 {classData.room}</span>
                        <span>👥 Class: {classData.section}</span>
                      </div>
                    </div>

                    <div className="prof-attendance-schedule-right">
                      <button
                        className="prof-attendance-mark-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openAttendanceModal(classData);
                        }}
                      >
                        Mark Attendance
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {activeView === "reports" && (
          <section className="prof-attendance-section">
            <h2>📊 Class Reports & History</h2>

            <div className="prof-attendance-reports-toolbar">
              <select
                className="prof-attendance-select-input"
                value={selectedReportClass}
                onChange={(e) => loadReportTable(e.target.value)}
              >
                <option value="">Select a Class...</option>

                {reportClasses.map((cls, index) => (
                  <option
                    key={`${cls.subject}-${cls.section}-${cls.year}-${index}`}
                    value={JSON.stringify(cls)}
                  >
                    {cls.subject} - Year {cls.year} ({cls.section})
                  </option>
                ))}
              </select>
            </div>

            <div className="prof-attendance-report-table-container">
              <table className="prof-attendance-report-table">
                <thead>
                  <tr>
                    <th>Reg No</th>
                    <th>Student Name</th>
                    <th>Attended</th>
                    <th>Total</th>
                    <th>%</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {!selectedReportClass ? (
                    <tr>
                      <td colSpan="6" className="prof-attendance-table-empty">
                        Select a class to view data
                      </td>
                    </tr>
                  ) : loadingReport ? (
                    <tr>
                      <td colSpan="6" className="prof-attendance-table-empty">
                        Loading...
                      </td>
                    </tr>
                  ) : reportRows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="prof-attendance-table-empty">
                        No records found.
                      </td>
                    </tr>
                  ) : (
                    reportRows.map((row) => {
                      const colorClass = getColorClassForPct(row.percentage);

                      return (
                        <tr
                          key={row.reg_no}
                          className="prof-attendance-clickable-row"
                          onClick={() => openStudentHistory(row)}
                        >
                          <td className="prof-attendance-reg-cell">
                            {row.reg_no}
                          </td>
                          <td>{row.name}</td>
                          <td>
                            <span className="prof-attendance-present-text">
                              {row.present}
                            </span>
                          </td>
                          <td>{row.total}</td>
                          <td>
                            <span
                              className={`prof-attendance-pct-badge ${colorClass}`}
                            >
                              {row.percentage}%
                            </span>
                          </td>
                          <td>
                            {Number(row.percentage) < 75
                              ? "⚠️ Low"
                              : "✅ Good"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {selectedClass && (
        <div
          className="prof-attendance-original-modal active"
          onClick={closeAttendanceModal}
        >
          <div
            className="prof-attendance-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="prof-attendance-modal-header">
              <h3 className="prof-attendance-modal-title">
                {selectedClass.subject} - Attendance
              </h3>

              <button
                className="prof-attendance-close-modal"
                onClick={closeAttendanceModal}
              >
                ×
              </button>
            </div>

            <div className="prof-attendance-modal-body">
              <div className="prof-attendance-header">
                <div className="prof-attendance-class-details">
                  <div className="prof-attendance-class-time">
                    {selectedClass.time}
                  </div>

                  <div>
                    {selectedClass.room} ({selectedClass.section})
                  </div>
                </div>

                <div className="prof-attendance-controls">
                  <button
                    className="prof-attendance-control-btn prof-attendance-btn-present"
                    onClick={() => markAll("present")}
                  >
                    ✅ Mark All Present
                  </button>

                  <button
                    className="prof-attendance-control-btn prof-attendance-btn-absent"
                    onClick={() => markAll("absent")}
                  >
                    ⚠️ Mark All Absent
                  </button>

                  <button
                    className="prof-attendance-control-btn prof-attendance-btn-save"
                    onClick={saveAttendance}
                    disabled={saving || loadingRoster}
                  >
                    {saving ? "⏳ Saving..." : "💾 Save Attendance"}
                  </button>
                </div>
              </div>

              <div className="prof-attendance-students-list">
                {loadingRoster ? (
                  <div className="prof-attendance-empty">
                    Loading students...
                  </div>
                ) : students.length === 0 ? (
                  <div className="prof-attendance-empty">
                    No students found.
                  </div>
                ) : (
                  students.map((student) => {
                    const status =
                      attendanceData[selectedClass.id]?.[student.id] ||
                      "unknown";

                    return (
                      <div
                        className="prof-attendance-student-item"
                        key={student.id}
                      >
                        <div className="prof-attendance-student-info">
                          <div className="prof-attendance-student-avatar">
                            {student.initial}
                          </div>

                          <div className="prof-attendance-student-details">
                            <div className="prof-attendance-student-name">
                              {student.name}
                            </div>

                            <div className="prof-attendance-student-id">
                              Reg: {student.id}
                            </div>
                          </div>
                        </div>

                        <div className="prof-attendance-status">
                          <button
                            className={`prof-attendance-status-btn prof-attendance-status-present ${
                              status === "present" ? "selected" : ""
                            }`}
                            onClick={() =>
                              updateStudentStatus(student.id, "present")
                            }
                          >
                            Present
                          </button>

                          <button
                            className={`prof-attendance-status-btn prof-attendance-status-absent ${
                              status === "absent" ? "selected" : ""
                            }`}
                            onClick={() =>
                              updateStudentStatus(student.id, "absent")
                            }
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="prof-attendance-summary-stats">
                <div className="prof-attendance-stat-box">
                  <div className="prof-attendance-stat-label">Present</div>
                  <div className="prof-attendance-stat-value stat-present">
                    {summary.present}
                  </div>
                </div>

                <div className="prof-attendance-stat-box">
                  <div className="prof-attendance-stat-label">Absent</div>
                  <div className="prof-attendance-stat-value stat-absent">
                    {summary.absent}
                  </div>
                </div>

                <div className="prof-attendance-stat-box">
                  <div className="prof-attendance-stat-label">Total</div>
                  <div className="prof-attendance-stat-value stat-total">
                    {summary.total}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {historyModal && (
        <div
          className="prof-attendance-original-modal active"
          onClick={() => setHistoryModal(null)}
        >
          <div
            className="prof-attendance-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="prof-attendance-modal-header">
              <h3 className="prof-attendance-modal-title">
                {historyModal.name} - Attendance History
              </h3>

              <button
                className="prof-attendance-close-modal"
                onClick={() => setHistoryModal(null)}
              >
                ×
              </button>
            </div>

            <div className="prof-attendance-modal-body">
              <div className="prof-attendance-history-list">
                {loadingHistory ? (
                  <div className="prof-attendance-empty">
                    Loading history...
                  </div>
                ) : historyRows.length === 0 ? (
                  <div className="prof-attendance-empty">
                    No history records found.
                  </div>
                ) : (
                  historyRows.map((item, index) => (
                    <div className="prof-attendance-history-item" key={index}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.date}</div>
                        <div
                          style={{
                            fontSize: "0.85em",
                            color: "var(--muted-foreground)",
                          }}
                        >
                          {item.day_of_week} ({item.start_time})
                        </div>
                      </div>

                      <div
                        style={{
                          fontWeight: 600,
                          color:
                            item.status === "Present"
                              ? "var(--low)"
                              : "var(--high)",
                        }}
                      >
                        {item.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProfessorAttendance;