import { useState } from "react";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import AdminFloatingEmbers from "./AdminFloatingEmbers";
import "./AdminShared.css";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout">
      <AdminFloatingEmbers />

      <AdminNavbar onMenuClick={() => setSidebarOpen(true)} />

      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="admin-main-content">{children}</main>
    </div>
  );
};

export default AdminLayout;