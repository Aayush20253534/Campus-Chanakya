import { getAuthorTag, getCategoryTagClass } from "./feedUtils";

const FeedPost = ({ post, onVote, onDelete }) => {
  const authorTag = getAuthorTag(post.author || "");
  const categoryTagClass = getCategoryTagClass(post);

  const upActive = post.user_vote === "up" ? "active" : "";
  const downActive = post.user_vote === "down" ? "active" : "";

  const canDelete = Boolean(post.can_delete);

  return (
    <article className="feed-item">
      <aside className="vote-sidebar">
        <button
          type="button"
          className={`vote-btn ${upActive}`}
          data-type="up"
          onClick={() => onVote(post.id, "up")}
        >
          <i className="fas fa-chevron-up"></i>
        </button>

        <span className="vote-count">{post.votes}</span>

        <button
          type="button"
          className={`vote-btn ${downActive}`}
          data-type="down"
          onClick={() => onVote(post.id, "down")}
        >
          <i className="fas fa-chevron-down"></i>
        </button>
      </aside>

      <div className="post-content">
        <header className="post-meta">
          <span className={`tag ${categoryTagClass}`}>
            {post.category || "General"}
          </span>

          <span className={`tag ${authorTag.className}`}>
            {authorTag.label}
          </span>

          <span>• {post.timestamp}</span>

          {canDelete && (
            <button
              type="button"
              className="feed-delete-btn"
              onClick={() => onDelete(post.id)}
              title="Delete post"
            >
              <i className="fas fa-trash"></i>
              Delete
            </button>
          )}
        </header>

        <h2 className="post-title">{post.title}</h2>

        <p className="post-body">{post.content}</p>
      </div>
    </article>
  );
};

export default FeedPost;