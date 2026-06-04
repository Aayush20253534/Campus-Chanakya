import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_ROOT } from "../../../utils/api";

const API_LOGIN_URL = `${API_ROOT}/login`;
const API_SIGNUP_URL = `${API_ROOT}/signup/student`;

const initialSignupForm = {
  reg_no: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  gender: "Male",
  dob: "",
  department: "",
  section: "A",
  year: "1",
  hostel: "Not Assigned",
};

const LoginForm = () => {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [buttonText, setButtonText] = useState("Initialize Portal");
  const [buttonBg, setButtonBg] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [shake, setShake] = useState(false);
  const [signupForm, setSignupForm] = useState(initialSignupForm);

  const isSignup = mode === "signup";

  const triggerShake = () => {
    setShake(false);
    setTimeout(() => setShake(true), 10);
    setTimeout(() => setShake(false), 500);
  };

  const normalizeRole = (role) => {
    const r = String(role || "").toLowerCase().trim();
    if (r === "teacher" || r === "faculty") return "professor";
    if (r === "administrator") return "admin";
    return r;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // FIX: Resolve the user's display name regardless of which key the backend
  // sends (student_name / professor_name / admin_name / name).
  // ─────────────────────────────────────────────────────────────────────────
  const resolveDisplayName = (data, username) => {
    return (
      data.name ||
      data.student_name ||
      data.teacher_name ||
      data.professor_name ||
      data.admin_name ||
      username ||
      "Scholar"
    );
  };

  const resetButton = () => {
    setTimeout(() => {
      setButtonText(isSignup ? "Create Student Account" : "Initialize Portal");
      setButtonBg("");
    }, 1500);
  };

  const handleSignupChange = (event) => {
    const { name, value } = event.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();

    if (signupForm.password !== signupForm.confirmPassword) {
      alert("Passwords do not match.");
      triggerShake();
      return;
    }

    setDisabled(true);
    setButtonText("CREATING...");
    setButtonBg("");

    try {
      const payload = {
        reg_no: signupForm.reg_no.trim(),
        name: signupForm.name.trim(),
        email: signupForm.email.trim().toLowerCase(),
        password: signupForm.password,
        gender: signupForm.gender,
        dob: signupForm.dob,
        department: signupForm.department.trim(),
        section: signupForm.section,
        year: Number(signupForm.year),
        hostel: signupForm.hostel?.trim() || "Not Assigned",
      };

      const response = await fetch(API_SIGNUP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail || "Signup failed");
      }

      setButtonText("ACCOUNT CREATED");
      setButtonBg("#22c55e");
      setSignupForm(initialSignupForm);

      setTimeout(() => {
        setMode("login");
        setButtonText("Initialize Portal");
        setButtonBg("");
      }, 1000);
    } catch (error) {
      console.error("Signup failed:", error);
      alert(error.message || "Signup failed.");
      setButtonText("SIGNUP FAILED");
      setButtonBg("var(--login-accent)");
      triggerShake();
      resetButton();
    } finally {
      setDisabled(false);
    }
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();

    setButtonText("VERIFYING...");
    setDisabled(true);
    setButtonBg("");

    const form = event.currentTarget;
    const username = form.username.value.trim();
    const password = form.password.value;

    const params = new URLSearchParams();
    params.append("username", username);
    params.append("password", password);

    try {
      const response = await fetch(API_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.detail || "Unauthorized");
      if (!data.access_token) throw new Error("Missing access token");

      const role = normalizeRole(data.role);
      if (!role) throw new Error("Missing user role");

      // Store auth essentials
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", role);
      localStorage.setItem("user_name", resolveDisplayName(data, username));

      if (role === "student") {
        localStorage.setItem("user_year", data.year ? String(data.year) : "");
        localStorage.setItem("user_section", data.section || "");
        // ─────────────────────────────────────────────────────────────────
        // FIX: Backend returns 'department' (aliased from 'dept') in the
        // login response, so this now always populates correctly.
        // ─────────────────────────────────────────────────────────────────
        localStorage.setItem("user_department", data.department || "");
        localStorage.setItem("user_reg_no", data.reg_no || "");
        localStorage.setItem("user_hostel", data.hostel || "Not Assigned");

        // ─────────────────────────────────────────────────────────────────
        // FIX: is_first_login is now returned by the backend.
        // ─────────────────────────────────────────────────────────────────
        if (data.is_first_login) {
          alert("Security Notice: Please update your default password.");
          localStorage.setItem("force_password_change", "true");
        } else {
          localStorage.removeItem("force_password_change");
        }
      }

      setButtonText("ACCESS GRANTED");
      setButtonBg("#22c55e");

      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/profile", { replace: true });
      }
    } catch (error) {
      console.error("Login failed:", error);

      localStorage.removeItem("access_token");
      localStorage.removeItem("role");

      setButtonText("ACCESS DENIED");
      setButtonBg("var(--login-accent)");
      setDisabled(false);
      triggerShake();
      resetButton();
    }
  };

  return (
    <>
      <div className="login-mode-switch">
        <button
          type="button"
          className={mode === "login" ? "active" : ""}
          onClick={() => {
            setMode("login");
            setButtonText("Initialize Portal");
            setButtonBg("");
          }}
        >
          Login
        </button>

        <button
          type="button"
          className={mode === "signup" ? "active" : ""}
          onClick={() => {
            setMode("signup");
            setButtonText("Create Student Account");
            setButtonBg("");
          }}
        >
          Student Signup
        </button>
      </div>

      {isSignup ? (
        <form
          id="signupForm"
          onSubmit={handleSignupSubmit}
          className={shake ? "shake" : ""}
        >
          <div className="signup-grid">
            <div className="form-group">
              <label htmlFor="reg_no">Registration No.</label>
              <input
                id="reg_no"
                name="reg_no"
                type="text"
                value={signupForm.reg_no}
                onChange={handleSignupChange}
                placeholder="e.g. 2025334"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={signupForm.name}
                onChange={handleSignupChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={signupForm.email}
                onChange={handleSignupChange}
                placeholder="student@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="signupPassword">Password</label>
              <input
                id="signupPassword"
                name="password"
                type={showPassword ? "text" : "password"}
                value={signupForm.password}
                onChange={handleSignupChange}
                placeholder="********"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={signupForm.confirmPassword}
                onChange={handleSignupChange}
                placeholder="********"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={signupForm.gender}
                onChange={handleSignupChange}
                required
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="dob">DOB</label>
              <input
                id="dob"
                name="dob"
                type="date"
                value={signupForm.dob}
                onChange={handleSignupChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                id="department"
                name="department"
                type="text"
                value={signupForm.department}
                onChange={handleSignupChange}
                placeholder="e.g. BCA"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="section">Section</label>
              <select
                id="section"
                name="section"
                value={signupForm.section}
                onChange={handleSignupChange}
                required
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="year">Year</label>
              <select
                id="year"
                name="year"
                value={signupForm.year}
                onChange={handleSignupChange}
                required
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="hostel">Hostel</label>
              <input
                id="hostel"
                name="hostel"
                type="text"
                value={signupForm.hostel}
                onChange={handleSignupChange}
                placeholder="e.g. Boys Hostel A or Not Assigned"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={disabled}
            style={{ background: buttonBg || undefined }}
          >
            {buttonText}
          </button>
        </form>
      ) : (
        <form
          id="authForm"
          onSubmit={handleLoginSubmit}
          className={shake ? "shake" : ""}
        >
          <div className="form-group">
            <label htmlFor="username">LOGIN ID</label>

            <div className="input-container">
              <input
                type="text"
                id="username"
                name="username"
                placeholder="e.g. student.2025334"
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="*********"
                required
                autoComplete="current-password"
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i
                  className={
                    showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"
                  }
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-submit"
            disabled={disabled}
            style={{ background: buttonBg || undefined }}
          >
            {buttonText}
          </button>
        </form>
      )}

      <div className="footer-links">
        <p>
          {isSignup ? (
            <button
              type="button"
              className="login-link-button"
              onClick={() => {
                setMode("login");
                setButtonText("Initialize Portal");
              }}
            >
              Already have an account? Login
            </button>
          ) : (
            <button
              type="button"
              className="login-link-button"
              onClick={() => {
                setMode("signup");
                setButtonText("Create Student Account");
              }}
            >
              New student? Create account
            </button>
          )}
        </p>
      </div>
    </>
  );
};

export default LoginForm;