import { useNavigate, Link } from "react-router-dom";
import { SearchX, ArrowLeft, Home } from "lucide-react";
import "./NotFound.css";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-card">
        <div className="not-found-badge">404 Error</div>
        <div className="not-found-icon-wrap">
          <SearchX size={44} strokeWidth={1.8} />
        </div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-desc">
          The page you are looking for might have been removed, renamed, or is temporarily unavailable.
        </p>
        <div className="not-found-actions">
          <button
            type="button"
            className="not-found-btn secondary"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={16} />
            <span>Go Back</span>
          </button>
          <Link to="/" className="not-found-btn primary">
            <Home size={16} />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
