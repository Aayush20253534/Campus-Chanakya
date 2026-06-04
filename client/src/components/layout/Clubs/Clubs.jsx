import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { authFetch } from "../../../utils/auth";
import "./Clubs.css";

import { API_BASE_URL } from "../../../utils/api";

const SERVER_URL = API_BASE_URL;

const categories = [
  { label: "All", value: "all" },
  { label: "Technical", value: "technical" },
  { label: "Cultural", value: "cultural" },
  { label: "Sports", value: "sports" },
];

const getIconForClub = (club) => {
  const cat = String(club.category || "").toLowerCase();
  const name = String(club.name || "").toLowerCase();

  if (cat === "technical" || name.includes("code") || name.includes("robot")) {
    return "💻";
  }

  if (cat === "cultural" || name.includes("dance") || name.includes("drama")) {
    return "🎭";
  }

  if (cat === "sports") return "🏆";
  if (cat === "academic") return "📚";
  if (cat === "committee" || name.includes("cell")) return "🏛️";

  return "✨";
};

const getBannerClass = (category) => {
  const cat = String(category || "").toLowerCase();

  if (["technical", "cultural", "sports", "academic", "committee"].includes(cat)) {
    return `clubs-banner-${cat}`;
  }

  return "clubs-banner-default";
};

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [chanakyaOpen, setChanakyaOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);

      const data = await authFetch("/clubs");

      const formatted = Array.isArray(data)
        ? data.map((club) => ({
            id: club.id,
            name: club.name || "Unnamed Club",
            category: String(club.category || "general").toLowerCase(),
            logo: club.logo_url ? `${SERVER_URL}${club.logo_url}` : null,
            banner: club.banner_image ? `${SERVER_URL}${club.banner_image}` : null,
            icon: getIconForClub(club),
            description:
              club.short_description ||
              club.full_description ||
              "No description available.",
            coordinator:
              Array.isArray(club.coordinators) && club.coordinators.length > 0
                ? club.coordinators[0].name
                : "Faculty In-charge",
            tags: Array.isArray(club.tags) ? club.tags : [],
          }))
        : [];

      setClubs(formatted);
    } catch (error) {
      console.error("Error loading clubs:", error);
      setClubs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredClubs = useMemo(() => {
    let result = clubs;

    if (category !== "all") {
      result = result.filter((club) => club.category === category);
    }

    if (search.trim()) {
      const q = search.toLowerCase();

      result = result.filter(
        (club) =>
          club.name.toLowerCase().includes(q) ||
          club.description.toLowerCase().includes(q) ||
          club.coordinator.toLowerCase().includes(q)
      );
    }

    return result;
  }, [clubs, category, search]);

  const askChanakya = async () => {
    if (!query.trim()) return;

    try {
      setAiLoading(true);
      setRecommendations(null);

      const data = await authFetch("/clubs/recommendations", {
        method: "POST",
        body: JSON.stringify({
          interests: query.trim(),
          department: "General",
          year: "Current",
        }),
      });

      setRecommendations(Array.isArray(data) ? data : []);
      setQuery("");
    } catch (error) {
      console.error("Chanakya club recommendation error:", error);
      setRecommendations([]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <DashboardLayout activePage="Clubs & Committees">
      <div className="clubs-container">
        <section className="clubs-title-section">
          <div className="clubs-title-decoration">
            <svg
              className="clubs-scroll-icon"
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

            <h1 className="clubs-page-title font-royal">
              Clubs & Committees
            </h1>

            <svg
              className="clubs-scroll-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ transform: "scaleX(-1)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>

          <p className="clubs-page-subtitle">
            Discover and join vibrant student communities & official committees
          </p>
        </section>

        <section className="clubs-filter-section">
          <input
            type="text"
            className="clubs-search-bar"
            placeholder="Search clubs, societies, coordinators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="clubs-category-filters">
            {categories.map((item) => (
              <button
                key={item.value}
                className={`clubs-filter-btn ${
                  category === item.value ? "active" : ""
                }`}
                onClick={() => setCategory(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="clubs-grid">
          {loading ? (
            <div className="clubs-empty">Loading clubs...</div>
          ) : filteredClubs.length === 0 ? (
            <div className="clubs-empty">
              <svg
                className="clubs-empty-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2>No clubs found</h2>
              <p>Try adjusting your search or filter</p>
            </div>
          ) : (
            filteredClubs.map((club) => (
              <a
                href={`/club-open?id=${club.id}`}
                className="club-card"
                key={club.id}
              >
                <div
                  className={`clubs-card-banner ${
                    club.banner ? "" : getBannerClass(club.category)
                  }`}
                  style={
                    club.banner
                      ? { backgroundImage: `url("${club.banner}")` }
                      : undefined
                  }
                ></div>

                <div className="clubs-card-avatar">
                  {club.logo ? (
                    <img src={club.logo} alt={club.name} />
                  ) : (
                    <span>{club.icon}</span>
                  )}
                </div>

                <div className="clubs-card-content">
                  <h3 className="clubs-club-name font-royal">{club.name}</h3>

                  <div className="clubs-tags-container">
                    {club.tags.slice(0, 3).map((tag) => (
                      <span className="clubs-card-tag" key={tag}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="clubs-description">{club.description}</p>

                  <div className="clubs-footer">
                    Coordinator:{" "}
                    <span className="clubs-coordinator-name">
                      {club.coordinator}
                    </span>
                  </div>
                </div>
              </a>
            ))
          )}
        </section>
      </div>

      <div className={`clubs-chanakya-card ${chanakyaOpen ? "open" : ""}`}>
        <div className="clubs-c-header">
          <div className="clubs-c-title">
            <svg
              className="clubs-c-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            CONSULT CHANAKYA
          </div>

          <button
            className="clubs-c-close"
            onClick={() => setChanakyaOpen(false)}
          >
            ×
          </button>
        </div>

        <div className="clubs-c-input-wrapper">
          <input
            type="text"
            className="clubs-c-input"
            placeholder="Tell me your interests (e.g. coding)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") askChanakya();
            }}
          />

          <button className="clubs-c-send-btn" onClick={askChanakya}>
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div className="clubs-c-content">
          {aiLoading ? (
            <p className="clubs-c-text muted">
              Chanakya is consulting the archives...
            </p>
          ) : recommendations === null ? (
            <p className="clubs-c-text">
              Greetings, Student. I am here to guide you to the right path. Tell
              me what interests you seek to pursue, and I shall identify the
              community where your talents will flourish.
            </p>
          ) : recommendations.length > 0 ? (
            <>
              <p
                className="clubs-c-text"
                dangerouslySetInnerHTML={{
                  __html: `Greetings. Based on your interest, I believe the <strong>${recommendations[0].name}</strong> would be an excellent forge for your talents.`,
                }}
              />

              <div className="clubs-rec-list">
                {recommendations.slice(0, 3).map((club) => (
                  <a
                    key={club.id}
                    href={`/club-open?id=${club.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="clubs-c-rec-item"
                  >
                    <div className="clubs-c-rec-name">
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {club.name}
                    </div>

                    <div className="clubs-c-rec-reason">
                      {club.ai_reason || "Aligned with your path."}
                    </div>
                  </a>
                ))}
              </div>

              <div className="clubs-c-quote">
                Chanakya advises: "A student who aligns their passion with the
                right community finds not just a club, but a destiny."
              </div>
            </>
          ) : (
            <>
              <p className="clubs-c-text">
                I could not find specific clubs matching those interests
                perfectly. Try browsing our broad categories.
              </p>

              <div className="clubs-c-quote">
                Chanakya advises: "Do not fear the new path."
              </div>
            </>
          )}
        </div>
      </div>

      <button
        className="clubs-chanakya-fab"
        onClick={() => setChanakyaOpen((prev) => !prev)}
      >
        <svg
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      </button>
    </DashboardLayout>
  );
};

export default Clubs;