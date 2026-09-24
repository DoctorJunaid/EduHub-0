import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import "./FullPageFormShell.css";

export default function FullPageFormShell({
  title,
  subtitle,
  parentName,
  icon,
  onBack,
  children,
  maxWidth = 1000,
  className = "",
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className={`full-page-activity ${className}`.trim()}>
      <div className="activity-container" style={{ maxWidth: `${maxWidth}px` }}>
        {/* Top Header & Breadcrumbs */}
        <div className="activity-header">
          <button
            type="button"
            className="activity-back-btn"
            onClick={onBack}
            title={`Back to ${parentName}`}
          >
            <ArrowLeft size={16} />
            <span>Back to {parentName}</span>
          </button>

          <div className="activity-breadcrumbs">
            <span className="activity-breadcrumb-link" onClick={onBack}>
              Dashboard
            </span>
            <span className="activity-breadcrumb-sep">&gt;</span>
            <span className="activity-breadcrumb-link" onClick={onBack}>
              {parentName}
            </span>
            <span className="activity-breadcrumb-sep">&gt;</span>
            <span className="activity-breadcrumb-active">{title}</span>
          </div>

          <div className="activity-title-row">
            {icon && <div className="activity-icon-box">{icon}</div>}
            <div>
              <h1 className="activity-title">{title}</h1>
              {subtitle && <p className="activity-desc">{subtitle}</p>}
            </div>
          </div>
        </div>

        {/* Main Content Area Card */}
        <div className="activity-content-card">
          {children}
        </div>
      </div>
    </div>
  );
}
