import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import "./SetPassword.css";

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isMinLength = password.length >= 6;
  const isMatching = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Invalid or missing token.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post("/auth/set-password", { token, password });
      setSuccess(true);
      toast.success("Password set successfully!");
      setTimeout(() => {
        navigate("/login");
      }, 2200);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to set password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="set-password-container">
      <div className="set-password-card">
        {/* Brand header */}
        <div className="sp-brand-header">
          <div className="sp-brand-icon">
            <ShieldCheck size={20} strokeWidth={2.2} />
          </div>
          <span className="sp-brand-title">EduHub</span>
        </div>

        {success ? (
          <div className="set-password-success">
            <div className="sp-success-icon-wrap">
              <CheckCircle2 size={36} strokeWidth={2.2} />
            </div>
            <h2>Password Set Successfully</h2>
            <p>Your administrator password has been set. Redirecting you to login...</p>
            <button
              type="button"
              className="sp-btn-primary sp-btn-full"
              onClick={() => navigate("/login")}
            >
              <span>Go to Login</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : !token ? (
          <div className="sp-invalid-token">
            <div className="sp-token-error-icon">
              <AlertCircle size={36} strokeWidth={2} />
            </div>
            <h2>Invalid or Expired Link</h2>
            <p>This password setup link is missing or has expired. Please contact your system administrator or request a new invitation.</p>
            <Link to="/login" className="sp-btn-primary sp-btn-full sp-link-btn">
              <span>Return to Login</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="sp-header-text">
              <h2>Set Your Password</h2>
              <p>Welcome! Please create a secure password for your administrator account.</p>
            </div>

            <form onSubmit={handleSubmit} className="sp-form">
              <div className="form-group sp-field">
                <label htmlFor="new-password">New Password</label>
                <div className="sp-input-wrapper">
                  <span className="sp-input-icon">
                    <Lock size={15} />
                  </span>
                  <input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="sp-toggle-pwd"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="form-group sp-field">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="sp-input-wrapper">
                  <span className="sp-input-icon">
                    <Lock size={15} />
                  </span>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="sp-toggle-pwd"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Requirement indicators */}
              {password.length > 0 && (
                <div className="sp-hints">
                  <div className={`sp-hint-item ${isMinLength ? "valid" : ""}`}>
                    <span className="sp-hint-bullet" />
                    <span>At least 6 characters</span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className={`sp-hint-item ${isMatching ? "valid" : ""}`}>
                      <span className="sp-hint-bullet" />
                      <span>Passwords match</span>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="sp-btn-primary sp-btn-full"
                disabled={loading || (password.length > 0 && !isMinLength)}
              >
                {loading ? (
                  <span className="sp-btn-loading">
                    <span className="sp-spinner" />
                    <span>Setting Password...</span>
                  </span>
                ) : (
                  <span>Set Password</span>
                )}
              </button>
            </form>

            <div className="sp-card-footer">
              <Link to="/login" className="sp-back-link">
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
