# MVP rewrite: PocketBase + no-auth Slovak servisná knižka

## Important caveats (please re-read)

- **Local-only.** App will only work on machines that can reach your PocketBase server. The Lovable preview window (`*.lovable.app`) runs in your browser, so it CAN reach `http://localhost:8090` on your own PC — but no one else can. Published Lovable URL will be effectively broken for anyone not on your LAN.
- **Mixed content warning.** Lovable preview is HTTPS. Browsers block HTTPS pages from calling `http://localhost`. Chrome allows `http://localhost` specifically as a secure context, so this works in Chrome/Edge; Safari and Firefox may block it. For LAN access from another device you'll need to run PocketBase with HTTPS or accept a browser security exception.
- **No auth = fully open.** Anyone reaching PocketBase can read/write all customer data. PocketBase collections will be created with open API rules.
- **All existing Lovable Cloud data abandoned.** Vehicles, customers, photos in current Supabase will not be migrated.
- **You need to run PocketBase yourself.** I'll provide a `pocketbase/` folder with a setup script + schema JSON, but you have to download the PocketBase binary and run `./pocketbase serve` on your machine.

## Scope

### 1. Remove auth + Lovable Cloud client code
- Delete `/auth` and `/reset-password` routes if present.
- Delete `src/routes/_authenticated/route.tsx` gate. Move all child routes from `src/routes/_authenticated/*` up to `src/routes/*` (garage.index, garage.$vehicleId, plan, service-history, settings).
- `/` redirects to `/garage` (already does).
- Remove logout button from sidebar.
- Uninstall `@supabase/supabase-js`. Delete `src/integrations/supabase/*` and `src/integrations/supabase/auth-attacher.ts` reference in `src/start.ts`.
- Remove `attachSupabaseAuth` from `src/start.ts` `functionMiddleware`.
- Delete all `*.functions.ts` / `*.server.ts` that wrap Supabase calls (this MVP has none critical — direct client reads only).

### 2. PocketBase integration
- `bun add pocketbase`.
- Create `src/lib/pocketbase.ts`:
  ```ts
  import PocketBase from 'pocketbase';
  const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090');
  pb.autoCancellation(false);
  export default pb;
  ```
- Add `VITE_POCKETBASE_URL` placeholder to `.env`.
- Create `pocketbase/README.md` with setup steps (download binary, run `./pocketbase serve`, import schema).
- Create `pocketbase/pb_schema.json` defining 4 collections with open rules:
  - **customers**: first_name, last_name, phone, email, notes
  - **vehicles**: customer (relation), brand, model, year, vin, license_plate, current_mileage, fuel_type, engine, transmission, drive, power, oil_volume, tire_size, status (select), photo (file), notes
  - **service_records**: vehicle (relation), date, mileage_at_service, service_type (select), title, description, parts_replaced, price, technician, next_service_km, next_service_date, photos (file, max 10)
  - **scheduled_tasks**: vehicle (relation), planned_date, planned_mileage, task_type, description, priority (select), status (select)
  - All collections: `listRule = ""`, `viewRule = ""`, `createRule = ""`, `updateRule = ""`, `deleteRule = ""` (open).

### 3. Replace all data layer
Rewrite `src/lib/queries/*.ts` to use PocketBase:
- `vehiclesWithCustomersQuery` → `pb.collection('vehicles').getFullList({ expand: 'customer', sort: '-created' })`
- `vehicleDetailQuery(id)` → `pb.collection('vehicles').getOne(id, { expand: 'customer' })`
- `serviceHistoryQuery(vehicleId)` → `pb.collection('service_records').getFullList({ filter: \`vehicle="${id}"\`, sort: '-date' })`
- `plannedTasksQuery` → `pb.collection('scheduled_tasks').getFullList({ filter: 'status != "Zrušené"', sort: 'planned_date', expand: 'vehicle.customer' })`
- All mutations (add/edit/delete vehicle, customer, service record, scheduled task) → corresponding `pb.collection(...).create/update/delete` calls.
- Photos: `pb.files.getUrl(record, filename)` instead of Supabase storage paths. Update `src/lib/vehiclePhoto.ts` and `src/lib/photos.ts`.

### 4. UI changes (Slovak, dark theme, existing tokens)
Most UI already exists in Slovak and matches the spec. Targeted changes:
- **Dashboard header (`DashboardHeader.tsx`)**: Add today's date right side in Slovak long format using `date-fns` + `sk` locale: `format(new Date(), "EEEE d. MMMM yyyy", { locale: sk })`. Title text: "Servisná knižka | Autoservis Bartalos".
- **Search debounce** already 300ms. Add min-2-chars guard before filtering.
- **Filter pills**: convert `VehicleFilters` Select to pill row: ALL | OK | SERVIS NUTNÝ | NAPLÁNOVANÉ | ARCHÍV.
- **Vehicle detail tabs**: `garage.$vehicleId.tsx` currently shows service history inline. Wrap in shadcn `Tabs` with two tabs: "Servisná história" and "Plánované úkony". Move plan items for this vehicle into tab 2 with add/complete/delete actions (new component `VehicleScheduledTasksSection`).
- **Inline mileage edit**, **clickable status badge** on detail page (click → small popover with status options).
- **Connection error banner**: top-level component listening for failed PB requests (React Query `onError`), shows: "⚠️ Nie je možné pripojiť k databáze. Skontrolujte sieť."
- **Empty search state**: "Žiadne vozidlá nezodpovedajú hľadaniu."

### 5. Realtime
- In `garage.index.tsx`, `useEffect` subscribes to `pb.collection('vehicles').subscribe('*', () => queryClient.invalidateQueries({ queryKey: ['vehicles', 'with-customers'] }))`. Unsubscribe on unmount.
- Same pattern on detail page for that vehicle's service_records and scheduled_tasks.

### 6. Settings page
- Remove theme switcher (light mode optional). Keep page minimal: app info, PocketBase URL display, "Reset connection" button. Or just delete /settings — confirm if you want it gone.

## Technical notes (skip if non-technical)

- `pb.autoCancellation(false)` so React Query refetches don't get auto-cancelled by PocketBase SDK.
- React Query keys stay the same so cached UI updates work; only `queryFn` bodies change.
- File uploads to PocketBase use `FormData` — `pb.collection('vehicles').create(formData)`.
- TanStack Start prerender will execute `pb` calls during `build:dev` SSR. Since PocketBase won't be reachable during build, all routes that read from PB must either (a) be `ssr: false` or (b) only fetch in the component via `useQuery` (not in loader). I'll make all data routes `ssr: false` to keep things simple.
- `.env`: add `VITE_POCKETBASE_URL=http://localhost:8090` as default.

## Out of scope

- Migrating existing Lovable Cloud data
- Light theme (theme switcher will be removed unless you want to keep it)
- Hosting PocketBase publicly / HTTPS setup
- Any form of access control

## Deliverables

1. `pocketbase/pb_schema.json` + `pocketbase/README.md` (run instructions)
2. New data layer hitting PocketBase
3. Auth fully removed, routes flattened
4. Dashboard header with Slovak date, filter pills, error banner
5. Vehicle detail with tabs (history + scheduled) and inline edits
6. Realtime subscriptions on garage list and vehicle detail
7. Updated `.env`

Confirm and I'll build it. One open question: **keep `/settings` page or delete it?**
