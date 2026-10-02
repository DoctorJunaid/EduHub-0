import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Search,
  X,
  Building2,
  Users,
  MapPin,
  GraduationCap,
  BookOpen,
  CreditCard,
  Inbox,
  Bell,
  LifeBuoy,
  Settings,
  ArrowRight,
  Clock,
  Trash2,
  CheckCircle2,
  Book,
  Calendar,
  Award,
  Sparkles,
  LayoutDashboard,
  PlusCircle,
  FileText,
  DollarSign,
  UserCheck,
  Edit3,
} from "lucide-react";
import axiosInstance from "@/api/axiosInstance";
import "./GlobalSearchBar.css";

const RECENT_SEARCHES_KEY = "eduHubRecentGlobalSearches";

// Map string icon names to Lucide icon components
const ICON_MAP = {
  building: Building2,
  "map-pin": MapPin,
  user: Users,
  "user-check": UserCheck,
  "graduation-cap": GraduationCap,
  "book-open": BookOpen,
  book: Book,
  "credit-card": CreditCard,
  inbox: Inbox,
  bell: Bell,
  "life-buoy": LifeBuoy,
  settings: Settings,
  "layout-dashboard": LayoutDashboard,
  "plus-circle": PlusCircle,
  "file-text": FileText,
  "dollar-sign": DollarSign,
  calendar: Calendar,
  award: Award,
  "edit-3": Edit3,
  "check-circle": CheckCircle2,
};

const STATIC_NAV_LINKS = [
  { title: "Super Admin Dashboard", subtitle: "Master overview & system metrics", url: "/super-admin", icon: "layout-dashboard", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Institutes Directory", subtitle: "View and manage registered institutions", url: "/institutes", icon: "building", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "+ Add New Institute", subtitle: "Onboard a new educational network", url: "/institutes/new", icon: "plus-circle", category: "navigation", categoryLabel: "Quick Actions" },
  { title: "SaaS Plans & Pricing", subtitle: "Subscription packages and quotas", url: "/super-admin/plans", icon: "credit-card", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Active Subscriptions", subtitle: "Institution billing and licenses", url: "/super-admin/subscriptions", icon: "file-text", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Global Users Directory", subtitle: "User accounts, roles and status", url: "/super-admin/users", icon: "users", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Inquiries & Leads", subtitle: "Prospective institute requests", url: "/super-admin/inquiries", icon: "inbox", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Broadcast Alerts", subtitle: "Platform notices & announcements", url: "/super-admin/broadcasts", icon: "bell", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Campus Overview", subtitle: "Campus operations and daily metrics", url: "/dashboard", icon: "layout-dashboard", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Faculty Directory", subtitle: "Teachers and academic staff", url: "/faculty", icon: "users", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Students Directory", subtitle: "Admissions, roll numbers and records", url: "/students", icon: "graduation-cap", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Class Timetable", subtitle: "Periods, scheduling and rooms", url: "/timetable", icon: "calendar", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Academic Settings", subtitle: "Classes, sections and subjects", url: "/academics", icon: "book-open", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Fee Management", subtitle: "Challans and collections", url: "/fees", icon: "credit-card", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Teacher Assignments", subtitle: "Map teachers to classes", url: "/teacher-assignments", icon: "user-check", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Examinations & Schedules", subtitle: "Exams and date sheets", url: "/exams", icon: "file-text", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Help & Support", subtitle: "Tickets and help desk", url: "/support", icon: "life-buoy", category: "navigation", categoryLabel: "Pages & Navigation" },
  { title: "Settings", subtitle: "System and profile preferences", url: "/settings", icon: "settings", category: "navigation", categoryLabel: "Pages & Navigation" },
];

export default function GlobalSearchBar({
  placeholder = "Search students, teachers, classes, subjects...",
  userRole = "super_admin",
  onSearchSubmit,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const resultsListRef = useRef(null);

  // Read current loaded data from Redux store for instant sub-millisecond local search
  const institutesStore = useSelector((state) => state.institutes?.records || []);
  const campusesStore = useSelector((state) => state.campuses?.records || []);
  const facultyStore = useSelector((state) => state.faculty?.records || []);
  const studentsStore = useSelector((state) => state.students?.records || []);

  const [query, setQuery] = useState(() => {
    return localStorage.getItem("eduHubSuperSearch") || "";
  });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiCategories, setApiCategories] = useState({});
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const saveRecentSearch = (searchTerm) => {
    if (!searchTerm || !searchTerm.trim()) return;
    const clean = searchTerm.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 6);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentSearch = (e, item) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== item);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Handle global ⌘K or Ctrl+K shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Close when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Input Change and broadcast to live tables immediately
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (!isOpen) setIsOpen(true);

    // Live broadcast to current page table (e.g. SuperAdminDashboard, StudentsDirectory)
    window.dispatchEvent(
      new CustomEvent("eduHubSuperSearch", {
        detail: { query: val },
      })
    );
    localStorage.setItem("eduHubSuperSearch", val);
    if (onSearchSubmit) onSearchSubmit(val);
  };

  // Instant local search computation from memory / Redux
  const localCategories = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return {
        navigation: STATIC_NAV_LINKS.slice(0, 8),
      };
    }

    const matchedInstitutes = institutesStore
      .filter(
        (inst) =>
          (inst.name || "").toLowerCase().includes(trimmed) ||
          (inst.type || "").toLowerCase().includes(trimmed) ||
          (inst.board || "").toLowerCase().includes(trimmed) ||
          (inst.email || "").toLowerCase().includes(trimmed) ||
          (inst.address?.city || "").toLowerCase().includes(trimmed)
      )
      .slice(0, 6)
      .map((inst) => ({
        id: inst._id || inst.id,
        title: inst.name,
        subtitle: `${inst.type || "Institute"} • ${inst.board || "Board"} ${inst.address?.city ? "• " + inst.address.city : ""}`,
        url: `/institutes/${inst._id || inst.id}`,
        badge: inst.status || "Active",
        badgeType: inst.status === "Active" ? "success" : "default",
        category: "institutes",
        categoryLabel: "Institutes",
        icon: "building",
      }));

    const matchedCampuses = campusesStore
      .filter(
        (c) =>
          (c.name || "").toLowerCase().includes(trimmed) ||
          (c.location || "").toLowerCase().includes(trimmed) ||
          (c.email || "").toLowerCase().includes(trimmed)
      )
      .slice(0, 5)
      .map((c) => ({
        id: c._id || c.id,
        title: c.name,
        subtitle: `${c.location ? c.location + " • " : ""}Campus`,
        url: `/dashboard`,
        badge: c.status || "Active",
        badgeType: c.status === "Active" ? "success" : "default",
        category: "campuses",
        categoryLabel: "Campuses",
        icon: "map-pin",
      }));

    const matchedFaculty = facultyStore
      .filter(
        (f) =>
          (f.name || "").toLowerCase().includes(trimmed) ||
          (f.email || "").toLowerCase().includes(trimmed) ||
          (f.department || "").toLowerCase().includes(trimmed) ||
          (f.designation || "").toLowerCase().includes(trimmed)
      )
      .slice(0, 5)
      .map((f) => ({
        id: f._id || f.id || f.userId,
        title: f.name,
        subtitle: `Teacher • ${f.designation || "Faculty"} ${f.department ? "• " + f.department : ""}`,
        url: `/faculty/${f._id || f.id || f.userId}`,
        badge: "Faculty",
        badgeType: "primary",
        category: "users",
        categoryLabel: "Faculty & Teachers",
        icon: "user-check",
      }));

    const matchedStudents = studentsStore
      .filter(
        (s) =>
          (s.name || "").toLowerCase().includes(trimmed) ||
          (s.roll || s.rollNo || "").toLowerCase().includes(trimmed) ||
          (s.grade || s.gradeOrClass || "").toLowerCase().includes(trimmed) ||
          (s.email || "").toLowerCase().includes(trimmed)
      )
      .slice(0, 5)
      .map((s) => ({
        id: s._id || s.id,
        title: s.name,
        subtitle: `Student ${s.roll ? "• Roll: " + s.roll : ""} ${s.grade || s.gradeOrClass ? "• Class " + (s.grade || s.gradeOrClass) : ""}`,
        url: `/students`,
        badge: "Student",
        badgeType: "info",
        category: "users",
        categoryLabel: "Students",
        icon: "graduation-cap",
      }));

    const matchedNav = STATIC_NAV_LINKS.filter(
      (n) =>
        n.title.toLowerCase().includes(trimmed) ||
        n.subtitle.toLowerCase().includes(trimmed)
    ).slice(0, 5);

    const result = {};
    if (matchedInstitutes.length > 0) result.institutes = matchedInstitutes;
    if (matchedCampuses.length > 0) result.campuses = matchedCampuses;
    const usersCombined = [...matchedFaculty, ...matchedStudents].slice(0, 8);
    if (usersCombined.length > 0) result.users = usersCombined;
    if (matchedNav.length > 0) result.navigation = matchedNav;

    return result;
  }, [query, institutesStore, campusesStore, facultyStore, studentsStore]);

  // Debounced API search to fetch deep database results
  useEffect(() => {
    const trimmed = query.trim();
    if (!isOpen || !trimmed) {
      setApiCategories({});
      return;
    }

    setIsLoading(true);
    const handler = setTimeout(() => {
      axiosInstance
        .get(`/search?q=${encodeURIComponent(trimmed)}`)
        .then((res) => {
          if (res.data?.categories) {
            setApiCategories(res.data.categories);
          }
        })
        .catch(() => {
          // Graceful fallback to local results
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 200);

    return () => clearTimeout(handler);
  }, [query, isOpen]);

  // Merge Local + API results seamlessly
  const mergedCategories = useMemo(() => {
    const combined = { ...localCategories };

    Object.keys(apiCategories || {}).forEach((key) => {
      const apiList = apiCategories[key] || [];
      if (!Array.isArray(apiList) || apiList.length === 0) return;

      if (!combined[key]) {
        combined[key] = apiList;
      } else {
        // Merge without duplicates by ID or Title
        const existingIds = new Set(
          combined[key].map((item) => String(item.id || item.title).toLowerCase())
        );
        apiList.forEach((item) => {
          const keyId = String(item.id || item.title).toLowerCase();
          if (!existingIds.has(keyId)) {
            combined[key].push(item);
            existingIds.add(keyId);
          }
        });
      }
    });

    return combined;
  }, [localCategories, apiCategories]);

  // Filter items based on activeCategory tab
  const visibleItems = useMemo(() => {
    if (activeCategory === "all") {
      const items = [];
      Object.keys(mergedCategories).forEach((catKey) => {
        if (Array.isArray(mergedCategories[catKey])) {
          mergedCategories[catKey].forEach((item) => {
            items.push({ ...item, groupKey: catKey });
          });
        }
      });
      return items;
    }

    return (mergedCategories[activeCategory] || []).map((item) => ({
      ...item,
      groupKey: activeCategory,
    }));
  }, [mergedCategories, activeCategory]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < visibleItems.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : visibleItems.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < visibleItems.length) {
        handleSelectItem(visibleItems[selectedIndex]);
      } else if (query.trim()) {
        saveRecentSearch(query.trim());
        if (visibleItems.length > 0) {
          handleSelectItem(visibleItems[0]);
        } else {
          setIsOpen(false);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const handleSelectItem = (item) => {
    if (!item) return;
    saveRecentSearch(item.title || query);
    setIsOpen(false);

    window.dispatchEvent(
      new CustomEvent("eduHubSuperSearch", {
        detail: { query: item.title || query },
      })
    );

    if (item.url) {
      navigate(item.url);
    }
  };

  const handleRecentClick = (term) => {
    setQuery(term);
    window.dispatchEvent(
      new CustomEvent("eduHubSuperSearch", {
        detail: { query: term },
      })
    );
    localStorage.setItem("eduHubSuperSearch", term);
    if (onSearchSubmit) onSearchSubmit(term);
    inputRef.current?.focus();
  };

  const handleClearInput = () => {
    setQuery("");
    localStorage.removeItem("eduHubSuperSearch");
    window.dispatchEvent(
      new CustomEvent("eduHubSuperSearch", {
        detail: { query: "" },
      })
    );
    if (onSearchSubmit) onSearchSubmit("");
    inputRef.current?.focus();
  };

  // Text highlighter utility
  const highlightMatch = (text, highlight) => {
    if (!highlight || !text) return text;
    const parts = String(text).split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <mark key={i} className="search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Category counts for tab bar
  const categoryCounts = useMemo(() => {
    const counts = { all: 0 };
    Object.entries(mergedCategories).forEach(([key, list]) => {
      if (Array.isArray(list) && list.length > 0) {
        counts[key] = list.length;
        counts.all += list.length;
      }
    });
    return counts;
  }, [mergedCategories]);

  const availableCategories = Object.keys(categoryCounts).filter(
    (k) => k === "all" || categoryCounts[k] > 0
  );

  return (
    <div
      className={`global-search-container ${isOpen ? "is-open" : ""}`}
      ref={containerRef}
    >
      <div className="global-search-input-wrap">
        <Search className="global-search-icon" size={16} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          className="global-search-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Global Search"
          autoComplete="off"
          spellCheck="false"
          style={{
            border: "none",
            outline: "none",
            boxShadow: "none",
            background: "transparent",
          }}
        />

        {isLoading ? (
          <div className="global-search-spinner" aria-label="Loading results" />
        ) : query ? (
          <button
            type="button"
            className="global-search-clear-btn"
            onClick={handleClearInput}
            title="Clear search"
          >
            <X size={14} />
          </button>
        ) : (
          <div className="global-search-shortcut" title="Press ⌘K or Ctrl+K to search">
            <kbd className="kbd-symbol">⌘</kbd>
            <kbd>K</kbd>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="global-search-dropdown">
          {/* Category Filter Tabs */}
          {query.trim().length > 0 && availableCategories.length > 2 && (
            <div className="global-search-tabs">
              {availableCategories.map((catKey) => {
                const labelMap = {
                  all: "All",
                  institutes: "Institutes",
                  campuses: "Campuses",
                  users: "Users",
                  academics: "Academics",
                  inquiries: "Inquiries",
                  plans: "Plans",
                  tickets: "Tickets",
                  alerts: "Alerts",
                  navigation: "Pages",
                };
                const label = labelMap[catKey] || catKey;
                return (
                  <button
                    key={catKey}
                    type="button"
                    className={`global-search-tab ${
                      activeCategory === catKey ? "active" : ""
                    }`}
                    onClick={() => {
                      setActiveCategory(catKey);
                      setSelectedIndex(-1);
                    }}
                  >
                    {label}
                    <span className="tab-count">{categoryCounts[catKey]}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Results Area */}
          <div className="global-search-results-list" ref={resultsListRef}>
            {/* 1. Empty Query State */}
            {!query.trim() && (
              <>
                {recentSearches.length > 0 && (
                  <div className="global-search-group">
                    <div className="global-search-group-header">
                      <span className="group-title">
                        <Clock size={13} /> Recent Searches
                      </span>
                      <button
                        type="button"
                        className="group-clear-btn"
                        onClick={clearAllRecentSearches}
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="recent-searches-chips">
                      {recentSearches.map((term, i) => (
                        <div
                          key={i}
                          className="recent-search-chip"
                          onClick={() => handleRecentClick(term)}
                        >
                          <Clock size={12} className="chip-icon" />
                          <span className="chip-text">{term}</span>
                          <button
                            type="button"
                            className="chip-remove"
                            onClick={(e) => removeRecentSearch(e, term)}
                            title="Remove"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Shortcuts */}
                {mergedCategories.navigation && (
                  <div className="global-search-group">
                    <div className="global-search-group-header">
                      <span className="group-title">
                        <Sparkles size={13} /> Quick Navigation & Shortcuts
                      </span>
                    </div>
                    <div className="group-items">
                      {mergedCategories.navigation.map((item, idx) => {
                        const IconComponent =
                          ICON_MAP[item.icon] || LayoutDashboard;
                        return (
                          <div
                            key={idx}
                            className={`global-search-item ${
                              selectedIndex === idx ? "selected" : ""
                            }`}
                            onClick={() => handleSelectItem(item)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                          >
                            <div className="item-icon-wrap nav-icon">
                              <IconComponent size={15} />
                            </div>
                            <div className="item-content">
                              <div className="item-title">{item.title}</div>
                              <div className="item-subtitle">
                                {item.subtitle}
                              </div>
                            </div>
                            <div className="item-action">
                              <ArrowRight size={14} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 2. Active Query Results */}
            {query.trim().length > 0 && (
              <>
                {visibleItems.length === 0 && !isLoading ? (
                  <div className="global-search-empty-state">
                    <div className="empty-state-icon">
                      <Search size={28} />
                    </div>
                    <div className="empty-state-title">
                      No matching records found for "{query}"
                    </div>
                    <div className="empty-state-desc">
                      Try searching by institute name, campus, student roll number, faculty name, or page keyword.
                    </div>
                  </div>
                ) : (
                  <div className="group-items">
                    {visibleItems.map((item, idx) => {
                      const IconComponent =
                        ICON_MAP[item.icon] || Building2;
                      const isSelected = selectedIndex === idx;

                      return (
                        <div
                          key={item.id || idx}
                          className={`global-search-item ${
                            isSelected ? "selected" : ""
                          }`}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          <div
                            className={`item-icon-wrap cat-${
                              item.category || item.groupKey || "default"
                            }`}
                          >
                            <IconComponent size={15} />
                          </div>

                          <div className="item-content">
                            <div className="item-title-row">
                              <span className="item-title">
                                {highlightMatch(item.title, query)}
                              </span>
                              {item.badge && (
                                <span
                                  className={`item-badge badge-${
                                    item.badgeType || "default"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.subtitle && (
                              <div className="item-subtitle">
                                {highlightMatch(item.subtitle, query)}
                              </div>
                            )}
                          </div>

                          <div className="item-action">
                            <span className="item-category-pill">
                              {item.categoryLabel || item.groupKey}
                            </span>
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="global-search-footer">
            <div className="footer-tips">
              <span className="footer-tip">
                <kbd>↑</kbd> <kbd>↓</kbd> Navigate
              </span>
              <span className="footer-tip">
                <kbd>↵</kbd> Open
              </span>
              <span className="footer-tip">
                <kbd>ESC</kbd> Close
              </span>
            </div>
            <div className="footer-brand">
              <span>EduHub Global Search</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
