import { useEffect, useState } from "react";

import DashboardLayout from "../shared/DashboardLayout";
import MetricsGrid from "./MetricsGrid";
import AssignmentsPreview from "./AssignmentsPreview";
import SchedulePreview from "./SchedulePreview";
import AnnouncementsPreview from "./AnnouncementsPreview";

import { authFetch, getUserName } from "../../../utils/auth";

import "./Profile.css";

const StudentProfile = () => {
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [stats, setStats] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const userName = getUserName();

  useEffect(() => {
    refreshDashboard();
  }, []);

  const refreshDashboard = async () => {
    try {
      setLoading(true);

      const [
        assignmentsData,
        timetableData,
        statsData,
        announcementsData,
        results,
      ] = await Promise.all([
        authFetch("/student/assignments"),
        authFetch("/attendance/timetable"),
        authFetch("/attendance/stats"),
        authFetch("/announcements"),
        authFetch("/student/results"),
      ]);

      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setTimetable(Array.isArray(timetableData) ? timetableData : []);
      setStats(Array.isArray(statsData) ? statsData : []);
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
      setResultsData(results || null);
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout activePage="Dashboard">
      <div className="profile-container">
        <section className="profile-title-section">
          <div className="profile-title-decoration">
            <svg className="profile-scroll-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>

            <h1 className="profile-page-title font-royal">
              Student Dashboard
            </h1>

            <svg className="profile-scroll-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </div>

          <p className="profile-page-subtitle">
            Welcome back, {userName}
          </p>
        </section>

        {loading ? (
          <div className="profile-loading">Loading dashboard...</div>
        ) : (
          <>
            <MetricsGrid
              stats={stats}
              assignments={assignments}
              resultsData={resultsData}
            />

            <div className="profile-portal-grid">
              <div>
                <AssignmentsPreview assignments={assignments} />
                <SchedulePreview timetable={timetable} />
              </div>

              <div>
                <AnnouncementsPreview announcements={announcements} />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentProfile;