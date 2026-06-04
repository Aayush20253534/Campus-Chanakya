import { useEffect, useState } from "react";
import AdminLayout from "../shared/AdminLayout";
import AdminFeedCreator from "./AdminFeedCreator";
import AdminFeedNotifications from "./AdminFeedNotifications";
import AdminFeedPost from "./AdminFeedPost";
import {
  API_BASE,
  getAuthHeaders,
  getUserRole,
  normalizeFeedResponse,
} from "./adminFeedUtils";
import "./AdminFeed.css";

const AdminFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isPosting, setIsPosting] = useState(false);
  const [postStatus, setPostStatus] = useState({
    type: "",
    message: "",
  });

  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isAdmin = getUserRole() === "admin";

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/feed`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Failed to load feed");
      }

      const data = await response.json();
      setPosts(normalizeFeedResponse(data));
    } catch (error) {
      console.error("Feed error:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async ({ title, content }) => {
    setIsPosting(true);
    setPostStatus({
      type: "",
      message: "AI Moderator is reviewing...",
    });

    try {
      const response = await fetch(`${API_BASE}/api/feed/create`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ title, content }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.status !== "success") {
        setPostStatus({
          type: "error",
          message: "Blocked",
        });

        alert(data?.message || "Post blocked or failed.");
        return false;
      }

      setPostStatus({
        type: "success",
        message: "Posted!",
      });

      await fetchFeed();
      return true;
    } catch (error) {
      console.error("Create post error:", error);

      setPostStatus({
        type: "error",
        message: "Error",
      });

      return false;
    } finally {
      setIsPosting(false);
    }
  };

  const handleVote = async (postId, voteType) => {
    try {
      const response = await fetch(`${API_BASE}/api/feed/vote`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          post_id: postId,
          vote_type: voteType,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.status !== "success") {
        throw new Error("Vote failed");
      }

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id !== postId) return post;

          let nextVote = voteType;

          if (post.user_vote === voteType) {
            nextVote = null;
          }

          return {
            ...post,
            votes: data.new_count,
            user_vote: nextVote,
          };
        })
      );
    } catch (error) {
      console.error("Voting failed:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this post?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/api/feed/delete/${postId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.status !== "success") {
        alert(data?.message || "Failed to delete post.");
        return;
      }

      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <AdminLayout>
      <section className="admin-feed-page">
        <section className="admin-feed-container">
          <AdminFeedCreator
            isPosting={isPosting}
            status={postStatus}
            onCreatePost={handleCreatePost}
          />

          <div className="admin-feed-list">
            {loading ? (
              <div className="admin-feed-loading-text">
                <i className="fas fa-circle-notch fa-spin"></i>
                Loading feed...
              </div>
            ) : posts.length === 0 ? (
              <div className="admin-feed-loading-text">
                No posts yet. Be the first!
              </div>
            ) : (
              posts.map((post) => (
                <AdminFeedPost
                  key={post.id}
                  post={post}
                  isAdmin={isAdmin}
                  onVote={handleVote}
                  onDelete={handleDeletePost}
                />
              ))
            )}
          </div>
        </section>

        <AdminFeedNotifications
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
      </section>
    </AdminLayout>
  );
};

export default AdminFeed;