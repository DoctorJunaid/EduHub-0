# Auth Height and Scroll Fix

## Changes
Auth alone uses `box-sizing: border-box`, `min-height: 100vh` and `height: 100vh`. At desktop widths of at least 1000px and heights of at least 650px, outer padding is included in that height and the shared shell fills the remaining space. Grid tracks and panels have zero automatic minimum height, keeping both columns aligned.

Reduced desktop brand margins, panel padding, benefit gaps, feature-strip padding and form spacing. Shorter laptop viewports receive modest additional adjustments, retaining 40px inputs and 42px buttons. Required content, theme, proportions and typography hierarchy remain. Login retains safe vertical centering.

Correction: removed internal scrolling from both panels. The promo uses `overflow: clip` only to contain its intentionally outlying decorative circles; actual content bounds were measured separately. Desktop validation errors sit beside labels to avoid adding four extra rows. Below 1000px wide or 700px high, automatic page height permits normal document scrolling. No global body overflow lock was added.

## Scope
Modified only `frontend/src/auth/Signup.css`; created this report. No global layout, route, form logic, backend or landing-ui changes.

## Verification
Production build and lint pass; existing shared-component lint warnings remain. Headless Chrome worked outside the sandbox. Measured both routes at 1366×768, 1280×720, 1440×900 and 1024×768: document height equals viewport height, panel content bounds fit, and neither panel has auto/scroll overflow. A 390×844 viewport permits page scrolling with bottom content reachable. Testing 1280×650 exposed insufficient space, so heights below 700px now use the small-height exception. Signup validation was also exercised at 1280×720 to check error-state fit. No dashboard or global layout changes.
