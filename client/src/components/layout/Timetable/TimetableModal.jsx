import { useEffect, useState } from "react";
import { authFetch } from "../../../utils/auth";
import { formatTime, getRoomNumber, getTeacherName } from "./timetableUtils";

const TimetableModal = ({ classData, onClose }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!classData) return;

    fetchClassAdvice(classData.subject);
  }, [classData]);

  const fetchClassAdvice = async (subjectName) => {
    try {
      setLoading(true);
      setDetails(null);

      const encodedSubject = encodeURIComponent(subjectName || "");
      const data = await authFetch(
        `/timetable/class-details?subject=${encodedSubject}`
      );

      setDetails(data || null);
    } catch (error) {
      console.error("Failed to get advice:", error);
      setDetails({
        advice: "Chanakya is currently meditating. Connection error.",
        attendance_percentage: null,
        status: "Warning",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!classData) return null;

  const statusClass = details?.status ? `status-${details.status}` : "";

  return (
    <div className="timetable-modal-overlay active" onClick={onClose}>
      <div className="timetable-modal" onClick={(e) => e.stopPropagation()}>
        <div className="timetable-modal-header">
          <h3 className="timetable-modal-title">Class Detail</h3>

          <button className="timetable-close-modal" onClick={onClose}>
            ×
          </button>
        </div>

        <div className={`timetable-modal-body ${statusClass}`}>
          <div className="detail-row">
            <span className="detail-label">Subject</span>
            <span className="detail-value">{classData.subject || "N/A"}</span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Teacher</span>
            <span className="detail-value">
              {details?.teacher && details.teacher !== "N/A"
                ? details.teacher
                : getTeacherName(classData)}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Time</span>
            <span className="detail-value">
              {classData.displayStartTime || formatTime(classData.start_time)} –{" "}
              {classData.displayEndTime || formatTime(classData.end_time)}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Room</span>
            <span className="detail-value">{getRoomNumber(classData)}</span>
          </div>

          <div className="advice-box">
            {loading ? (
              <div className="timetable-loader"></div>
            ) : (
              <>
                <div className="advice-title">Chanakya's Counsel</div>

                <p className="advice-text">
                  {details?.advice || "No advice available."}
                </p>

                <div className="stat-grid">
                  <div className="mini-stat">
                    <span className="mini-stat-val">
                      {typeof details?.attendance_percentage === "number"
                        ? `${details.attendance_percentage.toFixed(1)}%`
                        : "--%"}
                    </span>
                    <span className="mini-stat-lbl">Attendance</span>
                  </div>

                  <div className="mini-stat">
                    <span className="mini-stat-val">
                      {details?.status || "--"}
                    </span>
                    <span className="mini-stat-lbl">Status</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableModal;