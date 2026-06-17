## Scope (this iteration)

Build **only the login screen** and a stub `/garage` route, wired to a PocketBase backend via the official JS SDK. No collections are created from the app — those are configured directly in the PocketBase Admin UI (see note at the end).

## What gets built

### 1. PocketBase client
- Install `pocketbase` SDK.
- `src/lib/pocketbase.ts`: single `PocketBase` instance pointing at `http://localhost:8090` (overridable via `VITE_POCKETBASE_URL`). Auth store persists to `localStorage` so sessions survive reloads (PocketBase default tokens last ~30 days).

### 2. Auth helper
- `src/lib/auth.ts`: `login(email, password)`, `logout()`, `isAuthenticated()`, `currentUser()` wrapping `pb.collection('users').authWithPassword(...)`.

### 3. Routes
- `src/routes/index.tsx` → redirect: if authenticated → `/garage`, else → `/login`.
- `src/routes/login.tsx` → login screen (details below). If already authed, redirect to `/garage`.
- `src/routes/_authenticated.tsx` → pathless layout. `beforeLoad` checks `pb.authStore.isValid`; if not, `redirect({ to: '/login' })`. Renders `<Outlet />`.
- `src/routes/_authenticated.garage.tsx` → placeholder page: "Dashboard — coming soon" + "Odhlásiť sa" button that calls `logout()` and navigates to `/login`.

### 4. Login page UI (Slovak)
- Full-screen centered card on `#111111` background, white text, red `#CC0000` accent for the submit button and focus ring.
- H1 "Servisná knižka", subtitle "Autoservis Bartalos".
- Form fields: "Email" (email input), "Heslo" (password input), both required.
- Submit button: "Prihlásiť sa". Shows loading state ("Prihlasujem…") while request runs.
- On error from PocketBase → show "Nesprávny email alebo heslo" below the form.
- On success → `navigate({ to: '/garage' })`.

### 5. Styling
- Use existing Tailwind v4 setup. Add minimal semantic tokens in `src/styles.css` for the brand palette (`--brand-bg: #111111`, `--brand-accent: #CC0000`) and map under `@theme inline` so we can use `bg-brand-bg`, `bg-brand-accent`. No hardcoded hexes in components.

## Out of scope (next iterations)
- Creating PocketBase collections, the `role` field, customers/vehicles/service_records/scheduled_tasks UIs, photo upload, realtime sync, PWA manifest, dashboard content.

## Important note about PocketBase at `localhost:8090`

The Lovable preview runs in your browser, so `http://localhost:8090` means **the PocketBase running on your own machine**. For login to work end-to-end you need to:

1. Have `pocketbase serve` running locally on port 8090.
2. In the PocketBase Admin UI (`http://localhost:8090/_/`) create the `users` auth collection (or use the default one), add a `role` select field (`technik`, `manažér`), and create at least one test user.
3. Add the Lovable preview origin to PocketBase's allowed CORS origins (PocketBase allows all origins by default, but if you tightened it, re-allow the preview URL).

The collections in your PRD (`customers`, `vehicles`, `service_records`, `scheduled_tasks`) should be created in the PocketBase Admin UI before we build those screens — the app will read/write them, not create them. I'll provide a step-by-step setup checklist when we get to those features.

If you'd rather not depend on a local PocketBase from the hosted preview (it won't work for anyone other than you, on your network), say the word and I'll switch the backend to Lovable Cloud instead — same data model, no local server, accessible from any device.
