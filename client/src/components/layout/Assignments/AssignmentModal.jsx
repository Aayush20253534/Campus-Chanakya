import { useEffect } from "react";

import AssignmentAI from "./AssignmentAI";

import {
  capitalize,
  formatDeadlineFullDate,
  formatDeadlineTime,
} from "./assignmentsUtils";

const AssignmentModal = ({ assignment, onClose }) => {
  useEffect(() => {
    if (assignment) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [assignment, onClose]);

  if (!assignment) return null;

  return (
    <div className="assignments-modal-overlay active" onClick={onClose}>
      <div className="assignments-modal" onClick={(e) => e.stopPropagation()}>
        <div className="assignments-modal-top-border"></div>

        <button className="assignments-modal-close" onClick={onClose}>
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="assignments-modal-content">
          <h2 className="assignments-modal-title font-royal">
            {assignment.title}
          </h2>

          <div className="assignments-modal-divider"></div>

          <div className="assignments-modal-info">
            <strong>Subject:</strong> {assignment.subject}
            <br />
            <strong>Due:</strong> {formatDeadlineFullDate(assignment.dueDate)}{" "}
            at {formatDeadlineTime(assignment.dueDate)}
          </div>

          <p className="assignments-modal-description">
            {assignment.description}
          </p>

          {assignment.filePath && (
            <div className="assignments-modal-file-box">
              <a
                href={assignment.filePath}
                target="_blank"
                rel="noreferrer"
                className="assignments-modal-file-link"
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

          <AssignmentAI assignment={assignment} />

          <div className="assignments-modal-status">
            <strong>Status:</strong> {assignment.status.toUpperCase()} |{" "}
            <strong>Priority:</strong> {assignment.priority.toUpperCase()}
          </div>
        </div>

        <div className="assignments-modal-top-border"></div>
      </div>
    </div>
  );
};

export default AssignmentModal;