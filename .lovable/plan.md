## Goal
Add a vehicle detail page at `/garage/$vehicleId` showing identity header, customer, technical specs, and service history. Wire dashboard cards to navigate to it. Action buttons are placeholders.

## Routing
- New file `src/routes/_authenticated/garage.$vehicleId.tsx` → URL `/garage/$vehicleId`.
  - Loader primes both queries via `context.queryClient.ensureQueryData`.
  - Component uses `useSuspenseQuery` for vehicle+customer and a regular `useQuery` for service records (history can stream).
  - `errorComponent` and `notFoundComponent` provided.
- `src/routes/_authenticated/garage.tsx`: wire `<VehicleCard onClick>` to `navigate({ to: "/garage/$vehicleId", params: { vehicleId: v.id } })` via `useNavigate`. Remove the `openVehicle` toast.
- `src/components/garage/VehicleCard.tsx`: no change — keep `onClick(v)` API.

> Note: `garage.tsx` is currently a leaf at `/garage`. Adding a sibling `garage.$vehicleId.tsx` is the standard flat convention and does not require converting `garage.tsx` into a layout.

## Data layer (`src/lib/queries/vehicles.ts`)
Add two new query factories alongside the existing list query:

```ts
vehicleDetailQuery(vehicleId)  // queryKey: ["vehicle", vehicleId]
  -> select * from vehicles + customer:customers(*) where id = vehicleId .single()
serviceHistoryQuery(vehicleId) // queryKey: ["vehicle", vehicleId, "service-records"]
  -> select * from service_records where vehicle_id = vehicleId order by date desc
```

Types: `VehicleDetail` (full vehicle row + full customer), `ServiceRecord` (full row). Throw on Supabase error; throw `notFound()` from the loader when vehicle row is null.

## Components (`src/components/garage/detail/`)
- `VehicleDetailHeader.tsx` — back link "Späť na garáž" (`<Link to="/garage">`), title `YEAR BRAND MODEL`, status badge, photo or "Bez fotky" placeholder (reuse Car icon pattern from VehicleCard), metadata row (VIN, ŠPZ, Nájazd), action buttons "Upraviť" / "Naplánovať" / "+ Pridať záznam" → toast `"Táto funkcia bude doplnená v ďalšom kroku"`.
- `CustomerInfoCard.tsx` — "Zákazník" card; name, phone (prominent, `tel:` link), email (`mailto:` if present), notes if present.
- `VehicleSpecsCard.tsx` — "Technické špecifikácie" card; definition list. Rule: hide empty rows entirely (cleaner than dashes). Fields: Motor (engine), Prevodovka (transmission), Pohon (drive), Výkon (power), Objem oleja (oil_volume), Rozmer pneu (tire_size), Typ paliva (fuel_type). If all empty → render muted "Žiadne údaje".
- `ServiceTypeBadge.tsx` — small badge keyed by service_type substring match: Kompletný servis → blue, Výmena oleja → amber, Výmena bŕzd → red, Kontrola/diagnostika → gray, fallback → neutral dark.
- `ServiceRecordCard.tsx` — `<button>` whole-card toggle (uses `useState` local), `aria-expanded`. Collapsed: title, date (sk-SK), `Nájazd pri servise`, `ServiceTypeBadge`, price if present, 1–2 line description preview (`line-clamp-2`). Expanded: full description, parts_replaced, technician, next_service_km, next_service_date — each with Slovak label, hidden when null.
- `ServiceHistorySection.tsx` — "Servisná história" title with count `"N záznamov"` (Slovak plural: 1 záznam / 2–4 záznamy / 5+ záznamov). Renders list of `ServiceRecordCard` or `EmptyState` ("Zatiaľ bez servisnej histórie" / "Pre toto vozidlo ešte nebol pridaný žiadny servisný záznam." / "+ Pridať záznam" button → toast).
- `VehicleDetailSkeleton.tsx` — header skeleton, two column skeleton blocks for customer/specs, 3 service card skeletons.

Reuse existing `StatusBadge`, `EmptyState`.

## Page composition (route component)
```
<AppShell>
  <div className="mx-auto max-w-7xl flex flex-col gap-6">
    <VehicleDetailHeader vehicle={...} onAction={toast} />
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-6">
        <CustomerInfoCard customer={...} />
        <VehicleSpecsCard vehicle={...} />
      </div>
      <ServiceHistorySection records={...} loading={...} />
    </div>
  </div>
</AppShell>
```
On mobile (default), the grid collapses to single column; section order matches the spec (header → customer → specs → history).

Loading: route loader awaits vehicle detail (critical) and primes (non-blocking) service history; show `<VehicleDetailSkeleton />` via `pendingComponent`. Within the page, while `serviceHistoryQuery` is loading, show 3 skeleton cards inside the history section.

## Backend access
RLS already permits `anon SELECT` on `vehicles` and `customers`. `service_records` currently has only `TO authenticated` policies; anon reads will return empty. Add a minimum migration:

```sql
GRANT SELECT ON public.service_records TO anon;
CREATE POLICY "Service records: anon read" ON public.service_records FOR SELECT TO anon USING (true);
```

## Verification
- Click a card on `/garage` → URL becomes `/garage/<uuid>`, detail page renders with seeded data.
- Back link returns to `/garage`.
- Vehicle with no service records shows empty state.
- Each service record expands/collapses on click.
- All action buttons show the placeholder toast.

## Final summary (delivered after build)
1. Routes: `src/routes/_authenticated/garage.$vehicleId.tsx`. Components under `src/components/garage/detail/`: `VehicleDetailHeader`, `CustomerInfoCard`, `VehicleSpecsCard`, `ServiceTypeBadge`, `ServiceRecordCard`, `ServiceHistorySection`, `VehicleDetailSkeleton`.
2. Queries: `vehicleDetailQuery(id)`, `serviceHistoryQuery(id)` in `src/lib/queries/vehicles.ts` (or split into `service-records.ts`).
3. Placeholders: Upraviť, Naplánovať, +Pridať záznam (header + empty state) all toast.
4. Navigation: dashboard `VehicleCard` click → detail route via `useNavigate`.