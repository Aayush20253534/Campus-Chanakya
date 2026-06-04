import { useState } from "react";

const AdminFeedCreator = ({ isPosting, status, onCreatePost }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async () => {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      alert("Please fill both title and content");
      return;
    }

    const success = await onCreatePost({
      title: cleanTitle,
      content: cleanContent,
    });

    if (success) {
      setTitle("");
      setContent("");
    }
  };

  return (
    <article className="admin-feed-post-creator">
      <h4 className="admin-feed-creator-title font-royal">Create a Post</h4>

      <input
        type="text"
        className="admin-feed-post-input-title"
        placeholder="Post title (AI will auto-categorize this)"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />

      <textarea
        className="admin-feed-post-input-body"
        rows="4"
        placeholder="Share an update, ask a question, or post an announcement..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />

      <div className="admin-feed-post-actions">
        <span
          className={
            status.type === "error"
              ? "admin-feed-status-error"
              : status.type === "success"
              ? "admin-feed-status-success"
              : ""
          }
        >
          {status.message}
        </span>

        <button
          type="button"
          className="admin-feed-post-btn"
          disabled={isPosting}
          onClick={handleSubmit}
        >
          {isPosting ? "Analyzing..." : "Post"}
        </button>
      </div>
    </article>
  );
};

export default AdminFeedCreator;