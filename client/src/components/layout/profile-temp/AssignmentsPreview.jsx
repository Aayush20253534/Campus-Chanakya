import { useNavigate } from "react-router-dom";

const AssignmentsPreview = ({ assignments }) => {
  const navigate = useNavigate();

  return (
    <div className="profile-section-card" onClick={() => navigate("/assignments")}>
      <div className="profile-section-header">
        <i className="fa-solid fa-scroll"></i>
        Recent Assignments
      </div>

      {assignments.length === 0 ? (
        <div className="profile-empty">No pending assignments</div>
      ) : (
        assignments.slice(0, 3).map((assignment) => {
          const dateObj = assignment.deadline
            ? new Date(assignment.deadline)
            : new Date();

          return (
            <div className="profile-assignment-row" key={assignment.id || assignment.title}>
              <div className="profile-due-date">
                <div className="profile-date-num">{dateObj.getDate()}</div>
                <div className="profile-date-month">
                  {dateObj.toLocaleString("default", { month: "short" })}
                </div>
              </div>

              <div className="profile-assignment-info">
                <h4>{assignment.title}</h4>
                <p>
                  {assignment.subject || "Subject"} •{" "}
                  {assignment.teacher_name || "Prof"}
                </p>
              </div>

              <span className="profile-status-pill profile-status-open">
                Open
              </span>
            </div>
          );
        })
      )}
    </div>
  );
};

export default AssignmentsPreview;