import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../shared/DashboardLayout";
import { authFetch } from "../../../utils/auth";
import "./ResetPassword.css";

const ResetPassword = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [show, setShow] = useState({
    old: false,
    next: false,
    confirm: false,
  });

  const [form, setForm] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [status, setStatus] = useState({
    type: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await authFetch("/me");
      setProfile(data);
    } catch {
      setProfile({
        name: localStorage.getItem("user_name") || "User",
        role: localStorage.getItem("role") || "student",
      });
    }
  };

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submitPassword = async (e) => {
    e.preventDefault();

    if (form.new_password !== form.confirm_password) {
      setStatus({
        type: "error",
        message: "New passwords do not match.",
      });
      return;
    }

    if (form.new_password.length < 4) {
      setStatus({
        type: "error",
        message: "Password is too short.",
      });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: "", message: "" });

      const response = await authFetch("/change-password", {
        method: "POST",
        body: JSON.stringify({
          old_password: form.old_password,
          new_password: form.new_password,
        }),
      });

      if (response?.status === "success") {
        setStatus({
          type: "success",
          message: "Password changed successfully!",
        });

        setForm({
          old_password: "",
          new_password: "",
          confirm_password: "",
        });

        setTimeout(() => {
          if (profile?.role === "professor") {
            navigate("/profile-prof");
          } else {
            navigate("/profile");
          }
        }, 1200);

        return;
      }

      throw new Error(response?.detail || "Failed to update password");
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Incorrect old password or server error.",
      });
    } finally {
      setLoading(false);
    }
  };

  const EyeButton = ({ field }) => (
    <button
      type="button"
      className="reset-toggle-password"
      onClick={() =>
        setShow((prev) => ({
          ...prev,
          [field]: !prev[field],
        }))
      }
    >
      <i className={show[field] ? "fa-regular fa-eye-slash" : "fa-regular fa-eye"}></i>
    </button>
  );

  return (
    <DashboardLayout activePage="Reset Password">
      <div className="reset-container">
        <div className="reset-security-card">
          <div className="reset-card-header">
            <h2 className="reset-card-title font-royal">Security Settings</h2>

            {profile?.name && (
              <h3 className="reset-user-name font-royal">
                {profile.name}
              </h3>
            )}

            <p className="reset-card-subtitle">
              Secure your account within the archives.
            </p>
          </div>

          <form onSubmit={submitPassword}>
            <div className="reset-form-group">
              <label className="reset-form-label">Current Password</label>

              <div className="reset-input-wrapper">
                <input
                  type={show.old ? "text" : "password"}
                  className="reset-form-input"
                  placeholder="Enter current password"
                  value={form.old_password}
                  onChange={(e) => updateField("old_password", e.target.value)}
                  required
                />

                <EyeButton field="old" />
              </div>
            </div>

            <div className="reset-form-group">
              <label className="reset-form-label">New Password</label>

              <div className="reset-input-wrapper">
                <input
                  type={show.next ? "text" : "password"}
                  className="reset-form-input"
                  placeholder="Enter new password"
                  value={form.new_password}
                  onChange={(e) => updateField("new_password", e.target.value)}
                  required
                />

                <EyeButton field="next" />
              </div>

              <ul className="reset-rules-list">
                <li>
                  <i className="fa-solid fa-circle"></i>
                  Use a strong, unique password.
                </li>
              </ul>
            </div>

            <div className="reset-form-group">
              <label className="reset-form-label">Confirm New Password</label>

              <div className="reset-input-wrapper">
                <input
                  type={show.confirm ? "text" : "password"}
                  className="reset-form-input"
                  placeholder="Re-enter new password"
                  value={form.confirm_password}
                  onChange={(e) => updateField("confirm_password", e.target.value)}
                  required
                />

                <EyeButton field="confirm" />
              </div>
            </div>

            {status.message && (
              <div className={`reset-status-message reset-status-${status.type}`}>
                {status.message}
              </div>
            )}

            <button type="submit" className="reset-submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  Processing...
                </>
              ) : (
                <>
                  <span>Update Credentials</span>
                  <i className="fa-solid fa-key"></i>
                </>
              )}
            </button>
          </form>

          <div className="reset-return-wrap">
            <button
              className="reset-return-link"
              onClick={() =>
                navigate(profile?.role === "professor" ? "/profile-prof" : "/profile")
              }
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResetPassword;