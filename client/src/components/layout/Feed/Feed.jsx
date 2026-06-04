import { useEffect, useState } from "react";

import DashboardLayout from "../shared/DashboardLayout";
import { authFetch } from "../../../utils/auth";

import CreatePost from "./CreatePost";
import FeedPost from "./FeedPost";

import "./Feed.css";

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const data = await authFetch("/feed");
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load feed:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (postId, voteType) => {
    try {
      const response = await authFetch("/feed/vote", {
        method: "POST",
        body: JSON.stringify({
          post_id: postId,
          vote_type: voteType,
        }),
      });

      if (response?.status !== "success") return;

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (String(post.id) !== String(postId)) return post;

          return {
            ...post,
            votes: response.new_count,
            user_vote: post.user_vote === voteType ? null : voteType,
          };
        })
      );
    } catch (error) {
      console.error("Vote failed:", error);
    }
  };

  const handleDelete = async (postId) => {
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    try {
      const response = await authFetch(`/feed/delete/${postId}`, {
        method: "DELETE",
      });

      if (response?.status === "success" || response?.message) {
        setPosts((prevPosts) =>
          prevPosts.filter((post) => String(post.id) !== String(postId))
        );
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  return (
    <DashboardLayout activePage="Feed">
      <section className="feed-container">
        <CreatePost onPostCreated={loadFeed} />

        {loading ? (
          <div className="feed-empty">
            <i className="fas fa-circle-notch fa-spin"></i> Loading feed...
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
           <FeedPost
  key={post.id}
  post={post}
  onVote={handleVote}
  onDelete={handleDelete}
/>
          ))
        )}
      </section>
    </DashboardLayout>
  );
};

export default Feed;