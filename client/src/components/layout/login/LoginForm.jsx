import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_ROOT } from "../../../utils/api";

const API_LOGIN_URL = `${API_ROOT}/login`;

const LoginForm = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [buttonText, setButtonText] = useState("Initialize Portal");
  const [buttonBg, setButtonBg]     = useState("");
  const [disabled, setDisabled]     = useState(false);
  const [shake, setShake]           = useState(false);

  const triggerShake = () => {
    setShake(false);
    setTimeout(() => setShake(true),  10);
    setTimeout(() => setShake(false), 500);
  };

  const normalizeRole = (role) => {
    const r = String(role || "").toLowerCase().trim();
    if (r === "teacher" || r === "faculty") return "professor";
    if (r === "administrator")              return "admin";
    return r;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setButtonText("VERIFYING...");
    setDisabled(true);
    setButtonBg("");

    const form     = e.currentTarget;
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

      if (!response.ok)       throw new Error(data.detail || "Unauthorized");
      if (!data.access_token) throw new Error("Missing access token");

      const role = normalizeRole(data.role);
      if (!role)              throw new Error("Missing user role");

      // FIX: set ALL values before navigating — never clear() first
      // (clear() between set calls can cause role-guard to read empty role)
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role",         role);
      localStorage.setItem(
        "user_name",
        data.name             ||
        data.student_name     ||
        data.teacher_name     ||
        data.professor_name   ||
        data.admin_name       ||
        username              ||
        "Scholar"
      );

      if (role === "student") {
        localStorage.setItem("user_year",    data.year    || "");
        localStorage.setItem("user_section", data.section || "");
        if (data.is_first_login) {
          alert("Security Notice: Please update your default password.");
          localStorage.setItem("force_password_change", "true");
        }
      }

      setButtonText("ACCESS GRANTED");
      setButtonBg("#22c55e");

      // FIX: navigate immediately — no setTimeout — role is in localStorage now
      if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/profile", { replace: true });
      }

    } catch (error) {
      console.error("Login failed:", error);

      // Only clear the token — keep nothing stale
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");

      setButtonText("ACCESS DENIED");
      setButtonBg("var(--login-accent)");
      setDisabled(false);
      triggerShake();

      setTimeout(() => {
        setButtonText("Initialize Portal");
        setButtonBg("");
      }, 1500);
    }
  };

  return (
    <>
      <form
        id="authForm"
        onSubmit={handleSubmit}
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
              <i className={showPassword ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"} />
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

      <div className="footer-links">
        <p><a href="#">Forgot id?</a></p>
      </div>
    </>
  );
};

export default LoginForm;