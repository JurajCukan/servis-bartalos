## Scope

Replace PocketBase with Lovable Cloud (Supabase). Keep login UI, routes, and brand tokens identical.

## Steps

### 1. Enable Lovable Cloud
- Call `supabase--enable` to provision the project and generate `@/integrations/supabase/client`, types, and the managed `_authenticated/route.tsx` gate.

### 2. Remove PocketBase
- `bun remove pocketbase`.
- Delete `src/lib/pocketbase.ts`.
- Replace `src/lib/auth.ts` with a Supabase-backed helper exposing `login`, `logout`, `currentUser`, and `useAuth()` (a React hook returning `{ user, profile, loading }` that listens to `onAuthStateChange`). Profile (with `role`) is fetched once after sign-in and cached in a small Zustand-free React context provider mounted in `__root.tsx`.
- On successful sign-in, upsert `public.profiles` row for the user if missing (`id = auth.uid()`, `role = 'technik'` default, `name` from `user_metadata.full_name` or email local-part).

### 3. Routing
- Keep `/login` (top-level, public). It calls `supabase.auth.signInWithPassword`; on success → `/garage`. Error → existing Slovak message.
- Move `/garage` under the Lovable-managed `src/routes/_authenticated/` subtree (rename `src/routes/_authenticated.garage.tsx` → `src/routes/_authenticated/garage.tsx`). Delete the old hand-authored `src/routes/_authenticated.tsx` — the integration ships its own `_authenticated/route.tsx`.
- `src/routes/index.tsx` keeps redirect logic but uses Supabase session (`supabase.auth.getSession()` in `beforeLoad`).
- Logout button calls `supabase.auth.signOut()` then `navigate({ to: '/login' })` with cache teardown per sign-out hygiene.

### 4. Database migration (single migration)
- `public.profiles` (id uuid PK → auth.users, name text, role text check `('technik','manažér')` default `'technik'`, created_at).
- `public.customers`, `public.vehicles`, `public.service_records`, `public.scheduled_tasks` per spec, all with `gen_random_uuid()` PKs, FKs with `ON DELETE CASCADE` for child rows, `updated_at` maintained by a shared trigger `public.set_updated_at()`.
- Unique constraint on `vehicles.license_plate`.
- GRANTs for every new table: `SELECT,INSERT,UPDATE,DELETE TO authenticated` + `ALL TO service_role`. No anon grants (all data is auth-only).
- Enable RLS on all tables.
- Policies:
  - `profiles`: SELECT/UPDATE where `id = auth.uid()`; INSERT where `id = auth.uid()` (so the first-login upsert works).
  - `customers`, `vehicles`, `service_records`, `scheduled_tasks`: four policies each (SELECT/INSERT/UPDATE/DELETE) `TO authenticated` `USING (true)` / `WITH CHECK (true)` — matches the "authenticated users can do all operations" spec.
- Trigger `on_auth_user_created` on `auth.users` to auto-insert into `profiles` (belt-and-braces with the client-side upsert).

### 5. Storage buckets
- `supabase--storage_create_bucket` for `vehicle-photos` and `service-photos`, public = true.
- Migration sets `allowed_mime_types = {image/jpeg,image/png,image/webp}` and `file_size_limit = 10485760` on each bucket via `UPDATE storage.buckets`.
- RLS policies on `storage.objects` for both buckets: SELECT to `public` (bucket is public anyway), and INSERT/UPDATE/DELETE `TO authenticated` scoped to the two bucket ids.

### 6. Seed data
- Use the insert tool to add the 4 customers + 4 vehicles exactly as listed (status, ŠPZ, VIN/mileage/fuel where provided). Seed runs after schema migration. Idempotent via `ON CONFLICT (license_plate) DO NOTHING` on vehicles and a name+phone match for customers.

### 7. Untouched
- Login page JSX, Slovak copy, brand tokens in `src/styles.css`, route paths (`/login`, `/garage`).

## Notes / decisions

- The "users can do all operations" policy is intentionally permissive per the spec; if you later want per-technician scoping (e.g. only your own service records), say the word and I'll tighten to `auth.uid()`-based policies.
- No new pages are built in this iteration — garage stays the "Dashboard — coming soon" placeholder. Seed data is purely so the upcoming dashboard has rows to show.
- Email/password is the only auth method enabled (matches the existing login form). Test users must be created via Cloud → Users.
