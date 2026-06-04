import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/layout/Login/Login";

import Announcement from "./components/layout/Announcement/Announcement";
import Profile from "./components/layout/Profile/Profile";
import Timetable from "./components/layout/Timetable/Timetable";
import Attendance from "./components/layout/Attendance/Attendance";
import Club from "./components/layout/Clubs/Clubs";
import ClubOpen from "./components/layout/Clubs/ClubOpen";
import Assignments from "./components/layout/Assignments/Assignments";
import Results from "./components/layout/Results/Results";
import Feed from "./components/layout/Feed/Feed";
import ResetPassword from "./components/layout/ResetPassword/ResetPassword";


import ProtectedRoute from "./components/routes/ProtectedRoute";

import AdminDashboard from "./components/layout/Admin/Dashboard/AdminDashboard";
import AdminAnnouncements from "./components/layout/Admin/Announcements/AdminAnnouncements";
import AdminStudents from "./components/layout/Admin/Students/AdminStudents";
import AdminProfessors from "./components/layout/Admin/Professors/AdminProfessors";
import AdminTimetable from "./components/layout/Admin/Timetable/AdminTimetable";
import AdminFeed from "./components/layout/Admin/Feed/AdminFeed";

const StudentOnlyRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  const role = (localStorage.getItem("role") || "").toLowerCase().trim();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role !== "student") {
    return <Navigate to="/profile" replace />;
  }

  return children;
};

const AdminOnlyRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  const role = (localStorage.getItem("role") || "").toLowerCase().trim();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />

      {/* Student / Professor */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/announcement"
        element={
          <ProtectedRoute>
            <Announcement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/timetable"
        element={
          <ProtectedRoute>
            <Timetable />
          </ProtectedRoute>
        }
      />

      <Route
        path="/attendance"
        element={
          <ProtectedRoute>
            <Attendance />
          </ProtectedRoute>
        }
      />

      <Route
        path="/assignments"
        element={
          <ProtectedRoute>
            <Assignments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/results"
        element={
          <ProtectedRoute>
            <Results />
          </ProtectedRoute>
        }
      />

      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <Feed />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reset-password"
        element={
          <ProtectedRoute>
            <ResetPassword />
          </ProtectedRoute>
        }
      />

      {/* Student Only */}
      <Route
        path="/clubs"
        element={
          <StudentOnlyRoute>
            <Club />
          </StudentOnlyRoute>
        }
      />

      <Route
        path="/club-open"
        element={
          <StudentOnlyRoute>
            <ClubOpen />
          </StudentOnlyRoute>
        }
      />

      {/* Admin */}
      <Route
        path="/admin/profile"
        element={<Navigate to="/admin/dashboard" replace />}
      />

      <Route
        path="/admin/dashboard"
        element={
          <AdminOnlyRoute>
            <AdminDashboard />
          </AdminOnlyRoute>
        }
      />

      <Route
        path="/admin/announcements"
        element={
          <AdminOnlyRoute>
            <AdminAnnouncements />
          </AdminOnlyRoute>
        }
      />

      <Route
        path="/admin/students"
        element={
          <AdminOnlyRoute>
            <AdminStudents />
          </AdminOnlyRoute>
        }
      />

      <Route
        path="/admin/professors"
        element={
          <AdminOnlyRoute>
            <AdminProfessors />
          </AdminOnlyRoute>
        }
      />

      <Route
        path="/admin/timetable"
        element={
          <AdminOnlyRoute>
            <AdminTimetable />
          </AdminOnlyRoute>
        }
      />


       <Route
        path="/admin/feed"
        element={
          <AdminOnlyRoute>
            <AdminFeed />
          </AdminOnlyRoute>
        }
      />
       

      {/* Legacy Student Routes */}
      <Route path="/home" element={<Navigate to="/announcement" replace />} />

      <Route
        path="/Announcement"
        element={<Navigate to="/announcement" replace />}
      />

      <Route
        path="/profile.html"
        element={<Navigate to="/profile" replace />}
      />

      <Route
        path="/Announcement.html"
        element={<Navigate to="/announcement" replace />}
      />

      <Route
        path="/Timetable.html"
        element={<Navigate to="/timetable" replace />}
      />

      <Route
        path="/Attendance.html"
        element={<Navigate to="/attendance" replace />}
      />

      <Route
        path="/Assignments.html"
        element={<Navigate to="/assignments" replace />}
      />

      <Route
        path="/Results.html"
        element={<Navigate to="/results" replace />}
      />

      <Route
        path="/Feed.html"
        element={<Navigate to="/feed" replace />}
      />

      <Route
        path="/ResetPassword.html"
        element={<Navigate to="/reset-password" replace />}
      />

      <Route
        path="/Clubs.html"
        element={<Navigate to="/clubs" replace />}
      />

      {/* Legacy Admin Routes */}
      <Route
        path="/admin-profile.html"
        element={<Navigate to="/admin/dashboard" replace />}
      />

      <Route
        path="/announcement-manage-portal.html"
        element={<Navigate to="/admin/announcements" replace />}
      />

      <Route
        path="/student-management-portal.html"
        element={<Navigate to="/admin/students" replace />}
      />

      
      <Route
        path="/prof-manage-portal.html"
        element={<Navigate to="/admin/professors" replace />}
      />

       <Route
        path="/timetable-manage-portal.html"
        element={<Navigate to="/admin/timetable" replace />}
      />
       

      <Route
        path="/feed-management-portal.html"
        element={<Navigate to="/admin/feed" replace />}
      />
      

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;