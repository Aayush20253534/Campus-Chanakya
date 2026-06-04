import { Navigate } from "react-router-dom";

// Protects student/professor routes.
// - Unauthenticated users → login page
// - Admin users → their own dashboard (admin has no business on student pages,
//   and those API endpoints return nothing useful for the admin role anyway)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("access_token");
  const role = (localStorage.getItem("role") || "").toLowerCase().trim();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;