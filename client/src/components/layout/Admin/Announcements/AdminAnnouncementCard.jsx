import {
  buildAttachmentUrl,
  getAnnouncementSummary,
  getAnnouncementTags,
  getAnnouncementTitle,
} from "./adminAnnouncementsUtils";

const AdminAnnouncementCard = ({
  announcement = {},
  index = 0,
  onEdit,
  onEnable,
  onDisable,
}) => {
  const title = getAnnouncementTitle(announcement);
  const summary = getAnnouncementSummary(announcement);
  const tags = getAnnouncementTags(announcement);

  const category = announcement?.ai_generated_category || "Processing...";
  const uploadDate = announcement?.upload_date || "No date";
  const deadline = announcement?.extracted_deadline;
  const isActive = Boolean(announcement?.active);

  const filePaths = Array.isArray(announcement?.file_paths)
    ? announcement.file_paths
    : [];

  const announcementId = announcement?.id;

  return (
    <article
      className={`admin-announcement-card ${isActive ? "" : "inactive"}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="admin-announcement-card-top-border"></div>

      <div className="admin-announcement-card-content">
        <div className="admin-announcement-card-header">
          <span className="admin-announcement-category-badge">
            {category}
          </span>

          <div className="admin-announcement-card-date">
            <span>{uploadDate}</span>
            {deadline && <span>| Due: {deadline}</span>}
          </div>
        </div>

        <h3 className="admin-announcement-card-title font-royal">
          {title}
        </h3>

        <div className="admin-announcement-admin-title-ref">
          Admin Title: {announcement?.admin_given_title || "Untitled"}{" "}
          {isActive ? (
            <span className="admin-announcement-status-active">
              (Active)
            </span>
          ) : (
            <span className="admin-announcement-status-disabled">
              (Disabled)
            </span>
          )}
        </div>

        <p className="admin-announcement-card-description">{summary}</p>

        <div className="admin-announcement-file-links">
          {filePaths.map((path, idx) => (
            <a
              key={`${path}-${idx}`}
              href={buildAttachmentUrl(path)}
              target="_blank"
              rel="noreferrer"
              className="admin-announcement-file-link"
            >
              View Attachment {idx + 1}
            </a>
          ))}
        </div>

        <div className="admin-announcement-tags-container">
          {tags.map((tag) => (
            <span key={tag} className="admin-announcement-tag-pill">
              {tag}
            </span>
          ))}
        </div>

        <div className="admin-announcement-action-buttons">
          <button
            type="button"
            className="admin-announcement-edit-btn"
            onClick={() => onEdit?.(announcement)}
            disabled={!announcementId}
          >
            Edit
          </button>

          {isActive ? (
            <button
              type="button"
              className="admin-announcement-toggle-btn"
              onClick={() => onDisable?.(announcementId)}
              disabled={!announcementId}
            >
              Disable
            </button>
          ) : (
            <button
              type="button"
              className="admin-announcement-enable-btn"
              onClick={() => onEnable?.(announcementId)}
              disabled={!announcementId}
            >
              Enable
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

export default AdminAnnouncementCard;