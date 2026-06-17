## Goal
Remove all authentication from the app. Open the workshop app directly at `/garage`, no login screen, no session checks. Keep Supabase as the data store; relax RLS so the dashboard works without a signed-in user.

## Routing changes
- `src/routes/index.tsx` → simple `beforeLoad` that `redirect({ to: "/garage" })`. No auth check.
- `src/routes/login.tsx` → delete the file (was the only consumer of `lib/auth.ts`). With the file gone, `/login` falls through to the root 404; if the user prefers a redirect, we can instead keep a tiny stub that redirects to `/garage`. **Default: delete.**
- `src/routes/_authenticated/route.tsx` → remove the auth gate. Convert to a plain pass-through layout: `component: () => <Outlet />`, no `beforeLoad`, drop `ssr: false`. Keep the folder so the existing `/_authenticated/garage.tsx` route file (URL `/garage`) keeps working without renames.

## UI cleanup
- `src/components/app/AppSidebar.tsx`:
  - Remove `useProfileQuery`, `logout`, `useNavigate`, `LogOut` imports.
  - Remove the avatar/initials/name/role block and the "Odhlásiť sa" button.
  - Replace the sidebar footer with a static workshop block:
    - title: `Autoservis Bartalos`
    - subtitle: `Interná servisná aplikácia`
  - Keep nav items unchanged (Vozidlá active, others disabled with "Pripravuje sa" toast).
- `src/routes/_authenticated/garage.tsx` → no changes needed; it already does not read auth state.

## Data/auth layer cleanup
- Delete `src/lib/auth.ts`.
- Delete `src/lib/queries/profile.ts`.
- Leave `src/integrations/supabase/client.ts`, `auth-attacher.ts`, `auth-middleware.ts`, `client.server.ts`, `types.ts` untouched (auto-generated; harmless if unused). `attachSupabaseAuth` in `src/start.ts` is a no-op when there is no session, so leave `src/start.ts` alone.
- No `onAuthStateChange` is currently wired in `__root.tsx`, so nothing to remove there.

## Backend (RLS) — minimum to make queries work anonymously
The dashboard reads `vehicles` joined with `customers`. Current policies are `TO authenticated` only, so anon requests return empty. Minimum migration:

1. `GRANT SELECT ON public.vehicles, public.customers TO anon;`
2. Add `FOR SELECT TO anon USING (true)` policies on `vehicles` and `customers` (read-only public access). Leave write policies authenticated-only for now since this iteration does not add/edit data from the UI.
3. Leave `profiles`, `service_records`, `scheduled_tasks` policies as-is (not used in this iteration).

Rationale: smallest possible change to unblock the seeded dashboard. No schema changes, no data changes.

## Verification
- `/` redirects straight to `/garage`.
- `/garage` renders the seeded vehicles with no login screen, search/filter/sort work.
- Sidebar footer shows the static workshop block, no logout button.
- No code paths still call `lib/auth.ts` or `useProfileQuery` (grep after edits).

## Final summary (to be delivered after build)
1. Removed/changed: `src/routes/login.tsx` (deleted), `src/lib/auth.ts` (deleted), `src/lib/queries/profile.ts` (deleted), `src/routes/index.tsx` (simple redirect), `src/routes/_authenticated/route.tsx` (gate removed), `src/components/app/AppSidebar.tsx` (logout + profile removed, static footer added).
2. Backend: one migration adding `anon` SELECT grants + policies on `vehicles` and `customers`.
3. `/garage` works directly without login.
4. Remaining auth deps: only auto-generated Supabase integration files (`client.ts`, `auth-attacher.ts`, `auth-middleware.ts`, `client.server.ts`) remain on disk but are unused by the app.