# Sidebar Reference Redesign

## Reference Goal
Use the supplied sidebar screenshot for width, dark green surface, compact navigation, grouped headings, active rows, and bottom controls. Preserve EduHub branding and all page content.

## Previous Sidebar
One shared Sidebar rendered a flat campus navigation configuration, a separate collapse button, theme action, and disabled Sign Out. Several configuration links only reached the wildcard placeholder. Mobile CSS forced a collapsed appearance independently of the layout state.

## New Sidebar Structure
The same shared Sidebar now renders a compact brand/collapse row, internally scrollable navigation, People and Academics headings, and a fixed flex footer containing Dark Mode, a profile card, and Sign Out. Expanded width is 254px; collapsed width is 76px. Section metadata stays in the existing navigation configuration. No extra sidebar or page wrapper was created.

## Reusable Components
- Existing common/Sidebar.jsx accepts the existing navigation and theme/collapse handlers, plus optional user information (name, initials, role).
- MainLayout still renders Sidebar, Header, and Outlet.
- Existing Lucide icons and EduHub logo are reused. Native link/button semantics are retained; collapsed controls have accessible labels and browser title hints.

## Routes
- Campus Overview: /dashboard (also active at /)
- Faculty Directory: /faculty
- Students Directory: /students
- Class Timetable: /timetable

These paths were checked against App.jsx. Active matching also supports nested feature paths. Other role navigation exports and the router were left unchanged.

## Collapse Behavior
Expanded mode displays labels and section headings. Collapsed mode displays icons and the profile avatar; headings and switch decoration hide. The existing MainLayout state remains the single source of truth. Initial small screens (768px or less) start collapsed; crossing into that breakpoint collapses the sidebar. Users can then expand or collapse it with the same button. No drawer system was introduced. Navigation can scroll independently while footer controls remain available. Dynamic viewport height is supported with a 100vh fallback.

## Theme Integration
The Dark Mode switch calls the existing useTheme toggle through Sidebar props. Its checked state reflects the existing theme; no new theme state or persistence was added. Styling uses existing theme variables, with the sidebar-only active green token adjusted toward the reference. Keyboard focus and reduced-motion styles are included.

## Profile / Logout
The profile preserves the existing Header demo identity, Admin User / A. There is no verified role or profile dropdown, so neither was invented. An optional user prop supports existing caller data without creating another user state system. Sign Out retains its onSignOut handler contract and remains disabled because MainLayout has no logout handler. No authentication logic was changed.

## Files Created
- docs/frontend-sidebar-reference-redesign.md

## Files Modified
- frontend/src/components/common/Sidebar.jsx: grouped rendering, brand control, active accessibility, theme switch, reusable profile card.
- frontend/src/constants/navigation.jsx: campus configuration restricted to implemented routes, section metadata, matching labels/icons.
- frontend/src/index.css: sidebar width/token/styles, footer, collapse, scrolling, focus; removed competing mobile sidebar rules. Existing Header styles retained.
- frontend/src/layouts/MainLayout.jsx: initialize and update the existing collapse state for the small-screen breakpoint.

## Files Reused Without Modification
- frontend/src/components/common/Header.jsx
- frontend/src/hooks/useTheme.js and frontend/src/lib/theme.js
- frontend/public/brand/eduhub-logo.png
- frontend/src/App.jsx (route verification)
- Existing feature pages and Redux store remain unchanged by this task.

## Verification
- npm.cmd run build: passed.
- npm.cmd run lint: passed with the same three existing Fast Refresh warnings in ui/Button.jsx, ui/Badge.jsx, and ui/tabs.jsx.
- Inspected route matching, theme handler wiring, disabled logout behavior, and the shared layout integration.
- Browser visual comparison and interactive viewport/keyboard testing were not performed; those remain manual verification items. Build/lint do not establish pixel-perfect matching.

## Remaining Differences From Reference
- EduHub name/logo are preserved, rather than copying EduNexus branding. No tagline was introduced.
- Exam schedules, attendance, finance, announcements, reports, and settings links/groups are omitted because they have no implemented feature routes in App.jsx. No placeholder destinations were created.
- Admin User replaces the reference's Bilal Tariq; no unverified role or dropdown is shown.
- The collapse control remains in the sidebar brand area rather than redesigning Header.
- Fewer implemented links leave more space above the footer than in the reference.
- No backend or landing-ui files, page content, student behavior, Redux state, or authentication business logic were modified.
