## Plan: MVP polish & production-readiness pass

Tight, low-risk pass. No new features, no module reshuffles, no redesigns. Each item below is a small, scoped tweak.

### 1. Root-level placeholders & global error pages
- `src/routes/__root.tsx`:
  - Replace generic Lovable metadata (`title: "Lovable App"`, English description, `og:*`, `twitter:site`) with Slovak Servisná knižka Bartalos values (title `"Servisná knižka Bartalos"`, sk description, locale `sk_SK`, drop the irrelevant `@Lovable` twitter handle).
  - Rewrite `NotFoundComponent` and `ErrorComponent` in Slovak and the app's dark surface tokens (`bg-brand-bg`, `text-white`, `brand-accent` button) so a runtime error doesn't fall back to an English light-mode screen. Buttons: "Skúsiť znova" / "Späť na garáž".
- Keep redirect from `/` → `/garage` unchanged.

### 2. Sidebar "coming soon" stubs
- `AppSidebar`: the `Upozornenia` and `Nastavenia` items currently toast `"Pripravuje sa"`. Two options — pick the cleaner: remove them from `NAV_ITEMS` entirely for the MVP. (Stops users clicking dead links and matches the "remove leftover placeholders" requirement.)

### 3. Page headers consistency
- `ServiceHistoryPageHeader`: bump heading to `text-2xl sm:text-3xl font-semibold tracking-tight` to match `DashboardHeader` / `PlanPageHeader`. Same vertical rhythm (`space-y-1`).

### 4. Dialog/sheet surface consistency
- All form dialogs/sheets currently mix `bg-brand-bg` (add/edit service record, add vehicle, schedule) with `bg-brand-surface` (edit vehicle). Standardize on `bg-brand-surface` for every dialog and sheet (matches card surfaces; inputs already use `bg-brand-bg` for contrast). Files: `AddServiceRecordDialog`, `EditServiceRecordDialog`, `AddVehicleDialog`, `ScheduleServiceDialog`. `EditVehicleDialog` already correct.

### 5. Format helper consolidation (low-risk)
- `PlannedTaskCard` defines its own `formatDate` / `formatMileage`. Replace with imports from `@/lib/format` (`formatDateLong`, `formatKm`) — same `sk-SK` Intl output, removes duplication.

### 6. Overflow / truncation hardening
Small `min-w-0` / `break-words` / `truncate` additions where long values can break layout:
- `VehicleSpecsCard`: add `break-words min-w-0` on `<dd>` so a long Motor / Pneu value can wrap.
- `CustomerInfoCard`: add `break-words` on the name `<p>`.
- `PlannedTaskCard`: wrap header inner row with `min-w-0`; add `truncate` on `task_type` text; add `break-all` to the license plate `<span>` to match `ServiceHistoryItem`.
- `ServiceRecordCard`: add `min-w-0` on the expand button's text container so the title/badges row doesn't push the right-side actions off-screen on narrow widths.

### 7. Mobile button hierarchy & spacing
- `PlannedTaskCard` action row: on very narrow screens the three buttons can wrap awkwardly. Add `w-full sm:w-auto` to the secondary buttons inside `flex-wrap` rows to keep wrapping clean. Keep the primary "Označiť ako dokončené" as the rightmost emphasized action.
- `DashboardHeader` "Pridať vozidlo" button: add `w-full sm:w-auto` so on mobile (where it sits below the title block) it spans the row consistently with other primary CTAs.

### 8. Form polish
- `ServiceRecordForm`: remove leftover blank lines after the photo picker; add `autoComplete="off"` on the form. Add `min={1}` guard for `current_mileage` consistency (already in place).
- All three form `Field` helpers (`ServiceRecordForm`, `VehicleForm`, `ScheduleTaskForm`) render the required-asterisk in `brand-accent` (red on dark). Already consistent — verify no drift.
- Keep error text style consistent: `text-xs text-red-400`. Spot-check — already uniform.

### 9. Toast wording sweep
Pass over every `toast.*` call in the app for tone & grammar parity. Current state is already close; small fixes only:
- `toast.success("Údaje boli uložené")` → unchanged.
- Confirm warnings use `toast.warning(...)` and errors use `toast.error(...)` consistently (spot found OK).
- Make sure no English string slipped in.

### 10. Small bugs
- `EditVehicleDialog`: when the user opens the edit dialog after a previous unsaved photo selection then closes, the staged `File` object URL needs to be revoked. `VehiclePhotoField` already revokes via `useEffect` cleanup — verify nothing leaks when dialog unmounts mid-edit. If needed, also reset state in the dialog's `onOpenChange(false)` path (currently only resets on `open === true`).
- `ServiceHistoryItem` photo grid: when an item has photos, the grid currently sits next to the long-description `line-clamp-2` — confirm spacing (`mt-2` / parent `gap-2`) reads cleanly on mobile; adjust to `mt-1` if needed.

### Out of scope (explicit)
- No new modules / screens.
- No analytics, notifications engine, exports, role system, integrations.
- No table/column changes.
- No restructure of route tree, no component splits beyond the few imports above.
- Not implementing the Upozornenia / Nastavenia screens — only hiding the dead nav items.

### Summary deliverable at end of build
1. Fixes applied (root metadata, English fallback pages → Slovak/dark, sidebar dead items removed, dialog surfaces unified, header sizing aligned, overflow guards added, mobile button widths).
2. Components/screens touched (root, AppSidebar, page headers, four dialogs, PlannedTaskCard, ServiceRecordCard, VehicleSpecsCard, CustomerInfoCard, ServiceRecordForm).
3. Confirmed which placeholders were removed (sidebar items, Lovable metadata, English 404/error).
4. Confirmed bug fixes (photo preview URL cleanup, mobile wrap on planned task actions).
5. Confirm no new major features were added.
