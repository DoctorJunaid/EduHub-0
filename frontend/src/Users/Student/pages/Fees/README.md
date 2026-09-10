# Student Fee Vouchers

Route: `/student/fees`. Reuses the existing protected Student shell, SummaryCard, Card, Badge, Table, Button, Dialog, currency formatter, and `printElement` utility.

## Data and demo mode

The page selects the current student's `fees.records` from the existing shared Redux store. Shared vouchers always take priority. The screenshot reference records live once in `src/store/feeReferenceData.js`, not in page JSX or a second Redux store. They are a read-only fallback, never inserted into issued vouchers or Admin totals.

Demo preview applies only when the entire shared fee collection is empty, demo mode is enabled, and the linked student's roll matches `NUST-CS-2023-042`. It displays the two user-approved reference vouchers, totaling PKR 100,000 paid and PKR 0 outstanding. Both the page and printable challan identify them as demo/reference records. Unknown payment dates are not invented.

Set `VITE_STUDENT_FEE_DEMO=false` in the frontend environment and restart/rebuild to disable the preview. The normal empty state then applies. Other students and unlinked accounts never see the reference student's vouchers. Adding any shared voucher disables the preview; each student then sees only their own records.

Pending Dues sums Pending and Overdue vouchers across all terms, so the helper text states “All outstanding vouchers.” Shared persistence remains unchanged. The preview is static reference data and does not need to be persisted as real fees. Missing payment methods show “Not recorded.” 1Link / KuickPay are reference labels, not connected integrations; no security guarantee or payment processing is claimed.

## Printing

Print Challan opens a read-only selected-voucher dialog. Its print action uses the existing iframe print utility, including voucher/type, student name/reference, term, amount, due date, recorded status, payment method/date, and demo notice where relevant. It excludes the shell and controls and uses independent light print styling. No Admin details form is copied: the inspected Admin dialog has no print action and depends on Admin-only styles.

## Files

Created: StudentFees.jsx, StudentFees.css, studentFeeSelectors.js, this README, `Users/Student/components/StudentChallanDialog.jsx`, `store/feeReferenceData.js`, and its test.

Modified: App.jsx, Student index/navigation/layout, and the Dashboard Fee Vouchers quick link. No Admin, Teacher, auth, backend, or global component changes.

## Verification

Build passes; lint has only three pre-existing shared-component Fast Refresh warnings. Eight fee tests pass, including preview disabling, student isolation, shared-data precedence, status totals, and existing fee persistence. Isolated browser checked both reference rows, selected-challan print handoff and document contents, live replacement by a shared Pending voucher, light/dark views, mobile overflow/dialog bounds, and console errors (none observed). Print invocation was intercepted for inspection; no physical printing was performed.

Payment APIs, processing, issued-voucher certification, and server delivery remain outside this frontend task.
