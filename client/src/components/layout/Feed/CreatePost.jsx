import { useState } from "react";
import { authFetch } from "../../../utils/auth";
import { getUserRole } from "./feedUtils";

const CreatePost = ({ onPostCreated }) => {
  const role = getUserRole();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canPost = role === "student" || role === "professor" || role === "admin";

  const handleSubmit = async () => {
    const cleanTitle = title.trim();
    const cleanContent = content.trim();

    if (!cleanTitle || !cleanContent) {
      setStatusType("muted");
      setStatusMessage("Please fill in both title and content.");
      return;
    }

    try {
      setSubmitting(true);
      setStatusType("info");
      setStatusMessage("Chanakya is reviewing your post...");

      const response = await authFetch("/feed/create", {
        method: "POST",
        body: JSON.stringify({
          title: cleanTitle,
          content: cleanContent,
        }),
      });

      if (response?.status === "success") {
        setStatusType("success");
        setStatusMessage(`Posted! Categorized as ${response.category}.`);

        setTitle("");
        setContent("");

        await onPostCreated();
        return;
      }

      if (response?.status === "rejected") {
        setStatusType("error");
        setStatusMessage(response.message || "Post rejected.");
        return;
      }

      setStatusType("muted");
      setStatusMessage("Something went wrong.");
    } catch (error) {
      console.error("Post creation failed:", error);
      setStatusType("error");
      setStatusMessage("Error connecting to server.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!canPost) return null;

  return (
    <article className="post-creator">
      <h4 className="font-royal post-creator-title">Create a Post</h4>

      <input
        type="text"
        className="post-input-title"
        placeholder="Post title (AI will auto-categorize this)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        className="post-input-body"
        rows="4"
        placeholder="Share an update, ask a question, or post an announcement. Chanakya will review it for safety."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      ></textarea>

      <div className="post-actions">
        <span className={`post-status ${statusType}`}>{statusMessage}</span>

        <button className="post-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Analyzing..." : "Post"}
        </button>
      </div>
    </article>
  );
};

export default CreatePost;