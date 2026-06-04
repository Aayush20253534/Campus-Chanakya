import { useEffect, useMemo, useState } from "react";

import DashboardLayout from "../shared/DashboardLayout";
import AnnouncementCard from "./AnnouncementCard";
import AnnouncementModal from "./AnnouncementModal";
import Pagination from "./Pagination";
import { authFetch } from "../../../utils/auth";

import "./AnnouncementModal.css";

const CATEGORIES = [
  "Academic",
  "Examination",
  "Administrative",
  "Placement",
  "Clubs & Societies",
];

const CARDS_PER_PAGE = 3;

const Announcement = () => {
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFilter, setCurrentFilter] = useState({
    type: "category",
    value: "All",
  });
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  const filteredAnnouncements = useMemo(() => {
    if (currentFilter.type === "category" && currentFilter.value === "All") {
      return allAnnouncements;
    }

    if (currentFilter.type === "category") {
      return allAnnouncements.filter(
        (item) => item.category === currentFilter.value
      );
    }

    if (currentFilter.type === "tag") {
      return allAnnouncements.filter(
        (item) => item.tags && item.tags.includes(currentFilter.value)
      );
    }

    return allAnnouncements;
  }, [allAnnouncements, currentFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAnnouncements.length / CARDS_PER_PAGE)
  );

  const currentItems = filteredAnnouncements.slice(
    (currentPage - 1) * CARDS_PER_PAGE,
    currentPage * CARDS_PER_PAGE
  );

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentFilter]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);

      const data = await authFetch("/announcements");

      if (!Array.isArray(data)) {
        setAllAnnouncements([]);
        return;
      }

      const formatted = data.map((item) => {
        const score = item.ai_generated_relevance_score || 0;

        let scoreClass = "relevance-low";

        if (score >= 80) {
          scoreClass = "relevance-high";
        } else if (score >= 40) {
          scoreClass = "relevance-med";
        }

        const dateObj = item.upload_date
          ? new Date(item.upload_date)
          : new Date();

        const formattedDate = dateObj.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        return {
          id: item.id,
          aiTitle: item.ai_generated_title || "Analysis Pending",
          adminTitle: item.admin_given_title || "Official Notice",
          category: item.ai_generated_category || "General",
          relevanceScore: score,
          scoreClass,
          tags: Array.isArray(item.ai_generated_tags)
            ? item.ai_generated_tags
            : [],
          aiSummary:
            item.ai_generated_descriptive_summary ||
            item.ai_generated_short_summary ||
            "Content analysis in progress...",
          deadline: item.extracted_deadline || null,
          date: formattedDate,
          filePath:
            Array.isArray(item.file_paths) && item.file_paths.length > 0
              ? item.file_paths[0]
              : null,
        };
      });

      setAllAnnouncements(formatted);
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      setAllAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const filterByCategory = (category) => {
    setCurrentFilter({
      type: "category",
      value: category,
    });
  };

  const filterByTag = (tag) => {
    setSelectedAnnouncement(null);

    setCurrentFilter({
      type: "tag",
      value: tag,
    });
  };

  const clearFilters = () => {
    filterByCategory("All");
  };

  return (
    <DashboardLayout activePage="Announcements">
      <div className="home-container">
        <section className="page-title-section">
          <div className="title-decoration">
            <svg
              className="scroll-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>

            <h1 className="page-title font-royal">Announcement</h1>

            <svg
              className="scroll-icon flipped"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>

          <p className="page-subtitle">
            Authorized decrees analyzed by Chanakya for priority and context
          </p>
        </section>

        <div className="nav-filters page-filters">
          <button
            className={`filter-btn ${
              currentFilter.type === "category" && currentFilter.value === "All"
                ? "active"
                : ""
            }`}
            onClick={() => filterByCategory("All")}
          >
            All
          </button>

          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={`filter-btn ${
                currentFilter.type === "category" &&
                currentFilter.value === category
                  ? "active"
                  : ""
              }`}
              onClick={() => filterByCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {currentFilter.type === "tag" && (
          <div className="active-filter-bar">
            <div className="active-filter-badge">
              Filtering by: <span>Tag: "{currentFilter.value}"</span>

              <button className="clear-filter-btn" onClick={clearFilters}>
                ✕
              </button>
            </div>
          </div>
        )}

        <section className="announcements-grid">
          {loading ? (
            <div className="empty-message">Consulting Chanakya...</div>
          ) : currentItems.length === 0 ? (
            <div className="empty-message">
              No announcements found for this filter.
            </div>
          ) : (
            currentItems.map((announcement, index) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                index={index}
                onOpen={() => setSelectedAnnouncement(announcement)}
                onTagClick={filterByTag}
              />
            ))
          )}
        </section>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      </div>

      <AnnouncementModal
        announcement={selectedAnnouncement}
        onClose={() => setSelectedAnnouncement(null)}
        onTagClick={filterByTag}
      />
    </DashboardLayout>
  );
};

export default Announcement;