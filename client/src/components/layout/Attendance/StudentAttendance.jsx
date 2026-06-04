import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { authFetch } from "../../../utils/auth";
import "./Attendance.css";

const getStatus = (pct) => {
  const n = Number(pct) || 0;
  if (n >= 75) return { className: "safe", text: "Safe" };
  if (n >= 65) return { className: "warning", text: "Warning" };
  return { className: "danger", text: "Danger" };
};

const calculate75Requirement = (attended, total) => {
  if (!total) return "No classes held yet.";

  const currentPct = (attended / total) * 100;

  if (currentPct >= 75) {
    let canMiss = 0;
    let a = attended;
    let t = total;

    while (true) {
      t++;
      if ((a / t) * 100 >= 75) canMiss++;
      else break;
    }

    return `You can miss ${canMiss} more ${
      canMiss === 1 ? "class" : "classes"
    } while staying above 75%.`;
  }

  let mustAttend = 0;
  let a = attended;
  let t = total;

  while (true) {
    t++;
    a++;
    mustAttend++;
    if ((a / t) * 100 >= 75) break;
  }

  return `You must attend the next ${mustAttend} consecutive ${
    mustAttend === 1 ? "class" : "classes"
  } to reach 75%.`;
};

const FlaskIcon = () => (
  <svg
    style={{ width: 20, height: 20, color: "var(--gold)" }}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
    />
  </svg>
);

const NextIcon = () => (
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
      d="M13 5l7 7-7 7M5 5l7 7-7 7"
    />
  </svg>
);

const ChatOrbIcon = () => (
  <svg
    style={{ width: 32, height: 32 }}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
    />
  </svg>
);

const StudentAttendance = () => {
  const [stats, setStats] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [historyModal, setHistoryModal] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [chanakyaOpen, setChanakyaOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    try {
      const [statsData, timetableData] = await Promise.all([
        authFetch("/attendance/stats"),
        authFetch("/attendance/timetable"),
      ]);

      setStats(Array.isArray(statsData) ? statsData : []);
      setTimetable(Array.isArray(timetableData) ? timetableData : []);
    } catch (error) {
      console.error("Attendance load error:", error);
      setStats([]);
      setTimetable([]);
    }
  };

  const totals = useMemo(() => {
    let total = 0;
    let present = 0;
    let absent = 0;

    stats.forEach((s) => {
      total += Number(s.total) || 0;
      present += Number(s.present) || 0;
      absent += Number(s.absent) || 0;
    });

    const percentage = total > 0 ? (present / total) * 100 : 0;
    const status = getStatus(percentage);

    return { total, present, absent, percentage, status };
  }, [stats]);

  const todaysClasses = useMemo(() => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];

    const today = days[new Date().getDay()];

    return timetable
      .filter((item) => item.day_of_week === today)
      .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
  }, [timetable]);

  const currentDay = new Date().toLocaleDateString("en-US", {
    weekday: "long",
  });

  const getTimelineStatus = (slot) => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const [sh, sm] = String(slot.start_time || "00:00").split(":").map(Number);
    const [eh, em] = String(slot.end_time || "00:00").split(":").map(Number);

    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (currentMins >= startMins && currentMins < endMins) {
      return { className: "active", label: "Live" };
    }

    if (currentMins < startMins) {
      return { className: "upcoming", label: "Next" };
    }

    return { className: "past", label: "" };
  };

  const openHistory = async (subject) => {
    setHistoryModal(subject);
    setHistory([]);
    setHistoryLoading(true);

    try {
      const data = await authFetch(
        `/attendance/history?subject=${encodeURIComponent(subject)}`
      );

      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("History load error:", error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const askChanakya = async () => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setAiLoading(true);
    setAiResponse("");

    try {
      const data = await authFetch("/attendance/chanakya-consult", {
        method: "POST",
        body: JSON.stringify({ query: cleanQuery }),
      });

      setAiResponse(data?.response || "No response received.");
      setQuery("");
    } catch (error) {
      console.error(error);
      setAiResponse(
        `<span style="color:var(--high)">Chanakya is currently meditating (Connection Error).</span>`
      );
    } finally {
      setAiLoading(false);
    }
  };

  const circumference = 2 * Math.PI * 40;
  const gaugeOffset =
    circumference - (Math.min(totals.percentage, 100) / 100) * circumference;

  return (
    <DashboardLayout activePage="Attendance">
      <div className="attendance-container">
        <section className="attendance-title-section">
          <div className="attendance-title-decoration">
            <svg
              className="attendance-scroll-icon"
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

            <h1 className="attendance-page-title font-royal">Attendance</h1>

            <svg
              className="attendance-scroll-icon"
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

          <p className="attendance-page-subtitle">
            Real-time attendance tracking and 75% eligibility status
          </p>
        </section>

        <section className="attendance-summary-section">
          <div className="attendance-gauge-wrapper">
            <svg className="attendance-gauge-svg" viewBox="0 0 100 100">
              <circle className="attendance-gauge-bg" cx="50" cy="50" r="40" />

              <circle
                className={`attendance-gauge-progress ${totals.status.className}`}
                cx="50"
                cy="50"
                r="40"
                style={{
                  strokeDasharray: `${circumference} ${circumference}`,
                  strokeDashoffset: gaugeOffset,
                }}
              />
            </svg>

            <div className="attendance-gauge-text">
              <span>{totals.present}</span>
              <span className="separator"></span>
              <span>{totals.total}</span>
            </div>
          </div>

          <div className="attendance-stat-box">
            <span className="attendance-stat-label">Attended</span>
            <span className="attendance-stat-value safe">{totals.present}</span>
          </div>

          <div className="attendance-stat-box">
            <span className="attendance-stat-label">Missed</span>
            <span className="attendance-stat-value danger">
              {totals.absent}
            </span>
          </div>

          <div className="attendance-stat-box">
            <span className="attendance-stat-label">Overall</span>
            <span
              className={`attendance-stat-value ${totals.status.className}`}
            >
              {totals.percentage.toFixed(2)}%
            </span>
          </div>
        </section>

        <section className="attendance-section">
          <h2>📅 Today's Schedule – {currentDay}</h2>

          <div className="attendance-timeline">
            {todaysClasses.length === 0 ? (
              <p className="attendance-empty">No classes scheduled today.</p>
            ) : (
              todaysClasses.map((slot) => {
                const status = getTimelineStatus(slot);

                return (
                  <div
                    key={`${slot.subject}-${slot.start_time}`}
                    className={`attendance-timeline-item ${status.className}`}
                  >
                    <div className="attendance-timeline-left">
                      <div className="attendance-timeline-time">
                        {slot.start_time} - {slot.end_time}
                      </div>

                      <div className="attendance-timeline-subject">
                        {slot.subject}
                      </div>

                      <div className="attendance-timeline-meta">
                        <span>{slot.room_number || "TBA"}</span>
                        <span>
                          {slot.teacher || slot.teacher_name || "Faculty"}
                        </span>
                      </div>
                    </div>

                    {status.className !== "past" && (
                      <div className="attendance-timeline-right">
                        <span
                          className={`attendance-status-tag ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="attendance-section">
          <h2>📚 Subject-wise Attendance</h2>

          <div className="attendance-grid-3">
            {stats.length === 0 ? (
              <p className="attendance-empty">No attendance records found.</p>
            ) : (
              stats.map((subject) => {
                const pct = Number(subject.percentage) || 0;
                const status = getStatus(pct);

                return (
                  <div
                    key={subject.subject}
                    className={`attendance-subject-card ${status.className}`}
                    onClick={() => openHistory(subject.subject)}
                    title="Click to view history"
                  >
                    <div className="attendance-card-main">
                      <div className="attendance-subject-header">
                        <div className="attendance-subject-name">
                          {subject.subject}
                        </div>

                        <div
                          className={`attendance-subject-badge ${status.className}`}
                        >
                          {pct}%
                        </div>
                      </div>

                      <div className="attendance-progress-track">
                        <div
                          className={`attendance-progress-fill ${status.className}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        ></div>
                      </div>

                      <div className="attendance-stats-grid">
                        <div className="attendance-stat-item">
                          <span className="attendance-stat-label">Present</span>
                          <span className="attendance-stat-num safe">
                            {subject.present}
                          </span>
                        </div>

                        <div className="attendance-stat-item">
                          <span className="attendance-stat-label">Absent</span>
                          <span className="attendance-stat-num danger">
                            {subject.absent}
                          </span>
                        </div>

                        <div className="attendance-stat-item">
                          <span className="attendance-stat-label">Total</span>
                          <span className="attendance-stat-num">
                            {subject.total}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`attendance-advisor-footer ${status.className}`}
                    >
                      {calculate75Requirement(subject.present, subject.total)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {historyModal && (
        <div
          className="attendance-modal-overlay active"
          onClick={() => setHistoryModal(null)}
        >
          <div
            className="attendance-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="attendance-modal-header">
              <h3 className="attendance-modal-title">{historyModal}</h3>

              <button
                className="attendance-close-modal"
                onClick={() => setHistoryModal(null)}
              >
                ×
              </button>
            </div>

            <div className="attendance-modal-body">
              {historyLoading ? (
                <div className="attendance-modal-empty">Fetching records...</div>
              ) : history.length === 0 ? (
                <div className="attendance-modal-empty">
                  No classes recorded for this subject yet.
                </div>
              ) : (
                <div className="attendance-history-list">
                  {history.map((item, index) => {
                    const dateObj = new Date(item.date);
                    const dateStr = dateObj.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });

                    return (
                      <div className="attendance-history-item" key={index}>
                        <div className="attendance-history-date-group">
                          <span className="attendance-history-date">
                            {dateStr}
                          </span>

                          <span className="attendance-history-time">
                            {item.time}
                          </span>
                        </div>

                        <span
                          className={`attendance-history-status ${item.status}`}
                        >
                          {item.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="chanakya-wrapper">
        <div className={`chanakya-panel ${chanakyaOpen ? "open" : ""}`}>
          <div className="c-header">
            <FlaskIcon />
            Consult Chanakya
          </div>

          <div className="c-input-group">
            <input
              type="text"
              className="c-input"
              placeholder="Ask about attendance..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") askChanakya();
              }}
            />

            <button className="c-send-btn" onClick={askChanakya}>
              <NextIcon />
            </button>
          </div>

          <div className={`c-loader ${aiLoading ? "active" : ""}`}>
            Thinking<span>.</span>
            <span>.</span>
            <span>.</span>
          </div>

          <div className={`c-response-box ${aiResponse ? "has-content" : ""}`}>
            <div
              className="c-typing"
              dangerouslySetInnerHTML={{ __html: aiResponse }}
            />
          </div>
        </div>

        <button
          className={`chanakya-orb ${chanakyaOpen ? "active" : ""}`}
          onClick={() => setChanakyaOpen((prev) => !prev)}
        >
          <ChatOrbIcon />
        </button>
      </div>
    </DashboardLayout>
  );
};

export default StudentAttendance;