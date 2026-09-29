# Teacher Module

## Teacher Overview UI correction (2026-09-28)

### Problem and root cause

The Teacher Overview used four fixed columns for both its five summary metrics and five quick actions. The fifth item therefore wrapped into an unbalanced second row. Table cells had generic sizing only, which allowed the teaching-credit status, credits, and action columns to compete for space and could push the Mark Done action against the table edge. Independent bottom margins also made the page's vertical spacing inconsistent.

### Implementation

Only Teacher module source files were changed:

- `frontend/src/Users/Teacher/TeacherDashboard.jsx`
- `frontend/src/Users/Teacher/TeacherDashboard.css`

The KPI summary now uses a five-column unified strip on wide screens. It becomes a balanced three-over-two arrangement on narrower desktop/tablet widths, a two-column arrangement with a full-width final metric on smaller tablets, and one column on phones. All five metrics continue to use their existing selectors, API summary, and calculated values.

Quick actions now use five equal columns on wide screens. At intermediate widths they intentionally use three actions followed by two equal-width actions, then two columns on smaller tablets and one column on phones. Existing routes and link behavior were preserved. Local focus-visible styles keep the action links keyboard accessible.

Dashboard sections now share one Teacher-local grid gap instead of unrelated bottom margins. Headers, supporting copy, table cell padding, empty states, and card sizing follow the same spacing rhythm. The teaching-credit table has controlled horizontal scrolling and explicit minimum widths for important columns. Status labels and action content do not wrap, and Mark Done retains a visible minimum width. The schedule and pending-submission sections use the same card, header, search, table, and responsive overflow rules.

No Teacher data source, credit calculation, session status mutation, business rule, Redux architecture, route, shared component, global stylesheet, Parent module, or backend implementation was changed.

### Verification

- Frontend production build: passed; 2,678 modules transformed.
- Full frontend lint: passed with existing repository warnings. Focused lint on the changed Teacher dashboard also passed with three pre-existing warnings in that component (`diary`, `teacherId`, and an effect-state warning).
- Focused Teacher tests: `node --test src/Users/Teacher/teacherScope.test.js` passed 2 of 2 tests.
- Local server availability: `GET http://localhost:5173/teacher` returned HTTP 200.
- `git diff --check`: passed with Windows line-ending notices.

Physical browser inspection was unavailable during the initial Overview pass. The second-pass diagnosis below subsequently verified the rendered page and measured its layout at all requested viewport sizes.

## Teacher dashboard whitespace and scrolling (2026-09-28)

The screenshot is the Teacher Overview route (`/teacher`), rendered by `frontend/src/Users/Teacher/TeacherDashboard.jsx` inside the shared `.dashboard-shell > .main-area > .content-area` layout. The last dashboard card is the valid **Pending Assignment Submissions** section, including its heading, search tools, table headings, and empty state. The dashboard itself has no fixed height or `min-height`; the measured gap after its final card was its normal bottom padding (32px on desktop, 24px on mobile). The oversized blank area in the screenshot is below the application shell, not a stretched dashboard section.

The prior rendered-page measurements showed `.content-area` already scrolling internally, while the document also exceeded its viewport at narrower sizes: document scroll height was 782px at 1366x768, 1283px at 768x1024, and 1668px at 390x844. That created the second vertical track and exposed blank space after the shell. The shared layout uses `.dashboard-shell { min-height: 100vh; overflow: hidden; }`, `.main-area { height: 100vh; }`, and `.content-area { flex: 1; min-height: 0; overflow: auto; }`. The Teacher layout had no explicit viewport constraint on its shell, so its outer document could still grow while the content area also owned scrolling.

This pass changes only `frontend/src/Users/Teacher/TeacherUI.css`. The Teacher-specific `.teacher-shell` now has a fixed `100dvh` height, zero minimum height, and hidden outer overflow. Its `.main-area` is constrained to the same dynamic viewport height with zero minimum height. The existing `.content-area` remains the only page-level vertical scroller (`overflow-y: auto`) and clips horizontal page overflow; its minimum height stays zero. The rules are scoped to the Teacher layout class, leaving shared shell styles and other modules untouched. The dashboard sections retain their natural height and existing bottom padding.

The before-fix browser inspection established the duplicate document/content scroll ownership above. After this CSS change, build/lint and source inspection can confirm compilation and the intended ownership rules, but a successful physical post-fix browser inspection has not yet been completed in this pass. The responsive behavior therefore remains pending runtime confirmation at 1600x900, 1366x768, 1024x768, 768x1024, and 390x844; no post-fix visual result is claimed here.

### Final shared scroll ownership correction (2026-09-28)

The follow-up Chrome measurements showed the document at 1,320px high for a 695px viewport while `body` remained viewport-sized. The intended `.content-area` scroller measured 623px high with 1,454px of natural dashboard content. The dashboard and its final cards were ordinary in-flow content; the earlier Teacher-only viewport workaround had been removed and was not reintroduced.

The shared layout allowed the shell to grow because `.dashboard-shell` used only `min-height: 100vh`, while its sidebar and main column independently declared viewport heights. The shell therefore lacked a definite viewport boundary even though `.content-area` already owned inner scrolling. The final correction changes the shared shell to `height: 100vh; height: 100dvh` and makes `.main-area` use `height: 100%` with `min-height: 0`. This gives the shared shell a definite dynamic viewport size, keeps the main column within it, and leaves `.content-area` as the sole vertical page scroller.

Only `frontend/src/index.css` was changed for this shared correction. Teacher and Parent source files were not modified for it. Parent has no dedicated role route in `App.jsx`, so a Parent runtime regression check is unavailable. Build, lint, the existing Teacher scope tests, and `git diff --check` passed. A headless Chrome regression attempt was inconclusive: at its measurement points `#root` had no rendered `.dashboard-shell` or `.content-area`, while the attempted app pages generated backend 401 responses. Those readings cannot verify layout geometry or role regressions. Physical browser checks for the available role routes and responsive sizes remain pending; this document does not claim post-fix runtime measurements or manual verification.

## Teacher Credits page layout (2026-09-29)

The `/teacher/credits` page was rendered with its header, KPI cards, tabs, filters, and session table compressed against neighboring elements and viewport edges. The implementation used Tailwind spacing utilities for much of this geometry, while the project's unlayered global universal reset sets `margin: 0` and `padding: 0`, overriding those layered utilities. The Credits feature did not have a dedicated local stylesheet to restore the lost spacing. No Credits-specific fixed-height, negative-margin, or broad Teacher selector was found to be the cause.

This correction changes only `frontend/src/Users/Teacher/TeacherClassCredits.jsx` and adds `frontend/src/Users/Teacher/TeacherClassCredits.css`. The component now uses Credits-scoped classes for layout, and its local stylesheet restores a natural-height page inset and consistent section gaps; spaces and aligns the header and month/Sync controls; gives the four KPI cards balanced padding and responsive columns; separates and sizes the tabs; pads the filter, schedule header, table cells, empty/loading states, and action buttons; and contains the wide table in its own horizontal scroll wrapper. The layout uses four KPI columns on desktop, two at medium widths, and one on narrow phones. The table can scroll locally at narrow widths. No viewport-height sizing was added.

Only presentation classes and a local stylesheet were changed. API calls, Redux/state, calculations, session data, tabs, and Complete, Missed, Sync, and review actions were preserved. No Parent, shared layout, global CSS, shared UI, or backend files were modified for this Credits correction.

### Verification

- Frontend production build: passed; 2,679 modules transformed. Vite emitted its existing large-chunk advisory.
- Full frontend lint: passed with repository warnings; no lint errors.
- Focused Teacher tests: `node --test src/Users/Teacher/teacherScope.test.js` passed 2 of 2 tests. These cover Teacher scope/selectors, not rendered Credits UI.
- `git diff --check`: passed with Windows line-ending notices.
- Browser runtime verification of the Credits page and the requested viewport sizes was not performed. Build and source checks do not establish a visual pass; desktop/tablet/mobile rendering and action clicks remain unverified in a browser.

## Teacher My Salary page layout (2026-09-29)

The Teacher route is `/my-salary`, rendered by `frontend/src/pages/MySalary.jsx` inside the Teacher layout. The page's salary header already has local padding, but the contract content relied on Tailwind padding and margin utilities. The unlayered universal reset sets all margins and padding to zero, overriding those layered utilities and collapsing the profile, summary cards, allowance section, and deductions section. Review of Teacher styles found no broad Teacher selector contributing to the compression.

To keep implementation changes inside the Teacher module, only `frontend/src/Users/Teacher/TeacherUI.css` was changed for this task. New selectors scoped under `.teacher-shell .salary-profiles-page` restore the profile card's natural spacing, identity-row alignment, summary-card padding and hierarchy, separation for allowance/deduction sections, and payslip button sizing. Tablet rules adapt the summary to two columns and phone rules stack the summary and deductions. No viewport height or scrollbar workaround was added. `MySalary.jsx` and shared `SalaryProfiles.css` were not changed.

Salary values, calculations, identity, API/query behavior, contract status, and payslip navigation were left unchanged. No non-Teacher source, shared layout, global CSS, Parent module, or backend file was modified.

### Verification

- Frontend production build: passed; 2,679 modules transformed. Vite emitted its large-chunk advisory.
- Full frontend lint: passed with repository warnings and no errors.
- Focused Teacher tests: `node --test src/Users/Teacher/teacherScope.test.js` passed 2 of 2 tests; these are scope tests, not salary UI tests.
- `git diff --check`: passed with Windows line-ending notices.
- Runtime inspection of `/my-salary`, responsive viewport rendering, and payslip navigation was not performed. Source checks do not establish a visual pass; those behaviors remain unverified in a browser.
