# H-P0-009-opencode Review

## Task
Fix the failing `loginReturn.test.jsx` assertion so it proves the full pathname, search, and hash behavior promised by P0-002, without changing production auth code. Additionally fix the hanging `routes.test.jsx` harness.

## Root Cause (loginReturn)
The test at `src/test/loginReturn.test.jsx:101-103` asserted `screen.getByText("Dashboard")` after navigating to `/dashboard/settings?tab=profile`. The test route tree only defines an exact `/dashboard` route (renders `<div>Dashboard</div>`), so the navigation falls through to the `*` catch-all which renders `LocationDisplay` — a component that shows `location.pathname + location.search`. The assertion was looking for text that doesn't exist on the page.

**Production code was correct.** `LoginPage.jsx:53-63` properly builds `navigate(\`${pathname}${search || ""}${hash || ""}\`)`.

## Root Cause (routes hang)
`src/test/routes.test.jsx` used a `renderWithProviders` helper that only defined a `*` catch-all route. When `PublicRoute` detected an authenticated user, it rendered `<Navigate to="/admin">` which matched `*` again, re-rendering `PublicRoute` in an infinite redirect loop.

## Changes Made (test-only)

### `src/test/loginReturn.test.jsx`
1. **`LocationDisplay`**: Added `{location.hash}` rendering so hash assertions can verify the full URL.
2. **Test 1 ("returns to valid internal state.from")**: Changed from `getByText("Dashboard")` to asserting `getByTestId("location").textContent === "/dashboard/settings?tab=profile"` — proves pathname + search are both preserved.
3. **Test 5 ("returns to state.from with hash")**: Changed `from.pathname` from `/dashboard` to `/dashboard/settings` so it hits the catch-all route (not the exact-match `/dashboard` route), allowing `LocationDisplay` to render the hash. Assertion changed to `textContent === "/dashboard/settings#section2"` — proves hash is preserved.

### `src/test/routes.test.jsx`
1. **Removed the generic `renderWithProviders`** that only defined a `*` catch-all route (root cause of the infinite loop).
2. **Replaced with inline route trees** that include explicit destination routes (`/login`, `/admin`, `/superadmin`, `/marketing`) so `Navigate` components resolve to real routes instead of re-matching `*`.
3. **Spinner assertions**: Changed from `getByRole("status")` to `container.querySelector(".animate-spin")` since the spinner div has no ARIA role attribute.
4. **Redirect assertions**: Each redirect test now asserts the **destination route renders** (e.g., `getByText("Admin Dashboard")` for admin, `getByText("Super Admin Dashboard")` for superadmin).
5. **`state.from` preservation**: The unauthenticated ProtectedRoute redirect test now asserts `state.from.pathname` equals the original location via a `FromStateDisplay` component.
6. **Removed unused `vi` import** to fix lint error.

### Config/Dependencies (unchanged from prior P0-009 work)
- `package.json` / `package-lock.json`: vitest 4.1.10, @testing-library/react 16.3.2, @testing-library/jest-dom 6.9.1, @testing-library/user-event 14.6.1, jsdom 29.1.1, eslint 9.39.1
- `vitest.config.js`: jsdom environment, setup file
- `src/test/setup.js`: @testing-library/jest-dom matchers

## Results

| Check | Status | Details |
|-------|--------|---------|
| `npx vitest run src/test/routes.test.jsx` | **9/9 PASS** | All route tests pass and exit cleanly (no hang) |
| `npx vitest run src/test/loginReturn.test.jsx` | **5/5 PASS** | All 5 return-after-login scenarios pass |
| `npx vitest run src/test/authSlice.test.js` | **8/8 PASS** | Auth slice reducer tests pass |
| `npm test` (full suite) | **22/22 PASS** | All 3 test files pass, suite exits in ~9s |
| `eslint` on test/config files | **CLEAN** | No lint errors |
| `npx vite build` | **PASS** | Production build completes in ~22s |

## No Production Code Changed
All changes are confined to test files, test config, and dev dependencies.
