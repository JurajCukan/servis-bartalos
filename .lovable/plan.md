## Service record validation + formatting pass

Tighten the shared `ServiceRecordForm` schema and centralize display formatters so bad numbers never get saved and existing rows render cleanly.

### 1. Hardened zod schema (`src/components/garage/detail/ServiceRecordForm.tsx`)

Constants at top:

```
MAX_MILEAGE = 2_000_000   // km
MAX_PRICE   = 1_000_000   // EUR
MAX_TITLE   = 120
MAX_LONG    = 2000
MIN_DATE    = "1900-01-01"
```

Field rules (Slovak messages):

- `title` — `z.string().trim().min(1, "Toto pole je povinné").max(120, "Hodnota je príliš dlhá")`.
- `date` — required, must parse as a valid date, must be ≥ `MIN_DATE` and ≤ tomorrow (`now + 1 day`, to allow timezone slack). Message: `"Zadajte platný dátum"`.
- `service_type` — required, must be one of `SERVICE_TYPES`.
- `mileage_at_service` — `z.coerce.number().finite().int().positive().max(MAX_MILEAGE)`; non-finite/NaN → `"Zadajte platný nájazd"`, over max → `"Hodnota je príliš vysoká"`.
- `description` — trimmed, required, max 2000, message `"Toto pole je povinné"` / `"Hodnota je príliš dlhá"`.
- `parts_replaced` — optional, trimmed, max 2000, empty → null.
- `technician` — optional, trimmed, max 120, empty → null.
- `price` — optional; when present must be finite, > 0, ≤ MAX_PRICE; round to 2 decimals before save. Messages `"Zadajte platnú cenu"` / `"Hodnota je príliš vysoká"`.
- `next_service_km` — optional; when present must be finite int, > 0, ≤ MAX_MILEAGE. Messages `"Zadajte platný údaj"` / `"Hodnota je príliš vysoká"`. Also enforce `next_service_km > mileage_at_service` via a `superRefine`, message `"Musí byť vyššie ako aktuálny nájazd"`.
- `next_service_date` — optional; when present must parse, be ≥ `date` (not earlier than the service date), and ≤ `2100-01-01`. Message `"Zadajte platný dátum"`.

Normalization at submit time:
- Trim every string field.
- Convert empty strings to `null` in the payload for: `parts_replaced`, `technician`, `price`, `next_service_km`, `next_service_date`.
- `Math.round(price * 100) / 100` before insert/update.
- Mileage values cast through `Number.isFinite` guard; reject otherwise via the schema (already handled).

The existing create + edit modes both go through this single hardened schema, so both flows benefit. No changes to props or callers needed.

### 2. Centralized formatters

New file `src/lib/format.ts`:

```ts
export function formatKm(km: number | null | undefined): string
export function formatPrice(p: number | null | undefined): string | null
export function formatDate(d: string | null | undefined): string
```

Rules:
- `formatKm` returns `"—"` for null/undefined/non-finite; otherwise `Intl.NumberFormat("sk-SK")` + `" km"`.
- `formatPrice` returns `null` for null/undefined/non-finite so callers can choose to skip rendering; otherwise EUR with 2 decimals.
- `formatDate` returns `"—"` for null/empty/invalid; otherwise `sk-SK` short date.

### 3. Use formatters in displays

Refactor to import from `@/lib/format` and drop local copies:
- `src/components/garage/detail/ServiceRecordCard.tsx` — replace local `formatDate`/`formatKm`/`formatPrice`. Guard `description`, `parts_replaced`, `technician` with truthy checks (already done, but also `.trim()` before rendering to avoid empty whitespace).
- `src/components/service-history/ServiceHistoryItem.tsx` — replace local copies. Skip price block when `formatPrice` returns null.
- `src/components/garage/detail/VehicleDetailHeader.tsx` — keep its `formatMileage` or replace with `formatKm` (same behavior, just deduped).

### 4. Out of scope (still not built)

- Photo upload / attachments.
- Delete service record.
- Scheduled-tasks sync on edit.
- Redesign.
- Route changes.

### Build-phase summary deliverable

1. **Validation:** schema now enforces trim, finite/NaN guards, positive integer mileage, positive number price (rounded to 2 dp), `next_service_km > mileage_at_service`, `next_service_date ≥ date`, `date` between 1900-01-01 and tomorrow, max lengths on all text fields, normalized empty → `null`.
2. **Guardrails:** `mileage_at_service ≤ 2 000 000`, `next_service_km ≤ 2 000 000`, `price ≤ 1 000 000`, `next_service_date ≤ 2100-01-01`, text fields capped at 120/2000 chars. All use Slovak messages including `"Hodnota je príliš vysoká"`.
3. **Display:** centralized `formatKm`, `formatPrice`, `formatDate` in `src/lib/format.ts`; null/invalid values render as `"—"` (or skipped entirely for price), thousands separators on km, clean EUR on price. Adopted by `ServiceRecordCard`, `ServiceHistoryItem`, `VehicleDetailHeader`.
4. Yes — `ServiceRecordForm` is shared by create + edit dialogs, so both flows use the hardened schema.
5. Photo upload is still **NOT implemented**.
