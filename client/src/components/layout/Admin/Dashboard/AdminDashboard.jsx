import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../shared/AdminLayout";
import "./AdminDashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const initialStats = {
  total_students: "--",
  total_professors: "--",
  total_feed_posts: "--",
  total_announcements: "--",
};

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState(initialStats);
  const [feedPosts, setFeedPosts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true);

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchStats();
    fetchRecentFeed();
    fetchRecentAnnouncements();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/dashboard-stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch dashboard stats");

      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Stats Error:", error);
      setStats({
        total_students: "Err",
        total_professors: "Err",
        total_feed_posts: "Err",
        total_announcements: "Err",
      });
    }
  };

  const fetchRecentFeed = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/feed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch feed");

      const data = await res.json();
      setFeedPosts(data.slice(0, 3));
    } catch (error) {
      console.error("Feed Error:", error);
      setFeedPosts([]);
    } finally {
      setLoadingFeed(false);
    }
  };

  const fetchRecentAnnouncements = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/announcements?admin_view=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Failed to fetch announcements");

      const data = await res.json();
      setAnnouncements(data.slice(0, 3));
    } catch (error) {
      console.error("Announcement Error:", error);
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  };

  const metrics = [
    {
      label: "Registered Students",
      value: stats.total_students,
      route: "/admin/students",
    },
    {
      label: "Faculty Members",
      value: stats.total_professors,
      route: "/admin/professors",
    },
    {
      label: "Total Feed Posts",
      value: stats.total_feed_posts,
      route: "/admin/feed",
    },
    {
      label: "Announcements",
      value: stats.total_announcements,
      route: "/admin/announcements",
    },
  ];

return (
  <AdminLayout>
    <section className="admin-dashboard-page">
      <section className="admin-dashboard-title-section">
        <div className="admin-dashboard-title-decoration">
          <svg
            className="admin-dashboard-title-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>

          <h1 className="admin-dashboard-title font-royal">
            Admin Dashboard
          </h1>

          <svg
            className="admin-dashboard-title-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </div>

        <p className="admin-dashboard-subtitle">
          System Overview & Real-time Statistics
        </p>
      </section>

      <section className="admin-dashboard-metrics-grid">
        {metrics.map((metric) => (
          <button
            key={metric.label}
            className="admin-dashboard-metric-card"
            onClick={() => navigate(metric.route)}
          >
            <span className="admin-dashboard-metric-label">
              {metric.label}
            </span>

            <strong className="admin-dashboard-metric-value">
              {metric.value}
            </strong>
          </button>
        ))}
      </section>

      <section className="admin-dashboard-portal-grid">
        {/* Feed Card */}
        <div className="admin-dashboard-section-card">
          <div className="admin-dashboard-section-header">
            <i className="fa-solid fa-comments"></i>
            Recent Feed Activity
          </div>

          <div>
            {loadingFeed ? (
              <p className="admin-dashboard-empty-text">
                Loading feed...
              </p>
            ) : feedPosts.length === 0 ? (
              <p className="admin-dashboard-empty-text">
                No feed posts found.
              </p>
            ) : (
              feedPosts.map((post) => (
                <article
                  key={post.id || post.title}
                  className="admin-dashboard-management-row"
                >
                  <div className="admin-dashboard-management-icon">
                    <i className="fa-solid fa-user-circle"></i>
                  </div>

                  <div className="admin-dashboard-management-info">
                    <h4>{post.title}</h4>
                    <p>{post.content}</p>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="admin-dashboard-section-footer">
            <button onClick={() => navigate("/admin/feed")}>
              View Full Feed
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>

        {/* Announcement Card */}
        <div className="admin-dashboard-section-card">
          <div className="admin-dashboard-section-header">
            <i className="fa-solid fa-bullhorn"></i>
            Active Announcements
          </div>

          <div>
            {loadingAnnouncements ? (
              <p className="admin-dashboard-empty-text">
                Loading notices...
              </p>
            ) : announcements.length === 0 ? (
              <p className="admin-dashboard-empty-text">
                No announcements posted.
              </p>
            ) : (
              announcements.map((notice) => (
                <article
                  key={notice.id || notice.upload_date}
                  className="admin-dashboard-news-item"
                >
                  <span
                    className={
                      notice.active
                        ? "admin-dashboard-news-tag active"
                        : "admin-dashboard-news-tag draft"
                    }
                  >
                    {notice.active ? "ACTIVE" : "DRAFT"}
                  </span>

                  <h5>
                    {notice.admin_given_title ||
                      notice.ai_generated_title ||
                      "Untitled Announcement"}
                  </h5>

                  <span>
                    {notice.upload_date
                      ? new Date(
                          notice.upload_date
                        ).toLocaleDateString()
                      : "No date"}
                  </span>
                </article>
              ))
            )}
          </div>

          <div className="admin-dashboard-section-footer">
            <button onClick={() => navigate("/admin/announcements")}>
              Manage Notices
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      </section>
    </section>
  </AdminLayout>
);
};

export default AdminDashboard;