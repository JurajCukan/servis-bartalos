## Edit service record flow

Add edit capability for existing rows in `public.service_records` from the vehicle detail page.

### 1. Refactor `ServiceRecordForm` to support create + edit

`src/components/garage/detail/ServiceRecordForm.tsx` is currently create-only and owns the insert + mutation. Refactor it so the form is reusable:

- New prop `mode: "create" | "edit"`.
- New optional `record?: ServiceRecord` (required when `mode === "edit"`).
- Default values come from `record` when editing; from blanks + today + currentMileage placeholder when creating.
- Submit handler branches:
  - `create` → existing INSERT + best-effort `vehicles.current_mileage` bump + optional `scheduled_tasks` insert. Toast `"Servisný záznam bol uložený"`.
  - `edit` → `UPDATE public.service_records SET ... WHERE id = record.id`. After success, if `mileage_at_service > vehicle.current_mileage`, best-effort bump `vehicles.current_mileage` (same pattern as create). **No** scheduled_tasks sync on edit (out of scope per request). Toast `"Servisný záznam bol upravený"`.
- Submit button label: `"Uložiť záznam"` (create) vs `"Uložiť zmeny"` (edit).
- Error toast: `"Servisný záznam sa nepodarilo uložiť"`.
- Invalidations after either mode:
  - `["vehicle", vehicleId, "service-records"]`
  - `["vehicle", vehicleId]` (whenever mileage may have changed; safe to always invalidate)
  - `["vehicles", "with-customers"]` (garage list mileage badge)
  - `["service-history"]` (global page list — best-effort key match)

### 2. New `EditServiceRecordDialog`

`src/components/garage/detail/EditServiceRecordDialog.tsx` — mirrors `AddServiceRecordDialog`:

- Responsive: `Dialog` on desktop, `Sheet` (bottom, 95vh) on mobile.
- Title: `"Upraviť servisný záznam"`.
- Renders `<ServiceRecordForm mode="edit" record={...} vehicleId currentMileage onCancel onSuccess />`.

### 3. Add "Upraviť" affordance to `ServiceRecordCard`

`src/components/garage/detail/ServiceRecordCard.tsx` currently wraps the whole card in a `<button>` toggle. Nested buttons are invalid HTML, so refactor:

- Outer element becomes a `<div>` with the same styling.
- The clickable expand/collapse area becomes a `<button>` covering the header row (title + meta) and chevron — keyboard accessible.
- Add a small `<button>` "Upraviť" (icon + text, subtle ghost style) in the top-right of the card next to the chevron, with `onClick={(e) => { e.stopPropagation(); onEdit(record); }}`. Render only when `onEdit` prop is provided so the same card stays reusable from the global service-history page without an edit button (out of scope this iteration).

New prop on `ServiceRecordCard`: `onEdit?: (record: ServiceRecord) => void`.

### 4. Wire from `ServiceHistorySection` and route

- `src/components/garage/detail/ServiceHistorySection.tsx`: accept new prop `onEdit?: (record: ServiceRecord) => void` and pass it through to each `ServiceRecordCard`.
- `src/routes/_authenticated/garage.$vehicleId.tsx`: add `editingRecord` state (`ServiceRecord | null`). Pass `onEdit={setEditingRecord}` into `ServiceHistorySection`. Render `<EditServiceRecordDialog open={!!editingRecord} record={editingRecord} onOpenChange={(o) => !o && setEditingRecord(null)} vehicleId currentMileage={vehicle.current_mileage} />`.

The global `/service-history` page does NOT pass `onEdit`, so no edit button appears there — explicitly out of scope per the user's request.

### 5. Validation (unchanged from create form)

Required: `title`, `date`, `service_type`, `mileage_at_service`. Same Slovak messages. `price`, `next_service_km` already coerced; empties become `null` on save.

### 6. Backend

`public.service_records` already has `Service records: anon read` and `Service records: anon insert`, but **no anon UPDATE**. Add minimum delta:

```sql
CREATE POLICY "Service records: anon update" ON public.service_records
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
GRANT UPDATE ON public.service_records TO anon;
```

No other grant/policy changes.

### 7. Out of scope (confirmed not built)

- Delete service record
- **Photo upload / attachments — not implemented**
- Edit from the global service-history page
- Scheduled-tasks sync on edit
- Visual redesign

### Deliverable summary for the build phase

1. Files: refactored `ServiceRecordForm.tsx` (create+edit modes), new `EditServiceRecordDialog.tsx`, updated `ServiceRecordCard.tsx` (outer div + dedicated header toggle button + optional Upraviť button), updated `ServiceHistorySection.tsx` (onEdit prop), updated `garage.$vehicleId.tsx` (edit state + dialog mount).
2. Backend: added `Service records: anon update` policy + `GRANT UPDATE ON public.service_records TO anon`. Nothing else touched.
3. The form is reused via a `mode` prop — single component handles create and edit.
4. After save: invalidate `["vehicle", vehicleId, "service-records"]`, `["vehicle", vehicleId]`, `["vehicles", "with-customers"]`, `["service-history"]`.
5. Photo upload is still NOT implemented.
