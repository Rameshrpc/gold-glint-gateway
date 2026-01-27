
Goal: Stop the repeating “Failed to fetch loans” toast and make the Loans/Loan Creation screen load normally.

What’s happening (root cause)
- The toast repeats because the app is stuck in a re-render loop that keeps re-triggering data fetches.
- After the recent “feature flags refresh” work, `usePermissions()` calls `refreshClient()` inside a `useEffect` that depends on `refreshClient`.
- In `useAuth.tsx`, `refreshClient` is currently created as a new function on every render (not memoized). That means:
  1) render → `refreshClient` reference changes
  2) `usePermissions` effect runs again → calls `refreshClient` → updates `client` state
  3) client update → render again → new `refreshClient` function → effect runs again…
- On the Loans page, every time `client` updates, `fetchLoans()` runs again. Since `fetchLoans()` is failing (for whatever backend reason), you see “Failed to fetch loans” repeatedly.

Key fix
1) Make `refreshClient` stable (memoized) so `usePermissions` does NOT re-run endlessly.

Secondary improvements (so we can see the real backend error)
2) Improve error reporting for the Loans fetch:
   - Log the actual error to console
   - Show `error.message` in the toast description
   - Deduplicate the toast using a fixed toast `id` so even if it happens again, it won’t spam the UI

Files involved
A) src/hooks/useAuth.tsx (main loop fix)
- Change `refreshClient` to be wrapped in `useCallback`, with dependencies like `profile?.client_id`.
- Add a “no-op if unchanged” guard before calling `setClient`:
  - If the fetched client id + supports flags are identical to current `client`, don’t call `setClient`.
  - This prevents unnecessary rerenders even in normal cases.

B) src/hooks/usePermissions.tsx (effect stability)
- Keep calling `refreshClient()` on mount, but ensure the effect does not thrash:
  - With `refreshClient` now stable, the effect will run once on mount (and again only when user/client truly changes).
- Add basic guards:
  - If no authenticated `user?.id`, skip loading permissions.
  - If profile/client not ready, skip refreshClient.

C) src/pages/Loans.tsx (stop toast spam + reveal real error)
- Update `fetchLoans()` catch block to:
  - `console.error('Failed to fetch loans', error)`
  - `toast.error('Failed to fetch loans', { id: 'fetch-loans', description: error?.message ?? 'Unknown error' })`
- Also set `setLoading(true)` at the start of `fetchLoans()` for cleaner loading behavior.

D) src/pages/Interest.tsx (same error treatment)
- Apply the same toast `id` + `description` + console logging so Interest screen is also clean.

How we’ll test (quick checklist)
1) Login as the tenant user who sees the issue.
2) Open Loans page (and open Loan Creation form).
3) Confirm:
   - The “Failed to fetch loans” toast does not keep repeating.
   - Network activity stops thrashing (no constant refetch loop).
4) If “Failed to fetch loans” still appears once:
   - Read the toast description + console error to see the real backend reason (401/403/RLS, invalid select, etc.).
   - Then we fix the underlying backend permission/query issue in the next step.

Expected outcome
- The infinite re-render loop stops.
- The loan fetch is called once per normal page load (or when it should refresh).
- If there’s still a genuine backend error, it becomes visible and actionable (instead of a vague repeating toast).

Notes / likely follow-up
- If the new detailed error shows a permission/authorization problem, we’ll adjust the backend RLS policy or the query accordingly. Right now, the DB policies for `loans` look correct, so the most probable cause is the frontend loop + lack of error details hiding the actual message.
