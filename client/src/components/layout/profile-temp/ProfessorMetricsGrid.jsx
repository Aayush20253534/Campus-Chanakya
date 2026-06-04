import { useNavigate } from "react-router-dom";

const ProfessorMetricsGrid = ({
  activeCourses,
  weeklyClasses,
  assignmentsCreated,
  campusNotices,
}) => {
  const navigate = useNavigate();

  return (
    <div className="profile-metrics-grid">
      <div className="profile-metric-card" onClick={() => navigate("/timetable")}>
        <div className="profile-metric-label">Active Courses</div>
        <div className="profile-metric-value">{activeCourses}</div>
      </div>

      <div className="profile-metric-card" onClick={() => navigate("/timetable")}>
        <div className="profile-metric-label">Weekly Classes</div>
        <div className="profile-metric-value">{weeklyClasses}</div>
      </div>

      <div className="profile-metric-card" onClick={() => navigate("/assignments")}>
        <div className="profile-metric-label">Assignments Created</div>
        <div className="profile-metric-value">{assignmentsCreated}</div>
      </div>

      <div className="profile-metric-card" onClick={() => navigate("/announcement")}>
        <div className="profile-metric-label">Campus Notices</div>
        <div className="profile-metric-value">{campusNotices}</div>
      </div>
    </div>
  );
};

export default ProfessorMetricsGrid;