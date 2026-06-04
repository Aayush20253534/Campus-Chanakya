import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../shared/DashboardLayout";
import { authFetch, getUserName } from "../../../utils/auth";

import ProfessorMetricsGrid from "./ProfessorMetricsGrid";
import ProfessorAssignmentsPreview from "./ProfessorAssignmentsPreview";
import ProfessorSchedulePreview from "./ProfessorSchedulePreview";
import ProfessorAnnouncementsPreview from "./ProfessorAnnouncementsPreview";

import "./Profile.css";

const ProfessorProfile = () => {
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [professorName, setProfessorName] = useState(getUserName());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfessorDashboard();
  }, []);

  const loadProfessorDashboard = async () => {
    try {
      setLoading(true);

      const [dashboardData, assignmentsData, announcementsData] =
        await Promise.all([
          authFetch("/professor/dashboard"),
          authFetch("/professor/assignments"),
          authFetch("/announcements"),
        ]);

      setProfessorName(dashboardData?.professor_name || getUserName());

      setClasses(
        Array.isArray(dashboardData?.classes) ? dashboardData.classes : []
      );

      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setAnnouncements(
        Array.isArray(announcementsData) ? announcementsData : []
      );
    } catch (error) {
      console.error("Professor Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const uniqueCourses = useMemo(() => {
    return new Set(classes.map((item) => item.subject)).size;
  }, [classes]);

  return (
    <DashboardLayout activePage="Dashboard">
      <div className="profile-container">
        <section className="profile-title-section">
          <div className="profile-title-decoration">
            <svg
              className="profile-scroll-icon"
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

            <h1 className="profile-page-title font-royal">
              Professor Dashboard
            </h1>

            <svg
              className="profile-scroll-icon"
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

          <p className="profile-page-subtitle">
            Welcome back, {professorName || "Professor"}
          </p>
        </section>

        {loading ? (
          <div className="profile-loading">Loading dashboard...</div>
        ) : (
          <>
            <ProfessorMetricsGrid
              activeCourses={uniqueCourses}
              weeklyClasses={classes.length}
              assignmentsCreated={assignments.length}
              campusNotices={announcements.length}
            />

            <div className="profile-portal-grid">
              <div>
                <ProfessorAssignmentsPreview assignments={assignments} />
                <ProfessorSchedulePreview classes={classes} />
              </div>

              <div>
                <ProfessorAnnouncementsPreview
                  announcements={announcements}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfessorProfile;