import { getAuthorTagClass, getPostTagClass } from "./adminFeedUtils";

const AdminFeedPost = ({ post, isAdmin, onVote, onDelete }) => {
  const upActive = post.user_vote === "up" ? "active" : "";
  const downActive = post.user_vote === "down" ? "active" : "";

  return (
    <article className="admin-feed-item" id={`post-${post.id}`}>
      <aside className="admin-feed-vote-sidebar">
        <button
          type="button"
          className={`admin-feed-vote-btn ${upActive}`}
          data-type="up"
          onClick={() => onVote(post.id, "up")}
        >
          <i className="fas fa-chevron-up"></i>
        </button>

        <span className="admin-feed-vote-count">{post.votes}</span>

        <button
          type="button"
          className={`admin-feed-vote-btn ${downActive}`}
          data-type="down"
          onClick={() => onVote(post.id, "down")}
        >
          <i className="fas fa-chevron-down"></i>
        </button>
      </aside>

      <div className="admin-feed-post-content">
        <header className="admin-feed-post-meta">
          <span className={`admin-feed-tag ${getPostTagClass(post.tag_class)}`}>
            {post.category || "General"}
          </span>

          <span className={`admin-feed-tag ${getAuthorTagClass(post.author)}`}>
            {post.author || "Unknown"}
          </span>

          <span>• {post.timestamp || "No date"}</span>
        </header>

        <h2 className="admin-feed-post-title">{post.title}</h2>

        <p className="admin-feed-post-body">{post.content}</p>

        {isAdmin && (
          <button
            type="button"
            className="admin-feed-delete-post-btn"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(post.id);
            }}
            title="Delete Post"
          >
            <i className="fas fa-trash-alt"></i>
          </button>
        )}
      </div>
    </article>
  );
};

export default AdminFeedPost;