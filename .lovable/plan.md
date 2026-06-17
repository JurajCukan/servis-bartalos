## Add Vehicle flow

Build a 2-step "Pridať vozidlo" dialog wired into the dashboard, with anon writes for `customers` and `vehicles`, duplicate ŠPZ protection, and post-save navigation to the new vehicle detail.

### 1. Backend (one migration)

Grants/policies (additive, minimal):

- `GRANT INSERT ON public.customers TO anon` + RLS policy `Customers: anon insert` (`WITH CHECK (true)`).
- `GRANT INSERT ON public.vehicles TO anon` + RLS policy `Vehicles: anon insert` (`WITH CHECK (true)`).
- `customers` already has anon SELECT (used for picker + soft duplicate); `vehicles` already has anon SELECT (used for ŠPZ duplicate check). No new SELECT grants needed.

### 2. New components (`src/components/garage/add/`)

- `AddVehicleDialog.tsx` — responsive shell: `Dialog` on desktop, full-screen `Sheet` (side="bottom") on mobile via `useIsMobile`. Owns `step` state (1 | 2), customer-resolution state, and the final mutation. Sticky footer with the step-specific buttons.
- `StepIndicator.tsx` — tiny "1 Zákazník → 2 Vozidlo" header.
- `CustomerStep.tsx` — top toggle ("Existujúci zákazník" / "Nový zákazník"); renders `CustomerPicker` or new-customer fields. Validates on "Pokračovať" and emits resolved customer payload upward.
- `CustomerPicker.tsx` — search input + result list. Uses a `useQuery(["customers", "search", q])` with `.ilike` on `first_name`, `last_name`, `phone` (debounced 250 ms, limit 20). Shows full name + phone.
- `VehicleForm.tsx` — RHF + zod form for vehicle fields. Submit triggers parent's mutation.

### 3. Validation (zod, Slovak messages)

- New customer: `first_name`, `last_name`, `phone` required (trim, max 120); `email` optional but valid; `notes` optional.
- Vehicle: `brand`, `model`, `license_plate` required; `current_mileage` required positive integer; `year` optional but `1900..currentYear+1`; `vin` trimmed (max 32); other tech fields trimmed optional.
- Normalisation in submit: `license_plate` → trimmed + uppercased; all text fields trimmed; empty optional strings become `null`.
- Messages: "Toto pole je povinné", "Zadajte platný rok", "Zadajte platný email", "Zadajte platný nájazd".

### 4. Duplicate ŠPZ check

Inside the mutation, before insert:

```ts
const { data: existing } = await supabase
  .from("vehicles")
  .select("id")
  .eq("license_plate", normalizedPlate)
  .maybeSingle();
if (existing) throw new DuplicatePlateError(existing.id);
```

On `DuplicatePlateError`, show toast `"Vozidlo s touto ŠPZ už existuje"` with an action button "Otvoriť" that navigates to `/garage/$vehicleId`. Dialog stays open with values preserved. Soft warning for new customer with matching `(first_name, last_name, phone)` is skipped this iteration to keep scope light (noted in summary).

### 5. Save flow

`useMutation` in `AddVehicleDialog`:

1. If new customer → `insert customers ... .select("id").single()`, capture `customer_id`. If existing → use selected id.
2. Run duplicate ŠPZ check (above).
3. `insert vehicles { customer_id, brand, model, year, vin, license_plate, current_mileage, engine, transmission, drive, power, oil_volume, tire_size, fuel_type, notes, status: "OK" } .select("id").single()`.
4. `onSuccess`:
   - `queryClient.invalidateQueries({ queryKey: ["vehicles", "with-customers"] })`
   - `queryClient.invalidateQueries({ queryKey: ["customers"] })`
   - toast `"Vozidlo bolo pridané"`
   - close dialog, then `navigate({ to: "/garage/$vehicleId", params: { vehicleId: newId } })`.
5. `onError` (non-duplicate): toast `"Vozidlo sa nepodarilo uložiť"`; dialog stays open with values preserved.

### 6. Wiring

`src/routes/_authenticated/garage.tsx`: replace `showAddPlaceholder` with `const [addOpen, setAddOpen] = useState(false)`; pass `() => setAddOpen(true)` to `DashboardHeader` and the empty-state button; render `<AddVehicleDialog open={addOpen} onOpenChange={setAddOpen} />` at the bottom.

### 7. Files

- New: `src/components/garage/add/AddVehicleDialog.tsx`, `CustomerStep.tsx`, `CustomerPicker.tsx`, `VehicleForm.tsx`, `StepIndicator.tsx`; migration `…_add_vehicle_anon_writes.sql`.
- Edited: `src/routes/_authenticated/garage.tsx`.
- No changes to existing visuals, sidebar, or detail page. No edit/photo/import flows.

### 8. Open decisions

- Existing-customer search uses client `.ilike` query (not full-text); sufficient for a 2–3 mechanic dataset.
- After save we redirect to the new vehicle's detail page (and also invalidate the grid so a back navigation is fresh).
- Soft duplicate-customer warning is intentionally skipped — keeps the flow simple this iteration.
