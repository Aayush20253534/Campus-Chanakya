import { useEffect } from "react";
import { getGradeClass } from "./resultsUtils";

const ResultModal = ({ result, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (result) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [result, onClose]);

  if (!result) return null;

  return (
    <div className="results-modal-overlay active" onClick={onClose}>
      <div
        className="results-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="results-modal-close" onClick={onClose}>
          ×
        </button>

        <h2 className="font-royal results-modal-title">{result.name}</h2>

        <p className="results-modal-code">
          {result.code} • Semester {result.semester}
        </p>

        <div className="results-modal-divider"></div>

        <div className="results-modal-row">
          <strong>Internal Marks:</strong>
          <span>{result.internal}</span>
        </div>

        <div className="results-modal-row">
          <strong>External Marks:</strong>
          <span>{result.external}</span>
        </div>

        <div className="results-modal-row">
          <strong>Total Marks:</strong>
          <span className="bold">{result.total}/100</span>
        </div>

        <div className="results-modal-row final">
          <strong>Final Grade:</strong>
          <span
            className={`results-grade-pill ${getGradeClass(result.grade)} big`}
          >
            {result.grade}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;