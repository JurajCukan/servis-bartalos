## Plan: Photo attachments for service records

### 1. Storage & DB approach

- **Storage**: reuse existing private bucket `service-photos`.
- **Path layout**: `{vehicleId}/{serviceRecordId}/{uuid}.{ext}`.
- **DB**: add a single `photo_paths text[] not null default '{}'` column on `service_records`. Simpler than a join table, matches the small scope, and array updates work cleanly from a single form submit.
- Store **storage paths**, not URLs. Generate **signed URLs** at display time (1h TTL) since the bucket is private.

### 2. Migration (one file)

```sql
alter table public.service_records
  add column if not exists photo_paths text[] not null default '{}';

-- storage policies (open app, no login)
create policy "service-photos anon read"   on storage.objects for select using (bucket_id = 'service-photos');
create policy "service-photos anon insert" on storage.objects for insert with check (bucket_id = 'service-photos');
create policy "service-photos anon delete" on storage.objects for delete using (bucket_id = 'service-photos');
```

Grants on `service_records` already include anon update/insert/select — no change.

### 3. File validation rules (shared helper `src/lib/photo-validation.ts`)

- Allowed MIME: `image/jpeg`, `image/png`, `image/webp`. (HEIC skipped — browser preview unreliable.)
- Max per file: **10 MB**.
- Max per record: **8 photos** total (existing + pending).
- Slovak messages: `"Nepodporovaný formát súboru"`, `"Súbor je príliš veľký (max 10 MB)"`, `"Maximálne 8 fotiek na záznam"`.

### 4. New components

- `src/components/garage/detail/photos/ServiceRecordPhotoPicker.tsx`
  - Controlled: props `existingPaths: string[]`, `pendingFiles: File[]`, `onChange({ existingPaths, pendingFiles })`.
  - Renders "Fotky" section: empty state `"Zatiaľ bez fotiek"`, thumbnail grid (existing via signed URLs + pending via `URL.createObjectURL`), remove button per thumb, `"Pridať fotky"` file input button.
  - Performs validation on add; toast errors.
- `src/components/garage/detail/photos/ServiceRecordPhotoGrid.tsx`
  - Read-only grid for record card; uses signed URLs; click → opens `PhotoPreviewDialog`.
- `src/components/garage/detail/photos/PhotoPreviewDialog.tsx`
  - Basic shadcn Dialog showing one image at natural max size with prev/next buttons (no fancy lightbox).
- `src/lib/photos.ts` helper:
  - `uploadPhotos(vehicleId, recordId, files) → { uploadedPaths, failedCount }`
  - `deletePhotos(paths[])` (best-effort)
  - `getSignedUrls(paths[])` (batched via `createSignedUrls`)

### 5. ServiceRecordForm changes

- Add state for `existingPaths` (init from `record.photo_paths` in edit, `[]` in create) and `pendingFiles: File[]`.
- Render `<ServiceRecordPhotoPicker>` inside the form between "Cena/Technik" and "Ďalší servis".
- Mutation flow:
  1. Insert/update record as today; receive `recordId` (`.select("id").single()` on insert; existing id on edit).
  2. Compute `removedPaths = record.photo_paths \ existingPaths` (edit only); call `deletePhotos(removedPaths)` best-effort.
  3. If `pendingFiles.length > 0`: call `uploadPhotos(vehicleId, recordId, pendingFiles)`; collect `uploadedPaths` + `failedCount`.
  4. Final `photo_paths = [...existingPaths, ...uploadedPaths]`. Update record with new array (single extra UPDATE).
  5. Return `{ failedCount }`.
- On success:
  - Success toast unchanged (`"Servisný záznam bol uložený"` / `"Servisný záznam bol upravený"`).
  - If `failedCount > 0`: `toast.warning(\`Niektoré fotky sa nepodarilo nahrať (${failedCount})\`)`.
- Cancel button: revoke any `URL.createObjectURL` previews on unmount.

### 6. Display in cards

- `ServiceRecordCard.tsx`: when record has photos, render `<ServiceRecordPhotoGrid>` inside expanded section above the action row.
- Optionally show a small photo-count badge near the title.
- Service history list item (`ServiceHistoryItem.tsx`): show same grid if photos exist (read-only).

### 7. Type updates

- Extend `ServiceRecord` type in `src/lib/queries/vehicles.ts` to include `photo_paths: string[]`.
- Select query: add `photo_paths` to the select string.

### 8. Query invalidations

Unchanged set after save: `["vehicle", vehicleId, "service-records"]`, `["vehicle", vehicleId]`, `["service-history"]`.

### 9. Out of scope

- No drag reorder, no annotations, no PDF export, no advanced lightbox, no HEIC, no redesign of cards or routes, no delete of whole record.

### Summary deliverable at end of build

Will recap: chosen approach (array column + private bucket signed URLs), migration applied, new files added, create/edit flow behavior, and partial failure handling (warning toast with count, record still saved).
