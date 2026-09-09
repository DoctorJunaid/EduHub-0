# Institute Admin Campus Branches

## Implementation and Files
Created under `src/Admins/Institute Admin/Campuses/`: `CampusBranches.jsx`, `CampusBranches.css`, `CampusForm.jsx`, and `campusData.js`.

Created centralized `src/store/Slices/campusesSlice.js` and `campusesSlice.test.js`, plus this report.

Modified InstituteDashboard, Institute Admin navigation, App routing, shared Sidebar exact-match handling, Header breadcrumb labels, store registration, persistence utility and persistence tests. No other admin module source or backend/landing-ui files were changed by this task.

## Reusable Components
Existing MainLayout, Sidebar, Header, Card, Input, Table, Badge, Button, Label, Dialog and ConfirmDialog. New CampusForm is one Institute-specific Add/Edit form; there is no duplicate layout, generic table or separate Edit form.

## Routing and Authorization
`/institute-admin/campuses` is inside the existing Institute Admin protected tree. Campuses is the sole active sidebar item; Overview now requests exact matching. Breadcrumb reads Dashboard / Campuses. The overview Add New Campus action opens this route with `?add=1` to open the shared creation form.

## Campus Source and Persistence
No campus registry/API existed. The new centralized Redux slice is the single source for this page and overview campus count. Seeds use the screenshot's camp_1 and camp_2, retaining the existing Main Campus name rather than creating a second copy of that location. New IDs use existing Redux Toolkit nanoid conventions.

Records contain id, instituteId, name, address and status. Only Active is currently defined; the form displays this status read-only instead of inventing other statuses. Existing versioned persistence writes `eduhub_campuses`. Invalid data falls back safely; intentionally empty saved arrays remain empty. Components contain no localStorage calls. Institute-scoped selectors and mutations use the existing single-institute demo metadata.

## Add / Edit / Delete
Add and Edit share CampusForm. Name/address are required and trimmed; Edit preserves ID and institute ownership. Delete uses ConfirmDialog and only runs after confirmation. No prior campus relationship checks or cascade behavior existed. Deleting/renaming a campus does not delete or rewrite students/faculty: those legacy records still contain campus display names. Converting their relationships to stable campus IDs requires a separate approved migration.

## Search and Dashboard Synchronization
Case-insensitive local search covers name, address and ID without changing source records. Clearing search restores the list. Empty and no-match messages are separate. Overview counts the same scoped Redux campus array, replacing its previous directory-location inference. Count now starts at 2 and changes on Add/Delete.

## Manage Destination
No campus details/management destination exists. Manage is visually present and disabled with an explanatory title. No extra management system or route was invented.

## Verification
Build passes. Lint exits successfully with existing Fast Refresh warnings in shared Button, Badge and tabs. Eleven campus/persistence tests pass, covering CRUD, stable IDs, scoping, validation, search, corrupt storage, refresh and empty-list persistence.

Chrome verified Campuses navigation and sole active state, two seed rows, Add increasing the list to 3, refresh retaining 3, Edit prefill and saved address, deletion confirmation and removal back to 2, and overview count returning to 2. Dark mode toggles correctly. At 390×844 the document width equals viewport width; table scrolling stays inside its container. Desktop screenshot was captured and visually compared to the reference. Authentication uses the existing Institute Admin session and guard.

## Deferred / Limitations
Manage destination, backend campus persistence/authorization and legacy campus-name relationship migration remain outside this task. Existing single-institute frontend demo scoping is preserved. No new dependencies or status business rules were added.
