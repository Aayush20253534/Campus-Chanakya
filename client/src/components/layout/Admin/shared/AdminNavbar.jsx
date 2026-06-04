import { useNavigate } from "react-router-dom";

const AdminNavbar = ({ onMenuClick }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <nav className="admin-navbar">
      <div className="admin-navbar-border"></div>

      <div className="admin-navbar-content">
        <div className="admin-nav-left">
          <button className="admin-menu-button" onClick={onMenuClick}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="admin-brand">
            <svg className="admin-crown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 3l1.5 9h11L19 3M12 3v9m-7 9h14a2 2 0 002-2v-1a2 2 0 00-2-2H5a2 2 0 00-2 2v1a2 2 0 002 2z"
              />
            </svg>

            <h1 className="admin-nav-title">CAMPUS CHANAKYA</h1>
          </div>
        </div>

        <div className="admin-nav-right">
          <span className="admin-user-greeting">Welcome, System Administrator</span>

          <button className="admin-nav-button" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i> Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;