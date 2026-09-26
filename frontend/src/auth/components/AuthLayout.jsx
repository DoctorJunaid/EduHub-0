import {
  ArrowLeftRight,
  CalendarPlus,
  Send,
  UserRound,
  Users,
} from "lucide-react";
import { getLandingPageUrl } from "@/config/urls";
import "../Signup.css";

const benefits = [
  [
    Users,
    "Smart & Simple",
    "Manage schedules, users, and access in one place.",
  ],
  [
    ArrowLeftRight,
    "Switch with ease",
    "Move between schools and organizations instantly.",
  ],
  [
    CalendarPlus,
    "Always in sync",
    "Timetable updates are centralized and easy to review.",
  ],
];
const features = [
  [CalendarPlus, "Timetables", "Built to reduce delays"],
  [UserRound, "Teachers", "Track workload clearly"],
  [Users, "Students", "Keep schedules visible"],
];

export default function AuthLayout({
  children,
  title,
  eyebrow,
  subtitle,
  login = false,
}) {
  return (
    <main className={`signup-page${login ? " auth-login" : ""}`}>
      <div className="signup-shell">
        <aside className="signup-promo" aria-label="About EduHub">
          <a
            href={getLandingPageUrl()}
            className="signup-brand"
            title="Return to EduHub Homepage"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <img
              src={`${import.meta.env.BASE_URL}brand/eduhub-logo.png`}
              alt=""
            />
            <span>EduHub</span>
          </a>
          <div className="signup-promo-intro">
            <p className="signup-eyebrow">
              <span />
              ONE CONNECTED PLACE
            </p>
            <h2>
              Education works
              <br />
              better together.
            </h2>
            <p>
              {login ? (
                "Sign in to your EduHub workspace and stay connected with your learning ecosystem."
              ) : (
                <>
                  Sign up for your EduHub workspace and be part of
                  <br className="signup-desktop-break" /> a smarter, more
                  connected learning ecosystem.
                </>
              )}
            </p>
          </div>
          <div className="signup-benefits">
            {benefits.map(([Icon, title, description]) => (
              <div className="signup-benefit" key={title}>
                <span className="signup-benefit-icon">
                  <Icon size={29} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="signup-feature-strip">
            {features.map(([Icon, title, description]) => (
              <div key={title}>
                <Icon size={29} />
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="signup-promo-footer">
            <span>
              Building a<br />
              smarter tomorrow
            </span>
            <svg viewBox="0 0 220 60" aria-hidden="true">
              <path
                d="M2 20 C60 -25 70 100 155 40 L197 10"
                fill="none"
                stroke="currentColor"
                strokeDasharray="5 5"
                strokeWidth="1.5"
              />
            </svg>
            <Send size={28} aria-hidden="true" />
          </div>
        </aside>
        <section className="signup-form-panel" aria-labelledby="auth-title">
          <header>
            <p className="signup-eyebrow">{eyebrow}</p>
            <h1 id="auth-title">{title}</h1>
            <p>{subtitle}</p>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}
