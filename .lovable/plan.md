## Plan: photos in global service history + vehicle main photo

### Part A — Service record photos in /service-history

**Query change (`src/lib/queries/serviceHistory.ts`)**
- Add `photo_paths` to the SELECT string and to the `ServiceHistoryItem` type (`photo_paths: string[]`, normalized to `[]` when null, same shape as `serviceHistoryQuery` in `vehicles.ts`).

**Display (`src/components/service-history/ServiceHistoryItem.tsx`)**
- Below the description block, when `item.photo_paths.length > 0`, render the existing `<ServiceRecordPhotoGrid paths={item.photo_paths} />`.
- No change if list is empty (no clutter, no extra label beyond what the grid already shows).
- `ServiceRecordPhotoGrid` already handles signed URLs (1h TTL) and opens `PhotoPreviewDialog` — fully reused, no new components.

### Part B — Vehicle main photo

**Storage & DB**
- Reuse existing private bucket `vehicle-photos`.
- Add one column: `vehicles.photo_path text null`. Keep the existing `photo_url` column untouched for back-compat; new code reads `photo_path` first and falls back to `photo_url` (legacy/external URLs) when path is null. This avoids breaking any existing rows.
- Path layout: `{vehicleId}/main-{uuid}.{ext}` (single object per vehicle; old file is removed on replace/remove).

**Migration (one file)**
```sql
alter table public.vehicles
  add column if not exists photo_path text null;

-- vehicle-photos storage policies (open app, matches service-photos)
create policy "vehicle-photos anon read"   on storage.objects for select using (bucket_id = 'vehicle-photos');
create policy "vehicle-photos anon insert" on storage.objects for insert with check (bucket_id = 'vehicle-photos');
create policy "vehicle-photos anon delete" on storage.objects for delete using (bucket_id = 'vehicle-photos');
```
No new grants on `vehicles` needed (anon update already in place).

**Helper (`src/lib/vehiclePhoto.ts`, new)**
- `uploadVehiclePhoto(vehicleId, file) → path`
- `deleteVehiclePhoto(path)` (best-effort)
- `getVehiclePhotoSignedUrl(path) → string` (1h TTL, single object — uses `createSignedUrl`)
- Validation: same MIME set as service photos (`jpeg|png|webp`), max 10 MB, Slovak error messages reusing the strings from `src/lib/photos.ts`.

**Edit dialog (`EditVehicleDialog.tsx` + new `VehiclePhotoField.tsx`)**
- Extend `EditVehicleDialog` with local state: `photoAction: "keep" | "replace" | "remove"`, `pendingFile: File | null`, `pendingPreviewUrl` (Object URL, revoked on close).
- New `VehiclePhotoField` rendered above the customer section: shows current photo (signed URL) or "Bez fotky" placeholder; buttons "Nahrať fotku" / "Nahradiť" / "Odstrániť" / "Zrušiť zmenu". Performs client-side validation before staging.
- Submit flow:
  1. Run the existing customer + vehicle UPDATE (unchanged).
  2. If `photoAction === "replace"`: upload new file, then on success UPDATE `vehicles.photo_path` and delete previous file (if any) best-effort.
  3. If `photoAction === "remove"`: UPDATE `photo_path = null` and delete previous file best-effort.
  4. Photo failures don't roll back text data — toast warning `"Fotku sa nepodarilo uložiť"`; text save success toast stays.
- Invalidations unchanged (`["vehicle", id]`, `["vehicles"]`, `["service-history"]`, `["customers"]`).

**Display**

Extend `VehicleWithCustomer` and `VehicleDetail` types with `photo_path: string | null`, add it to both SELECT strings in `src/lib/queries/vehicles.ts`.

- `VehicleCard.tsx` (garage): if `photo_path` is set, resolve a signed URL (small `useEffect` + state, same pattern as `ServiceRecordPhotoGrid`); else if `photo_url` legacy, use directly; else keep current "Bez fotky" placeholder.
- `VehicleDetailHeader.tsx`: same resolution logic for the hero image; placeholder unchanged.
- To avoid N+1 signed-URL calls on the garage grid, batch in `VehicleGrid.tsx`: collect all `photo_path` values once, call `supabase.storage.from('vehicle-photos').createSignedUrls(paths, 3600)`, pass a `signedUrls: Record<path,url>` map into each `VehicleCard`. Card falls back to placeholder while map loads.

### Out of scope (unchanged)
- Multiple/gallery photos for vehicles, drag-drop sort, annotations, redesign, export, service record delete.

### End-of-build summary will cover
1. service-history grid wiring (query field + reused `ServiceRecordPhotoGrid`/`PhotoPreviewDialog`).
2. files touched for global history (`queries/serviceHistory.ts`, `ServiceHistoryItem.tsx`).
3. DB/storage choice (new `photo_path` column + existing `vehicle-photos` bucket + 3 anon policies).
4. files created/changed for vehicle photo (`vehiclePhoto.ts`, `VehiclePhotoField.tsx`, `EditVehicleDialog.tsx`, `VehicleCard.tsx`, `VehicleGrid.tsx`, `VehicleDetailHeader.tsx`, `queries/vehicles.ts`, migration).
5. upload/replace/remove via staged action in edit dialog, with best-effort old-file delete and non-blocking photo failure.
6. garage cards + detail header now resolve signed URLs from `photo_path` and fall back to legacy `photo_url`, then placeholder.
