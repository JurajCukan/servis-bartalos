## Goal
Add safe delete flows for vehicles and individual service records, accessible from the existing edit dialogs, with confirmation dialogs and proper cleanup of related DB rows and storage photos.

## Part A — Delete service record

In `EditServiceRecordDialog`:
- Add a divider + dangerous "Odstrániť záznam" button (destructive variant) at the bottom of the form, separated from Save/Cancel.
- Clicking opens an `AlertDialog`:
  - Title: "Odstrániť servisný záznam?"
  - Body: "Táto akcia sa nedá vrátiť späť."
  - Actions: "Zrušiť" / "Odstrániť" (destructive).
- On confirm:
  1. Best-effort `deletePhotos(record.photo_paths)` from the `service-photos` bucket.
  2. `DELETE` the `service_records` row by id.
  3. Close both dialogs, toast `"Servisný záznam bol odstránený"`.
  4. Invalidate queries: `["vehicle", vehicleId, "service-records"]`, `["vehicle", vehicleId]`, `["service-history"]`, `["vehicles"]`.
- On failure: keep dialog open, toast `"Servisný záznam sa nepodarilo odstrániť"`.

## Part B — Delete vehicle

In `EditVehicleDialog`:
- Add a divider + dangerous "Odstrániť vozidlo" button at the bottom.
- Clicking opens an `AlertDialog`:
  - Title: "Odstrániť vozidlo?"
  - Body lists what will be removed: vehicle data, servisná história, naplánované úkony, pripojené fotky. Customer is preserved (one short line). Ends with "Táto akcia sa nedá vrátiť späť."
- On confirm:
  1. `SELECT id, photo_paths FROM service_records WHERE vehicle_id = ?` to gather all record photo paths.
  2. Best-effort `deletePhotos([...all record paths])` from `service-photos`.
  3. Best-effort `deleteVehiclePhoto(vehicle.photo_path)` from `vehicle-photos`.
  4. `DELETE FROM scheduled_tasks WHERE vehicle_id = ?`.
  5. `DELETE FROM service_records WHERE vehicle_id = ?`.
  6. `DELETE FROM vehicles WHERE id = ?`.
  7. Customer row is intentionally NOT deleted.
- Storage failures are logged (warn) and do not block DB deletion.
- On success: close dialogs, `router.navigate({ to: "/garage" })`, toast `"Vozidlo bolo odstránené"`, invalidate `["vehicles"]`, `["service-history"]`, `["scheduled-tasks"]`, `["customers"]`.
- On DB failure: keep dialog open, toast `"Vozidlo sa nepodarilo odstrániť"`.

## Backend changes

One migration adding narrow anon DELETE policies (auth role already has ALL):

```sql
CREATE POLICY "Service records: anon delete" ON public.service_records
  FOR DELETE TO anon USING (true);
CREATE POLICY "Scheduled tasks: anon delete" ON public.scheduled_tasks
  FOR DELETE TO anon USING (true);
CREATE POLICY "Vehicles: anon delete" ON public.vehicles
  FOR DELETE TO anon USING (true);
```

Storage delete policies for both buckets already exist for anon — no storage changes needed.

No schema changes, no grants beyond existing (anon already has table-level privileges from prior migrations; if a grant is missing the migration will add `GRANT DELETE ON ... TO anon`).

## Files

Created:
- `src/components/garage/detail/DeleteServiceRecordButton.tsx` — destructive button + AlertDialog + mutation. Receives `record`, `vehicleId`, `onDeleted`.
- `src/components/garage/edit/DeleteVehicleButton.tsx` — destructive button + AlertDialog + mutation. Receives `vehicle`, `onDeleted`.
- `supabase/migrations/<timestamp>_anon_delete_policies.sql`.

Edited:
- `src/components/garage/detail/EditServiceRecordDialog.tsx` — render `DeleteServiceRecordButton` inside the dialog body footer area; `onDeleted` calls `close()`.
- `src/components/garage/detail/ServiceRecordForm.tsx` — accept an optional `footerSlot` so the delete button sits inside the form's footer cleanly (alternative: render below the form inside the dialog). Final decision: render below the form inside the dialog with a `<Separator />` and a small "Nebezpečná zóna" label, keeping the form untouched.
- `src/components/garage/edit/EditVehicleDialog.tsx` — render `DeleteVehicleButton` at the bottom inside a "Nebezpečná zóna" section; on delete success navigate to `/garage` via `useNavigate()` from `@tanstack/react-router`.

No changes to: `ServiceRecordCard`, `VehicleDetailHeader`, route tree, queries, or types.

## UX details

- Use existing `AlertDialog` from `@/components/ui/alert-dialog` (already in project).
- Destructive button: `variant="destructive"` with `Trash2` icon from lucide-react, full width on mobile.
- "Nebezpečná zóna" header: small `text-xs uppercase text-brand-muted` label above the button, with `Separator` (or `<div className="h-px bg-brand-border" />` to match existing style).
- Buttons disabled while mutation is pending; button label switches to "Odstraňujem…".

## Out of scope
Undo, recycle bin, bulk delete, cascading customer cleanup, redesign of cards, batch UI.
