## Edit vehicle + customer flow

Replace the placeholder "Upraviť" action on the vehicle detail page with a real edit flow that updates both the customer and the vehicle in one dialog.

### 1. New components

- `src/components/garage/edit/EditVehicleDialog.tsx` — `Dialog` on desktop, full-height sheet styling on mobile (via responsive classes, matching `AddVehicleDialog`). Owns react-hook-form + zod, submit handler, error/success toasts. Pre-fills from `vehicle` + `vehicle.customer`.
- `src/components/garage/edit/CustomerEditFormSection.tsx` — Section 1 "Zákazník": meno*, priezvisko*, telefón*, e-mail, poznámky.
- `src/components/garage/edit/VehicleEditFormSection.tsx` — Section 2 "Vozidlo": značka*, model*, rok výroby, ŠPZ*, VIN, aktuálny nájazd (km)*, motor, prevodovka, pohon, výkon, objem oleja, rozmer pneu, typ paliva, poznámky.

Sections are rendered inside one `<form>` so it's a single submit flow.

### 2. Wiring

- `src/routes/_authenticated/garage.$vehicleId.tsx`: add `editOpen` state, pass `onAction={() => setEditOpen(true)}` to `VehicleDetailHeader`, mount `<EditVehicleDialog open vehicle ... />`. Remove the `placeholder` toast.
- No changes to `VehicleDetailHeader` props (it already exposes `onAction`).

### 3. Validation (zod, Slovak messages)

Required: customer first_name, last_name, phone; vehicle brand, model, license_plate, current_mileage.

Rules:
- `current_mileage` positive integer
- `year` optional, between 1900 and current year + 1
- `email` optional, must be valid if non-empty
- `license_plate` → trim + uppercase before save
- `vin`, text fields → trim
- empty optional strings sent as `null`

### 4. Duplicate ŠPZ check

In the submit handler, if the normalized license plate differs from `vehicle.license_plate`, query:

```ts
supabase.from('vehicles').select('id').eq('license_plate', plate).neq('id', vehicleId).maybeSingle()
```

If a row is returned → set form error on `license_plate` with "Vozidlo s touto ŠPZ už existuje" and abort save.

### 5. Save

Sequential, both via `supabase` browser client:
1. `update customers set ... where id = vehicle.customer_id`
2. `update vehicles set ... where id = vehicleId`

If either errors → throw, dialog stays open, values preserved, toast `"Údaje sa nepodarilo uložiť"`.

On success:
- toast `"Údaje boli uložené"`
- close dialog
- `queryClient.invalidateQueries` for keys: `['vehicle', vehicleId]`, `['vehicles']` (garage list), `['service-history']` (global), and `['customers']` if present.

### 6. Backend

Customers/vehicles already have `anon UPDATE` allowed (see existing policies: `Customers: anon read`/`auth all` — but no explicit anon update). Add a focused migration:

```sql
CREATE POLICY "Customers: anon update" ON public.customers FOR UPDATE TO anon USING (true) WITH CHECK (true);
GRANT UPDATE ON public.customers TO anon;
-- vehicles already has "Vehicles: anon update mileage" with USING/CHECK true, which permits full row updates; verify and only add if missing.
```

(Verify current grants/policies during build and add only what is missing — narrowest delta.)

### 7. Keep unchanged

- Dark UI, Slovak labels, detail page layout.
- No edits to service records, no delete, no photo upload, no audit log.

### Deliverable summary the build phase will report

1. Components created: `EditVehicleDialog`, `CustomerEditFormSection`, `VehicleEditFormSection`.
2. Backend: added missing anon UPDATE policy/grant for `customers` (and for `vehicles` if not already present).
3. Duplicate ŠPZ: on submit, if plate changed, query `vehicles` for same plate excluding current id; block + inline Slovak error.
4. Invalidated keys after save: `['vehicle', vehicleId]`, `['vehicles']`, `['service-history']`, `['customers']`.
5. Yes — customer + vehicle are edited in a single form/submit flow.
