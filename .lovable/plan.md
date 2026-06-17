## Build /service-history

### Route
- `src/routes/_authenticated/service-history.tsx` — loader primes `serviceHistoryQuery` via `context.queryClient.ensureQueryData`; component uses `useSuspenseQuery`. Reads search params `q`, `type` via `validateSearch` (zod) so filter state lives in the URL and is shareable. `errorComponent` + `notFoundComponent` per route rules.
- Sidebar: add `to: "/service-history"` to the "História servisu" item and widen the `NavItem.to` literal union to include it.

### Query
`src/lib/queries/serviceHistory.ts`:
- `ServiceHistoryItem` joined shape (record fields + `vehicle: { id, brand, model, license_plate }` + `customer: { first_name, last_name }`).
- `serviceHistoryQuery = queryOptions({ queryKey: ["service-history","all"], queryFn })` selecting `service_records.* , vehicles!inner(id, brand, model, license_plate, customers!inner(first_name, last_name))`, ordered by `date desc, created_at desc`. RLS already allows anon SELECT on all three tables — no migration needed.

### Components (under `src/components/service-history/`)
- `ServiceHistoryPageHeader.tsx` — title "História servisu", subtitle "Prehľad všetkých servisných záznamov."
- `ServiceHistoryFilters.tsx` — search Input (placeholder per spec) + Select for Typ servisu with the 11 listed options + "Všetky typy". Controlled via URL search params (`useNavigate({ search: prev => ... })`).
- `ServiceHistoryList.tsx` — receives filtered items, renders `ServiceHistoryItem` list; handles "no results" empty state vs "no records at all" empty state via props.
- `ServiceHistoryItem.tsx` — Card showing title, date (sk locale), `ServiceTypeBadge` (reuse existing), price (if present), brand+model+ŠPZ, customer name, mileage, description preview (line-clamp-2). Right side: "Zobraziť vozidlo" Link → `/garage/$vehicleId`. Compact, no expand/collapse this iteration (kept simple per spec).
- `ServiceHistorySkeleton.tsx` — 5 skeleton cards.
- `EmptyServiceHistoryState.tsx` — two variants via `variant: "empty" | "no-results"` with the exact Slovak copy from the spec.

### Filtering
Client-side `useMemo` over the joined dataset:
- search: lowercase q matched against customer full name, license_plate, brand, model, title, service_type, description.
- type: exact match on `service_type` unless "all".

### Loading & errors
Route uses Suspense via `useSuspenseQuery`; wrap list in `<Suspense fallback={<ServiceHistorySkeleton />}>` inside the page so filters stay interactive. `errorComponent` shows simple Slovak error with retry calling `router.invalidate()`.

### Out of scope (explicit non-changes)
- No edit/delete/export/photo gallery/notifications.
- Vehicle detail page untouched.
- No DB migration (existing anon SELECT policies on `service_records`, `vehicles`, `customers` suffice).
- No visual redesign of existing screens.

### Files
**Created:** `src/routes/_authenticated/service-history.tsx`, `src/lib/queries/serviceHistory.ts`, 6 components under `src/components/service-history/`.
**Edited:** `src/components/app/AppSidebar.tsx` (add route + widen union).
