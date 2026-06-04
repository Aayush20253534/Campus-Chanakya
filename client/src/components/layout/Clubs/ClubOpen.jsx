import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import DashboardLayout from "../shared/DashboardLayout";
import { authFetch } from "../../../utils/auth";

import "./ClubOpen.css";

import { API_BASE_URL } from "../../../utils/api";

const SERVER_URL = API_BASE_URL;

const getIconForClub = (club) => {
  if (club.icon) return club.icon;

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
    return `club-open-banner-${cat}`;
  }

  return "club-open-banner-default";
};

const ClubOpen = () => {
  const [searchParams] = useSearchParams();
  const clubId = searchParams.get("id");

  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState(false);

  useEffect(() => {
    fetchClubDetails();
  }, [clubId]);

  const fetchClubDetails = async () => {
    if (!clubId) {
      setLoading(false);
      setErrorState(true);
      return;
    }

    try {
      setLoading(true);
      setErrorState(false);

      const allClubs = await authFetch("/clubs");

      if (!Array.isArray(allClubs)) {
        setErrorState(true);
        return;
      }

      const foundClub = allClubs.find((item) => String(item.id) === String(clubId));

      if (!foundClub) {
        setErrorState(true);
        return;
      }

      setClub(foundClub);
    } catch (error) {
      console.error("Error loading club details:", error);
      setErrorState(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout activePage="Clubs & Committees">
        <div className="club-open-container">
          <div className="club-open-loading">
            <h2>Loading Channel...</h2>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (errorState || !club) {
    return (
      <DashboardLayout activePage="Clubs & Committees">
        <div className="club-open-container">
          <div className="club-open-loading">
            <h2>Club not found.</h2>
            <Link to="/clubs" className="club-open-back-link">
              Return to list
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const coordinators = Array.isArray(club.coordinators) ? club.coordinators : [];
  const coordinatorName = coordinators.length > 0 ? coordinators[0].name : "N/A";

  const isHiring = Boolean(club.recruitment_status?.is_hiring);
  const applyLink = club.recruitment_status?.apply_link;
  const roles = Array.isArray(club.recruitment_status?.roles_open)
    ? club.recruitment_status.roles_open
    : [];

  const bannerStyle = club.banner_image
    ? { backgroundImage: `url("${SERVER_URL}${club.banner_image}")` }
    : undefined;

  const logoUrl = club.logo_url ? `${SERVER_URL}${club.logo_url}` : null;

  return (
    <DashboardLayout activePage="Clubs & Committees">
      <div className="club-open-container">
        <Link to="/clubs" className="club-open-top-back">
          ← Back to Clubs
        </Link>

        <section className="club-open-channel-header">
          <div
            className={`club-open-channel-banner ${
              club.banner_image ? "" : getBannerClass(club.category)
            }`}
            style={bannerStyle}
          ></div>

          <div className="club-open-channel-meta-bar">
            <div className="club-open-channel-avatar">
              {logoUrl ? (
                <img src={logoUrl} alt={club.name} />
              ) : (
                <span>{getIconForClub(club)}</span>
              )}
            </div>

            <div className="club-open-channel-info">
              <h1 className="club-open-channel-name font-royal">
                {club.name}
              </h1>

              <div className="club-open-channel-stats">
                <span>{club.category || "General"}</span>
                <span>•</span>
                <span>{club.member_count || 0} Members</span>
              </div>

              <p className="club-open-short-desc">
                {club.short_description || ""}
              </p>
            </div>

            <div className="club-open-action-area">
              {isHiring ? (
                <a
                  href={applyLink || "#"}
                  target={applyLink ? "_blank" : undefined}
                  rel={applyLink ? "noreferrer" : undefined}
                  className="club-open-join-btn"
                >
                  Apply Now
                </a>
              ) : (
                <span className="club-open-join-btn disabled">
                  Membership Closed
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="club-open-content-layout">
          <div className="club-open-main-column">
            <div className="club-open-content-card">
              <h3 className="club-open-section-header">About</h3>

              <div className="club-open-description-text">
                {club.full_description || "No description provided."}
              </div>
            </div>
          </div>

          <aside className="club-open-side-column">
            <div className="club-open-content-card">
              <h3 className="club-open-section-header">Info</h3>

              <div className="club-open-info-row">
                <span className="club-open-info-label">Coordinator</span>
                <span className="club-open-info-value">{coordinatorName}</span>
              </div>

              <div className="club-open-info-row">
                <span className="club-open-info-label">Contact</span>
                <span className="club-open-info-value">
                  Contact Coordinator
                </span>
              </div>

              <div className="club-open-info-row">
                <span className="club-open-info-label">Status</span>
                <span
                  className={`club-open-info-value ${
                    isHiring ? "hiring" : "closed"
                  }`}
                >
                  {isHiring ? "Hiring" : "Closed"}
                </span>
              </div>

              <div className="club-open-tags-block">
                <h4>Tags</h4>

                <div className="club-open-tags-container">
                  {(club.tags || []).map((tag) => (
                    <span className="club-open-tag-pill" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="club-open-content-card">
              <h3 className="club-open-section-header">Open Roles</h3>

              {isHiring ? (
                roles.length > 0 ? (
                  <ul className="club-open-roles-list">
                    {roles.map((role) => (
                      <li className="club-open-role-item" key={role}>
                        {role}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="club-open-muted">
                    Application open for general members.
                  </p>
                )
              ) : (
                <p className="club-open-muted">
                  No active recruitment drives.
                </p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default ClubOpen;