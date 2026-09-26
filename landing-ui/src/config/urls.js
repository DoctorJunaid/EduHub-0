/**
 * EduHub Environment & Dynamic URL Configuration
 * Resolves Management App and Landing Page URLs seamlessly between
 * local development and production deployments.
 */

export const MANAGEMENT_APP_PRODUCTION_URL =
  "https://edu-hub0-frontend.vercel.app";
export const MANAGEMENT_APP_LOCAL_URL = "http://localhost:5173";

export const LANDING_PAGE_PRODUCTION_URL = "https://edu-hub-0.vercel.app";
export const LANDING_PAGE_LOCAL_URL = "http://localhost:5174";

/**
 * Returns the base URL for the EduHub Management System (frontend).
 */
export const getManagementAppUrl = () => {
  if (import.meta.env.VITE_APP_URL) {
    return import.meta.env.VITE_APP_URL.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return MANAGEMENT_APP_LOCAL_URL;
    }
  }

  return MANAGEMENT_APP_PRODUCTION_URL;
};

/**
 * Returns the URL to the Management System login page.
 */
export const getManagementLoginUrl = () => {
  return `${getManagementAppUrl()}/login`;
};

/**
 * Returns the URL to the Management System dashboard.
 */
export const getManagementDashboardUrl = () => {
  return `${getManagementAppUrl()}/dashboard`;
};

/**
 * Returns the URL to the Management System signup page.
 */
export const getManagementSignupUrl = () => {
  return `${getManagementAppUrl()}/signup`;
};

/**
 * Helper to navigate to the Management System.
 * Supports both same-page redirection and opening in a new tab.
 *
 * @param {string} path - Target path e.g. '/login' or '/dashboard'
 * @param {boolean} newTab - Whether to open in a new tab
 */
export const navigateToManagement = (path = "/login", newTab = false) => {
  const baseUrl = getManagementAppUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const targetUrl = `${baseUrl}${normalizedPath}`;

  if (typeof window !== "undefined") {
    if (newTab) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = targetUrl;
    }
  }
};
