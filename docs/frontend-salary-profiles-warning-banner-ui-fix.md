# Salary Profiles Warning Banner UI Fix

## Original Issue

The Campus Manager Salary Profiles page showed the teachers-without-profile warning as a compressed amber banner. Its warning icon, inline message, and `Configure Profile` action had insufficient breathing room. The action used a raw button with page-specific gradient styling, which made its height and alignment inconsistent with the shared button system.

## Root Cause

`TeachersWithoutProfileAlert.jsx` used compact utility spacing and a custom inline-styled native `<button>`. The warning title and supporting explanation shared a wrapping inline row, while the action could be squeezed against the banner edge. There were no Salary Profiles-scoped layout rules for a minimum banner height, message growth, or mobile stacking.

## Files Modified

- `frontend/src/components/salary/TeachersWithoutProfileAlert.jsx`
- `frontend/src/pages/SalaryProfiles.css`

## Warning Banner Improvements

- Added local `salary-profiles-warning-*` hooks for the banner, message area, icon, copy, and action.
- Added a 68px minimum banner height, 12px by 14px internal padding, and 12px vertical spacing from adjacent Salary Profiles content.
- Set the warning icon container to 32px square and allowed the message region to grow without shrinking the action.
- Displayed the existing primary message and existing explanatory message as distinct stacked lines while retaining the dynamic teacher count and existing copy.
- Kept the existing restrained amber warning background and border treatment.

## Configure Profile Button Improvements

- Replaced the custom native button and inline gradient with the shared `Button` component using its existing small size.
- Added a 150px minimum width, 36px minimum height, and 12px horizontal padding through Salary Profiles-scoped CSS.
- Preserved the existing `onAddProfile` handler and Plus icon.

## Responsive Behavior

- At widths up to 700px, the banner stacks its message and action vertically.
- The action expands to the available width on narrow screens.
- The warning copy may wrap, preventing clipped text or horizontal overflow.

## Logic and Data Safety

No salary, payroll, count, filter, API, Redux, permission, modal, or backend behavior was intentionally changed. The count remains dynamic and the Configure Profile action still calls the existing handler.

## Verification

- `npm.cmd run build` from `frontend`: passed.
- `npm.cmd run lint` from `frontend`: passed with pre-existing repository warnings.
- `git diff --check`: passed.
- No browser/manual runtime verification was performed for this banner.

## Remaining Limitations

The repository retains existing lint warnings outside this focused UI change. Visual behavior at desktop and mobile breakpoints still requires manual browser confirmation.
