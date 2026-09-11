# Student frontend demo data

`frontend/src/store/studentDemoData.js` enriches the existing Ali Raza reference student (`student-demo-1`) using the existing Redux store and centralized localStorage persistence. It creates no users, backend endpoints, or separate store. The Student profile identifies this academic preview as Demo.

The coordinated preview provides three enrolled subject routines, three assignments (pending, submitted, graded), two personal submissions, twelve attendance entries on scheduled weekdays, three diary/homework entries, three linked exam results, two paid reference vouchers totaling PKR 100,000, and conversations with existing faculty and student records. Credit hours and the 3.93 CGPA are explicit demo academic values, not an institutional grading policy. Dates are relative to initial generation and remain stable after persistence.

Existing matching records are preserved. Only recognized legacy generated results for this reference student are replaced with linked preview results; other students' records remain intact. Non-demo personal records take precedence over generated records in the same collection. Demo records carry `demo: true`; academic summary fields carry `academicSummaryDemo`. Selectors continue reading shared collections, so future API hydration can replace these records without changing page components.

Set `VITE_STUDENT_DEMO=false` to disable generation and reconciliation. This does not delete previously saved preview records. For a completely empty development fixture, disable generation and clear the relevant demo browser storage explicitly. Fee-only reference fallback is separately controlled by `VITE_STUDENT_FEE_DEMO=false`. Existing empty-state components remain available.

Dashboard actions reuse the shared Button component with existing `btn-primary` and `btn-secondary` styles. This fixes anchor text inheriting the global link color while retaining established colors, typography, spacing, hover, focus, and primary/secondary hierarchy. No global Button styles were changed.

Implementation: shared store initialization, `studentDemoData.js`, Student course/grade view models, fee demo detection, Student profile demo label, and dashboard action classes. Tests cover shared relationships, persistence, idempotence, real-data precedence, and existing Student selectors.
