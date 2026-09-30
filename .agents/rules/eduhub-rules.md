# EduHub Agent Rules

## Purpose
This document consolidates the rules established while developing and stabilizing EduHub. Give these instructions to Anti-Gravity (or another coding agent) before asking it to modify the repository. The repository itself remains the source of truth: the agent must inspect current files, Git state, routes, components, Redux/state, API configuration, and existing documentation before changing code.

## 1. Project and Team Context
Project: EduHub — an education-management application for institutions, campuses, teachers, students, parents and administrative roles.
Current team: Muhammad Junaid — Full Stack / Team Leader; Muzammil Ali — Frontend; Muhammad Mohsin — Frontend; Idrees Ud Din — Backend; Habil Aris — Backend.
The application contains frontend, backend, landing-ui and docs areas. Never assume every task authorizes changes to all of them.

## 2. Non-Negotiable Agent Behavior
- Inspect before editing. Read the relevant implementation, imports, routes, state shape, styles, API client configuration and Git status first.
- Use the actual repository as the source of truth. Never invent files, APIs, fields, permissions, routes, backend behavior, grading formulas, payment logic or product requirements.
- Respect the task scope literally. If a task says Teacher-only, modify Teacher files only. If it says frontend-only, do not touch backend or landing-ui.
- Read outside the authorized scope when necessary to understand architecture, but do not edit outside scope without explicit approval.
- When a required fix crosses the authorized boundary, stop and report the exact blocker, affected file, root cause, minimal proposed change and possible impact. Ask for approval before editing it.
- Preserve existing working-tree changes. Never overwrite or discard another team member's work.
- Do not perform broad/destructive Git operations such as reset --hard, clean, blind restore, force checkout, branch switching, merging, rebasing, committing or pushing unless explicitly authorized.
- Do not install, remove or upgrade dependencies without approval.
- Do not claim runtime/browser verification unless it was physically performed.
- Prefer root-cause fixes over symptom-hiding CSS or duplicate components.

## 3. Architecture Rules
- Reuse the existing application architecture rather than creating parallel systems.
- Keep one centralized Redux store when the repository already uses one. Do not create role-specific duplicate stores.
- Reuse shared layout/components where appropriate: MainLayout, Sidebar, Header, Button, Card, Input, Select, Dialog, Table, Badge, loading/empty/error states, etc.
- Do not duplicate shared Button/Dialog/Input implementations inside a feature merely to bypass a shared bug.
- Use stable IDs for institutes, teachers, students, classes, assignments, attendance, diary entries, results and conversations. Do not hardcode the current logged-in demo identity.
- Keep frontend state/API integration replaceable and coherent. Avoid ad-hoc local state when the domain already has centralized state.
- Do not add sockets, Firebase, Cloudinary/S3, payment gateways, new APIs or other infrastructure unless the task explicitly requires and approves them.

## 4. Repository / Folder Conventions
Use current repository paths as the final authority. Historically the project follows these role-oriented areas:
```
frontend/src/Admins/
  Super Admin/
  Institute Admin/
  Campus Admin/
frontend/src/Users/
  Student/
  Teacher/
frontend/src/components/      shared UI
frontend/src/store/           centralized Redux/state
frontend/src/auth/            authentication
frontend/src/routes/          routing where applicable
docs/                         project documentation
backend/                      server/API
landing-ui/                   landing experience
```

## 5. Scope and Approval Protocol
When a change outside the requested scope is necessary, use a blocker report rather than silently editing it:
```
OUTSIDE-SCOPE / SHARED CHANGE REQUIRED
File:
Component / area:
Current problem:
Evidence / root cause:
Why the authorized scope cannot safely solve it:
Exact minimal proposed change:
Other modules potentially affected:
Risk:
```
Wait for explicit approval after reporting the blocker.

## 6. UI and Design-System Rules
- Maintain one coherent EduHub visual language. Do not redesign a page when the request is only to fix spacing, alignment, controls, or behavior.
- When asked to match a reference image, change presentation/styling only unless the user explicitly authorizes content or functionality changes. Preserve target content, labels, data, roles, actions and page purpose.
- Reuse existing theme tokens and semantic colors. Do not invent random hex colors when theme variables already exist.
- Keep dark/light mode behavior intact where supported.
- Prefer restrained semantic color: primary for normal emphasis, success for successful/completed state, destructive only for actual destructive/negative state. A zero-value deduction should not look like an active danger state.
- Avoid excessive rounding on Teacher filter/input controls. Teacher search/select/date/filter controls should use a straighter rectangular style, typically about 2–4px radius, consistent height and alignment.
- Do not blindly flatten cards/modals/buttons when the request targets only input-like controls.
- Responsive layouts must avoid clipping, horizontal page overflow and overlapping controls.
- Preserve keyboard focus states and accessibility; do not remove visible focus indication.

## 7. Teacher Module Rules
- Teacher scope is especially strict because many recent tasks are Teacher-only.
- If the task is Teacher-only, implementation changes belong in frontend/src/Users/Teacher/ unless a shared change is explicitly approved.
- The agent may inspect shared/admin/student/backend code to understand data contracts and design conventions, but inspection does not grant edit permission.
- Teacher pages should use natural content height. Do not add page-level 100vh/100dvh/min-height viewport hacks to hide whitespace or scrolling problems.
- The shared application layout owns the viewport. Avoid creating two vertical scroll owners (document plus .content-area).
- Do not vertically center whole Teacher pages in a way that creates artificial top/bottom whitespace.
- Keep Teacher page outer spacing consistent. Desktop target is roughly 32px page padding, tablet roughly 24px, mobile roughly 16px, while respecting existing architecture rather than duplicating these values everywhere.
- Major Teacher section gaps should be consistent (roughly 24px) and related card/control gaps roughly 16–20px where appropriate.
- Redundant page-intro blocks may be removed when requested: eyebrow/overline + large duplicate page title + descriptive subtitle. Preserve breadcrumbs, sidebar labels, actions, card/table section titles, form labels and accessibility metadata.
- When intro text is removed, remove the now-unused wrapper/spacing too; never hide it with opacity/display tricks that leave layout artifacts.
- Functional page actions such as Create Assignment, Save Attendance, New Diary Entry, Add Marks, Sync and Go to My Payslips must remain unless explicitly requested otherwise.

## 8. Teacher Product / Permission Rules
- **Classes & scheduling**: Teachers are view-only for Admin-created/assigned classes and timetables. Teachers cannot create, modify or delete classes, rooms, sections or instructor assignments.
- **Assignments**: Teachers may create assignments for their assigned courses/classes/sections, edit their own assignments, and delete their own assignments using a reusable confirmation dialog.
- **Assignment grades**: Assignment grades/feedback are separate from official final academic results. They must not automatically alter exam marks, GPA, CGPA or final results, and no weighting should be invented.
- **Attendance**: Teachers may mark only students in assigned classes/sections. Present/Absent/Late are supported; preserve Leave/Excused only if the existing model supports it. Past records may be edited; future dates are not allowed; edits must update the same record rather than create duplicates.
- **Daily Diary**: Teachers may create, edit and delete their own diary entries; multiple entries per class/date may exist. Diary homework/practice must not automatically create an Assignment.
- **Gradebook**: Teachers enter marks only against Admin-created exams/assessments where the structure exists. They do not create official exam structures, delete official results, edit other teachers' results, or independently publish/finalize official results.
- **Grading policy**: Never invent grade thresholds, GPA mappings, CGPA formulas, credit hours, weights or passing marks. Reuse an authoritative centralized policy if it exists; otherwise report the limitation.
- **Messaging**: Teacher messaging is limited to authorized participants supported by current architecture. Do not add fake online status, typing indicators, read receipts, sockets, Firebase or attachment infrastructure.
- **Identity**: Use the most reliable existing Auth User → Faculty/Teacher → stable teacherId mapping. Never hardcode a demo teacher as the canonical identity.

## 9. Teacher Page-Specific UI Expectations
- **Overview**: preserve KPI data, quick actions, today's teaching credits/periods, schedule/classes and pending submissions. Quick actions should navigate to existing Teacher routes.
- **My Teaching Credits**: keep month selector, Sync, KPI cards, tabs and schedule/history functionality. Use consistent Teacher spacing. Avoid arbitrary purple/orange accents; align with primary/neutral/success/destructive semantics.
- **My Salary**: preserve salary data/calculations and payslip action. UI cleanup must not invent payroll integrations.
- **My Classes**: view-only. Search/filter controls should align and use the straight Teacher control style. Do not add scheduling authority.
- **Assignments & Grading**: Create/Edit/Delete/grade/submission actions must use correct action-specific workflows. Do not show a fake selected assignment when none exists.
- **Take Attendance**: assigned class/section only; no future dates; Save and bulk-mark actions must respect current state and validation.
- **Daily Diary**: New Diary Entry/Edit/Delete should use correct forms/modals and preserve ownership rules.
- **Gradebook & Marks**: Add/Edit Marks only where an Admin-created assessment exists and is editable under current state.
- **Help & Support / Messages**: preserve current supported behavior; do not invent realtime infrastructure.

## 10. Button, Modal and Interaction Rules
- Every visible actionable button should have a real runtime path: click → handler → state/modal/navigation → validation → submit/save → state/API result → UI refresh.
- Do not use console.log, alert, 'coming soon', dummy hrefs, empty modals or permanently disabled controls as substitutes for implemented behavior unless the product intentionally defines them that way.
- Use action-specific modals. Infer fields from existing project truth; do not invent requirements.
- Modal content must be responsive, scroll safely within the viewport, have accessible labels, correct z-index/pointer behavior, and clear Cancel/Close plus primary action.
- Delete/destructive operations should use the project's reusable confirmation pattern.
- If shared Button/Dialog casing/import problems block compilation, fix the canonical shared component only with approval when the task is feature-scoped; never duplicate the component locally.

## 11. Scrolling, Height and Whitespace Rules
- Diagnose scroll ownership with rendered DOM measurements before changing viewport CSS.
- The intended layout should have one vertical scroll owner. Avoid document-level vertical scrolling when .content-area is intended to scroll.
- Do not treat valid empty-state/card height as 'whitespace' without identifying the actual occupying DOM element.
- Use browser measurements (clientHeight, scrollHeight, bounding rects, overflowY) when available.
- Do not repeatedly apply 100vh/100dvh fixes without proving the root cause.
- After a scroll/layout fix, verify document overflow, content-area scrolling, bottom whitespace and horizontal overflow at desktop/tablet/mobile sizes.

## 12. Data, Demo Data and Persistence
- Production architecture is the source of truth. Do not reintroduce fake records into production Redux slices merely to make old tests pass.
- When tests need data, prefer explicit test fixtures, mocked Redux state, mocked API responses or controlled factories.
- Preserve edited real/demo records during hydration/seeding; do not let initialization silently resurrect removed records or overwrite user edits.
- Selectors must scope records correctly to the authenticated user, enrollment, assigned class/section or other authorized domain relationship.
- Do not calculate dashboard totals from separate static data when authoritative shared records exist.

## 13. API / Backend Rules
- Respect the configured Axios/base API URL. Before changing endpoint strings, inspect baseURL and route prefixes to avoid /api/api/v1 or /api/v1/api/v1 duplication.
- Do not invent backend endpoints. Confirm routes/controllers/services/models first.
- For cross-layer fixes, keep frontend state updates dependent on confirmed server success when server persistence is authoritative.
- Security changes must be narrow and verified. Do not broaden CORS origins merely to make a request pass.
- If backend tests cannot run because a declared dependency is unavailable, report the environment/dependency problem; do not install packages without approval.
- Do not disable or weaken authorization, authentication, validation, CORS, rate limiting or security controls to make tests/UI work.

## 14. Testing and Verification Rules
- Run the narrowest relevant tests during implementation, then the broader appropriate suite before final reporting.
- A green build does not prove runtime behavior. Distinguish static validation from physical browser/API verification.
- For failing tests, classify whether the source code is wrong or the test expectation/fixture is outdated. Never weaken assertions just to get green tests.
- Standard frontend checks: production build, lint, relevant/full tests as appropriate, and git diff --check.
- Backend checks: syntax checks and tests if the existing environment supports them without unauthorized dependency installation.
- For UI tasks, inspect at representative sizes when browser tooling is available: 1600×900, 1366×768, 1024×768, 768×1024 and 390×844.
- Report existing warnings separately from new errors.

## 15. Git Safety Rules
- Start by checking branch, git status, staged/unstaged changes and conflict/merge/rebase state.
- Do not assume a local branch is current with origin. Verify before pull/merge advice.
- Windows case-insensitive file systems require special care with case-only renames (for example Button.jsx vs button.jsx). Use an intermediate git mv when an approved casing repair is required.
- Never blindly use Accept Current/Incoming for merge conflicts. Reconcile behavior and architecture.
- Do not run reset --hard, clean, force checkout, mass restore, commit, push, merge, rebase or branch switch unless explicitly authorized.
- Do not claim 'working tree clean' without checking.

## 16. Documentation Rules
- Documentation is part of the project deliverable. Update existing relevant docs when implementation changes behavior, architecture, verified limitations, or important debugging knowledge.
- Prefer updating an existing module document rather than creating duplicate documents for every small change.
- Use docs/frontend-teacher-module.md for Teacher-module changes when that file is the established Teacher documentation.
- Use docs/final-project-audit.md for repository-wide audit/stabilization findings when applicable.
- Documentation must distinguish confirmed behavior, static verification, runtime verification, blockers and remaining issues.
- Do not document a visual/runtime fix as confirmed if it was not physically verified.
- Do not let documentation edits become an excuse to modify unrelated source files.

## 17. Current Known Project Lessons / Pitfalls
- Button.jsx/button.jsx casing collisions on Windows can break imports and create self-reexports. Maintain one canonical shared Button implementation and consistent imports.
- Malformed merged Redux slices can compile incorrectly or contain duplicate imports/prepare blocks/default exports. A slice should have one coherent createSlice definition and one intended default export.
- Double scrollbars can arise when the document and .content-area both become scroll owners. Measure before fixing.
- Axios baseURL plus hardcoded /api prefixes can create duplicate API paths.
- API-backed slice defaults should not be repopulated with fake production data just to satisfy legacy tests.
- MongoDB transactions require appropriate server topology (replica set or sharded cluster); document such infrastructure requirements when relevant.

## 18. Agent Workflow for Any New Task
- Restate the authorized scope internally and identify files that may be read versus files that may be modified.
- Inspect Git state and preserve pre-existing changes.
- Inspect the relevant page/component, CSS, imports, routes, state, selectors, API client and existing documentation.
- Identify the root cause with evidence. Do not guess from a screenshot alone when behavior is involved.
- If the root cause requires an unauthorized/shared change, stop and request approval with a precise blocker report.
- Implement the smallest coherent root-cause fix while reusing existing architecture.
- Verify behavior and regressions with build/lint/tests and runtime checks when available.
- Update the existing relevant documentation.
- Review git diff to ensure no unrelated files changed.
- Report exactly what changed, what was verified, what remains unverified, and whether any approval is still required. Do not commit/push unless asked.

## 19. Required Final Report Template
See original document for the task report structure.

## 20. Compact Master Instruction to Prepend to Anti-Gravity Tasks
Before making changes, inspect the current repository and Git state. Treat the repository as the source of truth. Reuse existing architecture, components, Redux/state, routes, APIs and design tokens. Respect the exact implementation scope; you may inspect outside it but must not modify outside it without explicit approval. Preserve all pre-existing work. Do not invent requirements, APIs, data, permissions or business rules. Fix root causes rather than hiding symptoms. Do not install dependencies or perform destructive/broad Git operations. Run appropriate build/lint/tests/git diff checks, physically verify runtime/UI behavior when possible, update the existing relevant documentation, and clearly report anything unverified. Do not commit, push, merge, rebase or switch branches unless explicitly requested.

## 21. Important Note
These rules are guardrails, not a substitute for reading the repository. If current code, an approved requirement, or a newer explicit instruction conflicts with an older convention in this document, the agent must surface the conflict rather than silently choosing one. The user should approve any meaningful scope or product-rule change.
