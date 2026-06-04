import { useNavigate } from "react-router-dom";

const ProfessorAssignmentsPreview = ({ assignments }) => {
  const navigate = useNavigate();
  const now = new Date();

  const recentAssignments = [...assignments].reverse().slice(0, 3);

  return (
    <div className="profile-section-card" onClick={() => navigate("/assignments")}>
      <div className="profile-section-header">
        <i className="fa-solid fa-scroll"></i>
        Posted Assignments
      </div>

      {recentAssignments.length === 0 ? (
        <div className="profile-empty">No assignments posted yet.</div>
      ) : (
        recentAssignments.map((assignment) => {
          const dateObj = assignment.deadline
            ? new Date(assignment.deadline)
            : new Date();

          const isExpired = now > dateObj;

          return (
            <div
              className="profile-assignment-row"
              key={assignment.id || assignment.title}
            >
              <div className="profile-due-date">
                <div className="profile-date-num">{dateObj.getDate()}</div>
                <div className="profile-date-month">
                  {dateObj.toLocaleString("default", { month: "short" })}
                </div>
              </div>

              <div className="profile-assignment-info">
                <h4>{assignment.title}</h4>
                <p>
                  {assignment.subject || "Subject"} • Year{" "}
                  {assignment.year || "N/A"} ({assignment.section || "Sec"})
                </p>
              </div>

              <span
                className={`profile-status-pill ${
                  isExpired ? "profile-status-closed" : "profile-status-open"
                }`}
              >
                {isExpired ? "Closed" : "Active"}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ProfessorAssignmentsPreview;