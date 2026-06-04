import { API_BASE_URL } from "../../../utils/api";

const SERVER_ROOT = API_BASE_URL;

const buildFileUrl = (filePath) => {
  if (!filePath) return null;
  if (String(filePath).startsWith("http")) return filePath;

  const cleanPath = String(filePath).replace(/\\/g, "/").replace(/^\//, "");
  return `${SERVER_ROOT}/${cleanPath}`;
};

const ProfessorAssignmentCard = ({ assignment }) => {
  const fileUrl = buildFileUrl(assignment.file_path);

  return (
    <article className="prof-assignment-card">
      <div className="prof-assignment-card-header">
        {assignment.title}
      </div>

      <div className="prof-assignment-card-body">
        <div className="prof-assignment-card-meta">
          <div>
            <strong>Subject:</strong> {assignment.subject}
          </div>

          <div>
            <strong>Section:</strong> {assignment.section}
          </div>

          <div>
            <strong>Deadline:</strong>{" "}
            {assignment.deadline
              ? new Date(assignment.deadline).toLocaleString()
              : "N/A"}
          </div>
        </div>

        {assignment.description && (
          <p className="prof-assignment-description">
            {assignment.description}
          </p>
        )}

        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="prof-assignment-download-link"
          >
            📎 Download Attachment
          </a>
        )}
      </div>
    </article>
  );
};

export default ProfessorAssignmentCard;