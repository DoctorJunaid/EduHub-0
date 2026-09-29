# EduHub Final Project Audit

## Audit Scope

This audit covered the tracked frontend, backend, routes, Redux state, selectors,
shared layout, API client, role guards, representative payroll/fee/timetable
contracts, source integrity, and available validation commands. Existing uncommitted
Teacher-module and documentation work was preserved and is not represented as a new
audit change.

## Architecture Summary

- **Frontend:** Vite and React with `BrowserRouter`; role-gated routes are declared in
  `frontend/src/App.jsx` and role navigation is rendered through `MainLayout`.
- **State:** Redux Toolkit uses the centralized `createAppStore` setup, persisted
  browser state, slices, and derived Student selectors.
- **API:** The shared Axios client targets `/api/v1`; frontend callers must supply
  paths relative to that base URL.
- **Backend:** Express mounts versioned routes below `/api/v1`, uses JWT middleware
  and role middleware, and persists domain data through Mongoose models and services.

## Frontend Status

The production build completes successfully. The shared app shell has one intended
content scroll owner: `.content-area` inside the viewport-height
`.dashboard-shell`. The audit found no unresolved merge markers or tracked paths
that differ only by letter casing.

The lint command exits successfully but retains pre-existing warnings. All
`jsx-no-undef` warnings found during this audit were resolved.

## Backend Status

All JavaScript files under `backend/src` pass `node --check`. The configured backend
test command cannot run because `vitest` is not available in the installed backend
dependencies. No package installation was performed.

## Integration Status

The Axios base URL is `/api/v1`. The Campus Manager Student Profile dialog was
calling `/api/campus-admin/...`, which produced an incorrect doubled path. The
Faculty Profile dialog also used obsolete `/api/campus/...` paths. Both dialogs now
use the mounted backend routes relative to the shared base URL.

Static review confirmed the Student portal, Campus Admin schedules/fees/assignments,
teacher profile, salary profile, and payroll route prefixes are mounted beneath the
same versioned API root. Browser/API workflow verification was not performed because
no authenticated browser or database-backed runtime was available.

## Role-by-Role Status

| Role | Status | Evidence |
| --- | --- | --- |
| Super Admin | PARTIAL | Routes are protected; a missing rendered `X` icon import was fixed. No authenticated browser run was available. |
| Institute Admin | PARTIAL | Protected routes and API calls were statically reviewed. |
| Campus Admin / Manager | PARTIAL | Protected routes and key fee, timetable, faculty, and student-profile contracts were reviewed. Corrected profile-dialog URLs compile. |
| Teacher | PARTIAL | Current Teacher work was preserved; the production build compiles it. Runtime verification was unavailable. |
| Student | PARTIAL | Student route guard and selector scoping were reviewed. A diary cross-class data leak was fixed, but stale fixture-dependent tests remain. |
| Parent | NOT IMPLEMENTED | No implemented Parent route module was identified in the audited route tree. |

## Confirmed Issues Found

### HIGH — Backend CORS policy accepted unapproved production origins

- **Module:** `backend/src/app.js`
- **Symptom:** The CORS origin callback allowed every origin after its allow-list
  check, including in production.
- **Root cause:** Its fallback returned `callback(null, true)` instead of rejecting
  the unapproved origin.
- **Fix:** The fallback now returns an origin-rejection error. Approved configured
  origins retain their existing behavior.
- **Verification:** A local production-mode app smoke check returned `200` for
  `http://localhost:5173` and rejected `https://unapproved.example` with `500`.

### MEDIUM — Render-time undefined symbols

- **Modules:** Salary Profiles, Mark Paid dialog, Student Dashboard, and Super Admin
  Dashboard.
- **Symptom:** Components referenced symbols not imported into their modules.
- **Root cause:** Missing imports for `SalaryProfileDialog`, `toast`,
  `DialogDescription`, `Badge`, and `X`.
- **Fix:** Added the matching existing imports only.
- **Verification:** Production build succeeds and the lint scan reports no
  `jsx-no-undef` warnings.

### MEDIUM — Student diary could return records outside enrolled classes

- **Module:** `frontend/src/store/selectors/studentDiary.js`
- **Symptom:** A diary record with an unmatched `classId` was returned with fallback
  title, section, and instructor values.
- **Root cause:** The selector's `flatMap` always emitted a row even when no current
  Student course/routine matched the record.
- **Fix:** The selector now omits records without a matched enrolled routine and
  derives the displayed course fields from that verified routine only.
- **Verification:** Code-path review and targeted Student messaging tests passed.
  The existing diary tests still rely on purged mock records; see Remaining Issues.

### MEDIUM — Campus profile dialogs used paths incompatible with the Axios base URL

- **Modules:** Campus Manager Student and Faculty Profile dialogs.
- **Symptom:** Requests included `/api/` even though Axios already targets
  `/api/v1`, causing incorrect request paths.
- **Root cause:** Callers duplicated the version-root concept and one Faculty salary
  path used an obsolete segment.
- **Fix:** Student fee/payment calls now use `/campus-admin/...`; Faculty calls use
  `/campus/salary/profiles/:teacherId` and `/campus/teachers/:teacherId/attendance`.
- **Verification:** The frontend build resolves the callers; corresponding backend
  routes were inspected.

## Security Findings

- JWT authentication and role checks are present in the backend route middleware.
- The CORS production fallback was corrected during this audit.
- `express-mongo-sanitize` remains deliberately disabled because the installed
  version is documented in code as incompatible with Express 5's read-only query
  property. Re-enabling it requires dependency-compatible security middleware work.

## Data Integrity Findings

- Student identity resolution fails closed: a Student must match by stable ID or a
  unique email.
- Student diary records now require an enrolled routine match and no longer surface
  unrelated class records.
- The current Student mock-data population helper expects an existing reference
  Student and Faculty record. The current API-backed slices intentionally initialize
  empty after mock data was purged; adding synthetic records during this audit would
  contradict that direction.

## Responsive and UI Findings

- The static layout review found the shared dashboard scroll architecture uses a
  single application content owner.
- Local modal/table scrolling exists where needed in reviewed CSS.
- No browser viewport automation was available, so desktop, tablet, mobile, and
  dialog interaction remain runtime verification work rather than a claimed pass.

## Tests and Validation

| Check | Result |
| --- | --- |
| Frontend production build | PASS (`npm.cmd run build`) |
| Frontend lint | PASS with existing warnings (`npm.cmd run lint`) |
| Frontend tests | FAIL: 63 passed, 39 failed of 102 (`node --test`) |
| Targeted Student messages tests | PASS: 4 passed |
| Backend JavaScript syntax | PASS (`node --check` across `backend/src`) |
| Backend test command | BLOCKED: `vitest` is not installed/available |
| CORS local production smoke check | PASS for configured origin; unapproved origin rejected |
| `git diff --check` | PASS |

The frontend build reports a JavaScript chunk larger than 500 kB after minification.
No code-splitting change was made solely to silence that advisory.

## Remaining Issues

1. **MEDIUM — Student frontend test fixtures are stale.** A group of Student tests
   assumes initial mock Student, Faculty, and timetable records that were intentionally
   removed. They must construct their own fixtures or be reworked around the current
   API-backed empty initial state. Restoring fake records to make the tests green was
   intentionally avoided.
2. **MEDIUM — Backend tests are not runnable.** `backend/package.json` declares
   `vitest run`, but Vitest is unavailable. Restore the project test dependency and
   lockfile through the team’s dependency-management process, then run the suite.
3. **MEDIUM — Mongo query sanitization is disabled.** Replace or upgrade the
   Express-5-incompatible sanitizer with a compatible tested solution before calling
   the backend hardening complete.
4. **LOW — Lint warnings remain.** The lint command succeeds but reports unused
   imports and effect-related warnings outside the confirmed defects fixed here.

## Environment and Infrastructure Requirements

The backend requires a valid MongoDB connection, JWT secret in production, and a
configured `FRONTEND_URL` for the deployed frontend. Database-backed and
authenticated browser workflow checks require those services and test credentials;
none were used during this static/local audit.

## Final Repository Status

No commit, push, merge, branch switch, reset, clean, dependency installation, or
database migration was performed. Existing uncommitted Teacher-module work remains
available for separate review alongside the audit changes.

## Post-Audit Verification and Test Stabilization

This follow-up preserved the existing working tree and rechecked the earlier CORS,
missing-import, Student diary enrollment, and Campus Manager profile-route fixes.
The shared Axios client still targets `/api/v1`; the corrected profile callers keep
their relative `/campus-admin/...` and `/campus/...` routes, and the CORS rejection
remains in `backend/src/app.js`.

The frontend has no package test script, so its native Node test discovery was run
with `node --test`. The initial run had 63 passing and 39 failing tests. All 39 were
classified before changing code: 33 were stale fixtures or assertions that expected
removed default records, outdated role names, or older fee export fields; six exposed
narrow robustness or relationship defects. The fixes add test-only explicit fixtures,
keep test stores representative, preserve a new campus's known institute identity,
and make Student-facing selectors fail closed for missing assignments, attendance
classes, and exams. No synthetic default application records were restored.

The final frontend run passes **102/102** tests. Redux prints non-failing warnings
where focused tests intentionally mount only the reducers under test; those stores
discard unrelated persisted slices. The frontend production build and lint command
both exit successfully. Lint retains existing warnings outside this stabilization
scope.

Backend JavaScript syntax checking across `backend/src` passes. `backend/package.json`
declares `vitest run`, but `vitest` is absent from the installed backend dependencies,
so `npm.cmd test` cannot start. No dependency installation was performed.

| Check | Result |
| --- | --- |
| Frontend tests (`node --test`) | PASS: 102 passed, 0 failed |
| Frontend production build (`npm.cmd run build`) | PASS |
| Frontend lint (`npm.cmd run lint`) | PASS with existing warnings |
| Backend JavaScript syntax (`node --check`) | PASS |
| Backend tests (`npm.cmd test`) | BLOCKED: `vitest` command unavailable |
| `git diff --check` | PASS |

No authenticated browser or database-backed runtime was available for this follow-up,
so no runtime workflow result is claimed. The remaining actionable limitation is the
missing backend Vitest dependency; the existing lint warnings also remain for separate
cleanup.
