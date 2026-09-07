# Redux Store Reorganization

## Requested Work
Centralize existing Redux-specific files in the existing frontend/src/store folder without rewriting Redux logic, changing state shape, moving feature UI, or modifying other modules.

## Previous Structure
```text
frontend/src/
|-- store.js
|-- store/ (empty)
`-- components/faculty/
    |-- facultySlice.js
    |-- facultySlice.test.js
    |-- facultyData.js
    `-- ...feature UI
```

## New Structure
```text
frontend/src/store/
|-- store.js
|-- facultySlice.js
`-- facultySlice.test.js
```
store.js configures the single application store. facultySlice.js retains its reducer, action creators, selector, and Redux-specific initials helper. facultySlice.test.js contains the unchanged Redux regression tests. No separate hooks, selectors, reducers, or thunks folders were warranted: no such standalone files exist.

## Files Moved
- `frontend/src/store.js` -> `frontend/src/store/store.js`
- `frontend/src/components/faculty/facultySlice.js` -> `frontend/src/store/facultySlice.js`
- `frontend/src/components/faculty/facultySlice.test.js` -> `frontend/src/store/facultySlice.test.js`

## Files Created
Only this documentation is newly authored. The three destination Redux files are relocations, not duplicate implementations.

## Files Deleted
The three old file locations no longer exist. No logic was discarded and no compatibility copies remain.

## Files Modified
- `frontend/src/main.jsx`: Provider store import path.
- `frontend/src/components/faculty/FacultyDirectory.jsx`: action/selector import path.
- Relocated store.js: local faculty reducer import path.
- Relocated facultySlice.js: demo-data import path.
- Relocated facultySlice.test.js: filter-utility import path.

## Imports Updated
main.jsx imports `./store/store.js`. FacultyDirectory imports `@/store/facultySlice.js`. The store and tests import the adjacent slice. The slice and tests import the existing `../components/faculty/facultyData.js`. The alias configuration required no changes. No implementation references to the old locations remain. Older task reports remain historical descriptions of previous file locations.

## Store Configuration
The application still has one production configureStore call with `{ reducer: { faculty: facultyReducer } }`. The existing Provider still uses that store. Test-created stores remain isolated test fixtures, not additional application stores. No slices were added, duplicated, or unregistered.

## State Shape
Unchanged: `state.faculty.records`. The exported selectFaculty selector still returns this collection. Action names, reducer behavior, seed records, generated IDs, and demo state lifecycle remain unchanged.

## Components Added / Reused
No components added. Existing FacultyDirectory and root Provider use the relocated modules. Forms, confirmation dialog, shared UI, header, sidebar, and layouts remain at their existing locations.

## Folder Structure Changes
Reused the existing empty store directory. Created no nested or placeholder folders. General facultyData.js remains with the feature because its records and filter function are not Redux-specific. It does not import the store, so the relocated dependency introduces no circular import.

## Styling / Logic / Dependencies
No styling, business logic, Redux state behavior, or dependency changes. Only module locations and imports changed.

## Verification
- `npm.cmd run build`: passed; generated CSS and JavaScript hashes match the preceding implementation build.
- `npm.cmd run lint`: completed with the same three pre-existing Fast Refresh warnings.
- `node --test src/store/facultySlice.test.js`: all five existing tests passed.
- Direct import assertions verified the actual central store's faculty reducer registration, records state shape, and selector result.
- Source searches verified store/slice usages and no stale implementation import paths.
- Filesystem checks confirmed the three original file paths no longer exist.
- `git diff --check`: passed with Windows line-ending notices.
- No browser testing was performed for this structural-only change.

## Issues
No known issues introduced by the move. Existing react(only-export-components) warnings in Button.jsx, Badge.jsx, and tabs.jsx remain unchanged. Demo state still resets on reload as before.

## Approval Required
None. No backend or landing-ui changes. No unrelated changes, UI redesign, additional dependencies, or business-logic modifications.
