## Remaining MVP work

### 1. Dashboard header — Slovak date
`src/components/garage/DashboardHeader.tsx`
- Replace subtitle with today's date formatted via `date-fns` `format(new Date(), "EEEE d. MMMM yyyy", { locale: sk })` → e.g. "streda 17. júna 2026".
- Capitalize first letter. Keep "Pridať vozidlo" button.

### 2. Filter pills (ALL / OK / SERVIS NUTNÝ / NAPLÁNOVANÉ / ARCHÍV)
`src/components/garage/VehicleFilters.tsx`
- Replace the status `Select` with horizontal pill buttons. Each pill shows label + live count for that status (computed from full vehicle list).
- Active pill: `bg-brand-accent text-white`. Inactive: `bg-brand-surface border-brand-border text-brand-fg`.
- Keep fuel `Select` as-is.
- `src/routes/garage.index.tsx` passes the full unfiltered list to compute counts.

### 3. Empty search state
`src/components/garage/EmptyState.tsx` — already handles empty list. Add a `variant="no-results"` mode rendering "Žiadne vozidlá nezodpovedajú hľadaniu." when search/filter active.

### 4. Connection error banner
New `src/components/app/ConnectionBanner.tsx`:
- Subscribes to `vehiclesWithCustomersQuery` status via `useQuery` (already cached).
- If `error` is a network/connection error (e.g. `TypeError` / `pb` health probe fails), renders a sticky top banner: "⚠️ Nie je možné pripojiť k databáze. Skontrolujte sieť."
- Mount inside `src/components/app/AppShell.tsx` above the main content so it appears on every page.
- Also call `pb.health.check()` on mount + every 15s while errored, to auto-dismiss when reconnected.

### 5. Realtime subscriptions
New `src/hooks/usePocketBaseRealtime.ts`:
- `usePocketBaseRealtime(collection, queryKeys)`: subscribes via `pb.collection(collection).subscribe("*", ...)` and calls `queryClient.invalidateQueries` for each key on any event. Unsubscribes on unmount.
- Wire into `src/routes/garage.index.tsx` for `vehicles` → invalidates `["vehicles", "with-customers"]`.
- Wire into `src/routes/garage.$vehicleId.tsx` for `vehicles`, `service_records`, `scheduled_tasks` → invalidates the relevant detail/list keys.
- Wire into `src/routes/service-history.tsx` for `service_records` → `["service-history"]`.
- Wire into `src/routes/plan.tsx` for `scheduled_tasks`.

### 6. Settings page cleanup
`src/routes/settings.tsx`
- Keep `ThemeSettingCard` (user invested in light-mode polish — preserve it).
- Drop the "Rýchle akcie" / link-to-garage card (redundant with sidebar).
- Add a new `PocketBaseStatusCard`:
  - Shows current `VITE_POCKETBASE_URL` (read-only, monospace).
  - "Testovať pripojenie" button → calls `pb.health.check()`, shows ✓/✗ + latency.
  - Short hint: "URL sa nastavuje v súbore `.env`."
- `DataSafetyCard` stays as info copy.

### 7. PocketBase schema + Slovak setup guide
New `pocketbase/pb_schema.json` (importable in one click via Admin UI → Settings → Import collections):
- `customers` — `first_name` text req, `last_name` text req, `phone` text req, `email` email opt, `notes` text opt.
- `vehicles` — `customer` relation→customers (single, required, cascadeDelete), `brand` text req, `model` text req, `year` number opt, `vin` text opt (unique nullable), `license_plate` text req unique, `current_mileage` number req default 0, `fuel_type` select(benzín,diesel,hybrid,elektro,LPG) opt, `status` select(OK,SERVIS NUTNÝ,NAPLÁNOVANÉ,ARCHÍV) req default OK, `photo` file single (10MB, image/jpeg|png|webp), `notes` text opt, plus tech fields `engine`, `transmission`, `power`, `drive`, `oil_volume`, `tire_size` (text opt).
- `service_records` — `vehicle` relation→vehicles (req, cascadeDelete), `date` date req, `mileage_at_service` number req, `service_type` text req, `title` text req, `description` text req, `parts_replaced` text opt, `price` number opt, `technician` text opt, `next_service_km` number opt, `next_service_date` date opt, `photos` file multi (max 10, 10MB, image/jpeg|png|webp).
- `scheduled_tasks` — `vehicle` relation→vehicles (req, cascadeDelete), `planned_date` date req, `planned_mileage` number opt, `task_type` text req, `description` text req, `priority` select(Nízka,Stredná,Vysoká) req default Stredná, `status` select(Čakajúce,Splnené,Zrušené) req default Čakajúce.
- All collections: `listRule`, `viewRule`, `createRule`, `updateRule`, `deleteRule` all set to `""` (open — no auth).

New `pocketbase/SETUP.md` (Slovak):
1. **Stiahnutie PocketBase pre Windows** — link na https://github.com/pocketbase/pocketbase/releases, vybrať `pocketbase_X.X.X_windows_amd64.zip`, rozbaliť do napr. `C:\pocketbase\`.
2. **Prvé spustenie** — `cd C:\pocketbase` → `pocketbase.exe serve --http=0.0.0.0:8090` (0.0.0.0 = počúva na všetkých sieťových adaptéroch, nutné pre LAN).
3. **Admin účet** — otvoriť `http://localhost:8090/_/`, vytvoriť admin email + heslo.
4. **Import schémy** — Admin UI → ⚙️ Settings → Import collections → vybrať `pocketbase/pb_schema.json` z tohto projektu → "Review" → "Confirm and import". Hotovo.
5. **Overenie pravidiel** — pre každú kolekciu (customers, vehicles, service_records, scheduled_tasks) Admin UI → Collection → API Rules — všetkých 5 pravidiel (List, View, Create, Update, Delete) musí byť **prázdnych** (= verejný prístup). Schéma to už nastavuje, ale skontrolovať.
6. **Zistenie LAN IP** — `cmd` → `ipconfig` → nájsť "IPv4 Address" pre Wi-Fi/Ethernet (napr. `192.168.1.42`).
7. **Nastavenie URL v aplikácii** — v koreňovom `.env` súbore projektu: `VITE_POCKETBASE_URL=http://192.168.1.42:8090`. Reštart dev servera.
8. **Firewall** — Windows Defender Firewall → Inbound rules → New rule → Port 8090 TCP → Allow.
9. **Test z iného zariadenia** — z mobilu/tabletu na rovnakej Wi-Fi otvoriť `http://192.168.1.42:8090/_/` — ak vidíš admin UI, LAN prístup funguje.
10. **Poznámka o bezpečnosti** — všetky kolekcie sú verejné (bez prihlásenia), takže PocketBase server **nikdy** nevystavovať na verejný internet bez ďalších opatrení.

### Out of scope
- HTTPS / public hosting
- Data migration from Lovable Cloud
- Per-user access control

### Files touched
- modify: `DashboardHeader.tsx`, `VehicleFilters.tsx`, `EmptyState.tsx`, `AppShell.tsx`, `garage.index.tsx`, `garage.$vehicleId.tsx`, `service-history.tsx`, `plan.tsx`, `settings.tsx`
- new: `ConnectionBanner.tsx`, `usePocketBaseRealtime.ts`, `PocketBaseStatusCard.tsx`, `pocketbase/pb_schema.json`, `pocketbase/SETUP.md`
- delete: "Rýchle akcie" card block from `settings.tsx`
