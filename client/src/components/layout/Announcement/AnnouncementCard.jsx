const AnnouncementCard = ({ announcement, index, onOpen, onTagClick }) => {
  const borderColor =
    announcement.relevanceScore >= 80
      ? "var(--decree)"
      : announcement.relevanceScore >= 40
      ? "var(--court-notice)"
      : "var(--public-notice)";

  return (
    <article
      className="announcement-card"
      style={{
        borderLeftColor: borderColor,
        animationDelay: `${index * 0.1}s`,
      }}
      onClick={onOpen}
    >
      <div className="card-top-border"></div>

      <div className="card-content">
        <div className="card-header">
          <span className={`relevance-badge ${announcement.scoreClass}`}>
            Relevance: {announcement.relevanceScore}%
          </span>

          <div className="card-date">
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{announcement.date}</span>
          </div>
        </div>

        <div className="ai-marker">Chanakya Given Title</div>

        <h3 className="card-title font-royal">{announcement.aiTitle}</h3>

        <div className="admin-title-ref">Ref: {announcement.adminTitle}</div>

        <div className="ai-marker summary-marker">Chanakya Summary</div>

        <p className="card-description">{announcement.aiSummary}</p>

        <div className="tags-container">
          {announcement.tags.slice(0, 3).map((tag) => (
            <button
              key={tag}
              className="tag-pill"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
};

export default AnnouncementCard;