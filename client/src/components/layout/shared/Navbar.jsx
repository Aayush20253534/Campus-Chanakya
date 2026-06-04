import { logout, getUserName } from "../../../utils/auth";

const Navbar = ({ setSidebarOpen }) => {
  const userName = getUserName();

  return (
    <nav className="navbar">
      <div className="navbar-border"></div>

      <div className="navbar-content">
        <div className="nav-left">
          <button
            className="menu-button"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <div className="brand-box">
            <svg className="crown-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 3l1.5 9h11L19 3M12 3v9m-7 9h14a2 2 0 002-2v-1a2 2 0 00-2-2H5a2 2 0 00-2 2v1a2 2 0 002 2z"
              />
            </svg>
            <h1 className="nav-title">Campus Chanakya</h1>
          </div>
        </div>

        <div className="nav-user-name">Welcome, {userName}</div>

        <div className="nav-right">
          <button className="nav-button" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;