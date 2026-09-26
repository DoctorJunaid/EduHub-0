/**
 * EduHub Dynamic URL Configuration for Management App
 * Connects frontend to the public Landing Page dynamically.
 */

export const LANDING_PAGE_PRODUCTION_URL = "https://edu-hub-0.vercel.app";
export const LANDING_PAGE_LOCAL_URL = "http://localhost:5174";

/**
 * Returns the base URL for the EduHub Landing Page.
 */
export const getLandingPageUrl = () => {
  if (import.meta.env.VITE_LANDING_URL) {
    return import.meta.env.VITE_LANDING_URL.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return LANDING_PAGE_LOCAL_URL;
    }
  }

  return LANDING_PAGE_PRODUCTION_URL;
};

/**
 * Helper to navigate to the Landing Page.
 * @param {string} path - Optional subpath e.g. '/' or '/#institutes'
 * @param {boolean} newTab - Whether to open in a new tab
 */
export const navigateToLanding = (path = "/", newTab = false) => {
  const baseUrl = getLandingPageUrl();
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
