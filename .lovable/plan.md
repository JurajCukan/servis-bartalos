## Goal
Add a working "Pridať servisný záznam" flow from the vehicle detail page: dialog with validated form → insert into `service_records` → bump `vehicles.current_mileage` if higher → optionally create a `scheduled_tasks` row → refresh queries.

## Backend (one migration)
Open up the minimum writes for the no-auth internal app:
```sql
GRANT INSERT ON public.service_records TO anon;
CREATE POLICY "Service records: anon insert" ON public.service_records
  FOR INSERT TO anon WITH CHECK (true);

GRANT UPDATE (current_mileage, updated_at) ON public.vehicles TO anon;
CREATE POLICY "Vehicles: anon update mileage" ON public.vehicles
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

GRANT INSERT, SELECT ON public.scheduled_tasks TO anon;
CREATE POLICY "Scheduled tasks: anon insert" ON public.scheduled_tasks
  FOR INSERT TO anon WITH CHECK (true);
```
Narrow column GRANT on `vehicles` (only `current_mileage`) limits write surface. The Postgres linter will warn about `USING (true)` on UPDATE — that's an accepted trade-off for this always-open internal app and is consistent with prior write policies.

## Form stack
Use `react-hook-form` + `zod` + `@hookform/resolvers/zod` (need to install resolvers) with the existing shadcn `Form`, `Dialog`, `Sheet`, `Input`, `Textarea`, `Select`, `Button`. Use `Dialog` on desktop and `Sheet` (side="bottom", full height) on mobile, switched by a small `useIsMobile` hook (already in `src/hooks` from shadcn template; otherwise a tiny `useMediaQuery`).

## New components (under `src/components/garage/detail/`)
- **`AddServiceRecordDialog.tsx`** — controlled `open`/`onOpenChange`, picks Dialog vs Sheet based on viewport, renders title "Pridať servisný záznam" and `<ServiceRecordForm />`. Handles dialog close on success.
- **`ServiceRecordForm.tsx`** — the form itself. Owns RHF + zod schema, submit handler, loading state, and toast errors. Receives `vehicleId`, `currentMileage`, `onSuccess`.

Schema (Slovak messages):
```ts
z.object({
  date: z.string().min(1, "Toto pole je povinné"),
  mileage_at_service: z.coerce.number().int().positive("Zadajte platný nájazd"),
  service_type: z.string().min(1, "Toto pole je povinné"),
  title: z.string().trim().min(1, "Toto pole je povinné").max(120),
  description: z.string().trim().min(1, "Toto pole je povinné").max(2000),
  parts_replaced: z.string().trim().max(2000).optional().or(z.literal("")),
  price: z.union([z.literal(""), z.coerce.number().positive("Zadajte platnú cenu")]).optional(),
  technician: z.string().trim().max(120).optional().or(z.literal("")),
  next_service_km: z.union([z.literal(""), z.coerce.number().int().positive("Zadajte platný nájazd")]).optional(),
  next_service_date: z.string().optional().or(z.literal("")),
})
```
Defaults: `date = today (YYYY-MM-DD)`, others empty. Service type uses shadcn `Select` with placeholder "Vyberte typ servisu" and the 11 options listed.

Inputs: `<Input type="date">` for dates, `<Input type="number" inputMode="numeric" min={1}>` for km, `<Input type="number" step="0.01" min={0}>` for price, `<Textarea>` for description/parts_replaced. Dark styling consistent with existing brand tokens.

Submit button "Uložiť záznam" (disabled while `isSubmitting`), secondary "Zrušiť" closes the dialog.

## Mutation flow (inside form)
Use a single `useMutation` whose mutationFn does the orchestration:
1. `insert into service_records` with `vehicle_id` + form values (empty strings → null for optional fields).
2. If `mileage_at_service > currentMileage`: `update vehicles set current_mileage = newMileage where id = vehicleId`. If this fails, surface a softer toast but keep the record (the insert already succeeded).
3. If `next_service_km` or `next_service_date` filled: `insert into scheduled_tasks` with:
   - `vehicle_id`, `planned_date = next_service_date || null`, `planned_mileage = next_service_km || null`
   - `task_type = service_type`
   - `description = "Automaticky vytvorené zo servisného záznamu: " + title`
   - `priority = "Stredná"`, `status = "Čakajúce"`
   - If this insert fails, swallow with a warn-toast; main save was successful.

`onSuccess`:
- `queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId, "service-records"] })`
- if mileage changed: `queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] })` and `["vehicles", "with-customers"]`
- `toast.success("Servisný záznam bol uložený")`
- close dialog

`onError`: `toast.error("Servisný záznam sa nepodarilo uložiť")`; form keeps values; submit re-enabled.

## Wiring entry points
- `VehicleDetailHeader` — replace the toast on "+ Pridať záznam" with a controlled open setter passed from the route. Keep the other two action buttons as toast placeholders.
- `ServiceHistorySection` — same: `onAdd` callback now opens the dialog instead of toasting.
- `routes/_authenticated/garage.$vehicleId.tsx` — owns `useState` for dialog open and renders `<AddServiceRecordDialog vehicleId={...} currentMileage={vehicle.current_mileage} open onOpenChange />`.

## Decisions / things to confirm at end
- Scheduled task auto-creation: implemented (best-effort, won't block the main save).
- Vehicle mileage auto-update: implemented (only when entered > current).
- Refresh: via React Query invalidation of `["vehicle", id, "service-records"]` and conditionally `["vehicle", id]`, `["vehicles", "with-customers"]`.

## Files
New: `AddServiceRecordDialog.tsx`, `ServiceRecordForm.tsx`, `src/hooks/use-media-query.ts` (if `use-mobile` not already present).
Edited: `VehicleDetailHeader.tsx`, `ServiceHistorySection.tsx`, `routes/_authenticated/garage.$vehicleId.tsx`.
Install: `@hookform/resolvers`.

## Final summary (delivered after build)
1. New components: `AddServiceRecordDialog`, `ServiceRecordForm` (+ small media-query hook if missing).
2. Backend: anon INSERT on `service_records`, anon UPDATE (column-scoped to `current_mileage`) on `vehicles`, anon INSERT on `scheduled_tasks`, each with a permissive policy.
3. Vehicle mileage auto-update: yes, when new > current.
4. scheduled_tasks auto-creation: yes, best-effort; failure does not block the main save.
5. Refresh: React Query invalidates the service-history and vehicle-detail keys on success.