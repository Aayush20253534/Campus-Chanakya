import {
  capitalize,
  formatDeadlineDate,
  formatDeadlineTime,
  getCountdown,
} from "./assignmentsUtils";

const AssignmentCard = ({ assignment, index, onOpen }) => {
  const countdown = getCountdown(assignment);

  const days = Math.ceil(
    (assignment.dueDate - new Date()) / (1000 * 60 * 60 * 24)
  );

  const urgentClass =
    assignment.status === "overdue" ||
    (days <= 1 && assignment.status === "pending")
      ? "urgent"
      : "";

  return (
    <article
      className={`assignment-card ${assignment.status} ${assignment.priority}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="assignments-card-top-border"></div>

      <div className="assignments-card-content">
        <div className="assignments-card-header">
          <span className="assignments-subject-tag">
            {assignment.subject}
          </span>

          <span
            className={`assignments-priority-badge priority-${assignment.priority}`}
          >
            {assignment.priority.toUpperCase()}
          </span>
        </div>

        <h3 className="assignments-assignment-title font-royal">
          {assignment.title}
        </h3>

        <p className="assignments-description">{assignment.description}</p>

        {assignment.filePath && (
          <div className="assignments-file-box">
            <a
              href={assignment.filePath}
              target="_blank"
              rel="noreferrer"
              className="assignments-file-link"
            >
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>

              See Original Document
            </a>
          </div>
        )}

        <div className="assignments-meta">
          <div className="assignments-meta-row">
            <svg
              className="assignments-meta-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <span className={`assignments-deadline ${urgentClass}`}>
              {formatDeadlineDate(assignment.dueDate)} at{" "}
              {formatDeadlineTime(assignment.dueDate)}

              {countdown && (
                <span className={`assignments-countdown ${countdown.className}`}>
                  {countdown.text}
                </span>
              )}
            </span>
          </div>

          {assignment.teacher && (
            <div className="assignments-meta-row">
              <small className="assignments-teacher">
                By: {assignment.teacher}
              </small>
            </div>
          )}
        </div>

        <div className="assignments-card-footer">
          <span className={`assignments-status-badge status-${assignment.status}`}>
            {capitalize(assignment.status)}
          </span>

          <button className="assignments-view-details-btn" onClick={onOpen}>
            View Details

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

      <div className="assignments-card-bottom-border"></div>
    </article>
  );
};

export default AssignmentCard;