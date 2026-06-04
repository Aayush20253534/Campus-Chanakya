import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import DashboardFloatingEmbers from "./DashboardFloatingEmbers";
import "./layout.css";

const DashboardLayout = ({ children, activePage = "Announcements" }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <section className="dashboard-page">
      <DashboardFloatingEmbers />

      <Navbar setSidebarOpen={setSidebarOpen} />

      <div
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      <Sidebar activePage={activePage} sidebarOpen={sidebarOpen} />

      <main className="main-content">{children}</main>
    </section>
  );
};

export default DashboardLayout;