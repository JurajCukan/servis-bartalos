## Fix vehicle-card navigation: /garage/$vehicleId never renders the detail page

### Root cause

Flat file-based routing makes `garage.tsx` the parent of `garage.$vehicleId.tsx` (confirmed in `routeTree.gen.ts`: `AuthenticatedGarageVehicleIdRoute … parentRoute: () => AuthenticatedGarageRoute`). Because `garage.tsx`'s component is the dashboard (no `<Outlet />`), child route matches mount nothing — the parent dashboard always wins.

This matches the `tanstack-route-architecture` rule: a parent that has children MUST render `<Outlet />` or move its page body into a `*.index.tsx` sibling.

Confirmed in preview: visiting `/garage/957f...` (direct URL) still rendered the Moja Garáž dashboard, not the detail page. The `VehicleCard` `onClick` → `navigate()` wiring is correct; the failure is downstream in route nesting. (Click ring appears on cards, so handlers fire; the URL change just resolves to the parent component.)

### Fix

Rename `src/routes/_authenticated/garage.tsx` → `src/routes/_authenticated/garage.index.tsx`. With the rename:
- `/garage` is served by the new `garage.index.tsx` leaf.
- `/garage/$vehicleId` becomes a sibling leaf (no shared parent file), so its component renders directly under `_authenticated`'s `<Outlet />`.

No code edits inside the file — just the move. The `createFileRoute("/_authenticated/garage/")` path string used by index routes is the same `/_authenticated/garage` it currently uses; TanStack accepts both for an index file. If `routeTree.gen.ts` rebuilds the union without `"/garage"` literal due to the index suffix, no consumer of `to: "/garage"` breaks (sidebar uses `to: "/garage"` which remains valid for index routes).

### Out of scope (explicit non-changes)

- No redesign, no new features.
- `VehicleCard`, `VehicleGrid`, `useNavigate` wiring untouched — they were never broken.
- Photo upload: still not implemented.
- Detail page (`garage.$vehicleId.tsx`), add-service-record dialog, schedule dialog, service history: untouched.

### Verification

1. Click any vehicle card on `/garage` → URL becomes `/garage/<id>` and the detail page renders (header, customer card, specs, service history).
2. Browser back returns to `/garage` with grid intact.
3. On detail, click "+ Pridať záznam" → `AddServiceRecordDialog` opens.
4. Save a record → service history list refreshes (already validated previously).
5. Sidebar "Vozidlá" still active on `/garage` and on `/garage/$vehicleId`.

### Files

**Renamed:** `src/routes/_authenticated/garage.tsx` → `src/routes/_authenticated/garage.index.tsx` (no content change).
