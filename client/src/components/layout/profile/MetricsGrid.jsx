import { useNavigate } from "react-router-dom";

const MetricsGrid = ({ stats, assignments, resultsData }) => {
  const navigate = useNavigate();

  let totalClasses = 0;
  let totalPresent = 0;
  let lowAttendanceCount = 0;

  stats.forEach((s) => {
    const present = s.present || 0;
    const total = s.total || 0;

    totalClasses += total;
    totalPresent += present;

    if (total > 0 && present / total < 0.75) {
      lowAttendanceCount++;
    }
  });

  const overallPercent =
    totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

  return (
    <div className="profile-metrics-grid">
      <div className="profile-metric-card" onClick={() => navigate("/results")}>
        <div className="profile-metric-label">Cumulative Performance Index</div>
        <div className="profile-metric-value">
          {resultsData?.cgpa ?? "N/A"}
        </div>
      </div>

      <div className="profile-metric-card" onClick={() => navigate("/attendance")}>
        <div className="profile-metric-label">Attendance</div>
        <div className="profile-metric-value">{overallPercent}%</div>
      </div>

      <div className="profile-metric-card" onClick={() => navigate("/attendance")}>
        <div className="profile-metric-label">Attendance Status</div>
        <div className="profile-metric-value">
          {lowAttendanceCount > 0 ? `${lowAttendanceCount} Below 75%` : "All Safe"}
        </div>
      </div>

      <div className="profile-metric-card" onClick={() => navigate("/assignments")}>
        <div className="profile-metric-label">Pending Assignments</div>
        <div className="profile-metric-value">{assignments.length}</div>
      </div>
    </div>
  );
};

export default MetricsGrid;