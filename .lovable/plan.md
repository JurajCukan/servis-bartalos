## Scheduling flow + "Dnešný plán" page

Wire the "Naplánovať" action on vehicle detail to a real form, ship `/plan` as a grouped task list, and let mechanics mark items done.

### 1. Backend (one migration)

`scheduled_tasks` already has `anon insert` + `anon SELECT` via the authenticated all-policy is missing for anon SELECT — currently only an `anon insert` policy and the broad authenticated policy exist. Add:

- `GRANT SELECT, UPDATE ON public.scheduled_tasks TO anon`
- Policy `Scheduled tasks: anon select` `FOR SELECT TO anon USING (true)`
- Policy `Scheduled tasks: anon update status` `FOR UPDATE TO anon USING (true) WITH CHECK (true)` (UPDATE on the whole row — column-scoped grants aren't expressible per-policy; we'll only update `status` from code).

`customers` + `vehicles` already allow anon SELECT — plan-page joins work as-is. No new INSERT.

### 2. New routes / components

- `src/routes/_authenticated/plan.tsx` — uses `useQuery(plannedTasksQuery)`, renders `PlanPageHeader` + the four `PlanSection`s or `EmptyPlanState`.
- `src/components/plan/PlanPageHeader.tsx` — title "Dnešný plán" + subtitle.
- `src/components/plan/PlanSection.tsx` — heading + count + list of `PlannedTaskCard`; hides itself when empty.
- `src/components/plan/PlannedTaskCard.tsx` — priority dot/badge, task_type, brand/model + ŠPZ + customer, description, formatted date, planned_mileage, status badge. Actions: "Zobraziť vozidlo" (`Link to="/garage/$vehicleId"`), "Označiť ako dokončené", "Zrušiť".
- `src/components/plan/EmptyPlanState.tsx`.
- `src/components/garage/detail/ScheduleServiceDialog.tsx` — responsive Dialog/Sheet shell mirroring `AddServiceRecordDialog`.
- `src/components/garage/detail/ScheduleTaskForm.tsx` — RHF + zod form.

### 3. Queries / mutations (`src/lib/queries/scheduledTasks.ts`)

- `type PlannedTask` — joined shape with `vehicle: { id, brand, model, license_plate, customer: { first_name, last_name } }`.
- `plannedTasksQuery` (`queryKey: ["scheduled-tasks", "active"]`) — `select(..., vehicle:vehicles(id, brand, model, license_plate, customer:customers(first_name, last_name)))` from `scheduled_tasks`, `.neq("status", "Zrušené")`, ordered by `planned_date` asc.
- Mutations live inline in components using `supabase.from("scheduled_tasks").update(...)`:
  - `markCompleted(id)` → `status = "Dokončené"`.
  - `markCancelled(id)` → `status = "Zrušené"`.
- Insert mutation in `ScheduleTaskForm` uses `supabase.from("scheduled_tasks").insert(...)`.

### 4. Schedule form

zod schema:
- `planned_date`: required ISO date string.
- `task_type`: enum of the 11 options.
- `description`: trimmed, min 1, max 2000.
- `planned_mileage`: optional, coerced positive int.
- `priority`: enum `Nízka | Stredná | Vysoká`, default `Stredná`.

Slovak messages: "Toto pole je povinné", "Zadajte platný nájazd", "Zadajte platný dátum".

Insert payload sets `vehicle_id`, `status: "Čakajúce"`, `planned_mileage: null` when empty. `onSuccess`: invalidate `["scheduled-tasks", "active"]`, toast `"Servis bol naplánovaný"`, close dialog.

### 5. Wiring entry points

- `VehicleDetailHeader`: add `onSchedule` prop; "Naplánovať" calls it instead of `onAction`. "Upraviť" stays on `onAction` (still placeholder).
- `src/routes/_authenticated/garage.$vehicleId.tsx`: add `scheduleOpen` state, render `<ScheduleServiceDialog open vehicleId currentMileage onOpenChange />`.
- `AppSidebar`: turn `NAV_ITEMS` into `Link`-aware buttons. Items get an optional `to`; "Vozidlá" → `/garage`, "Dnešný plán" → `/plan`, others stay disabled with toast. Active state computed with `useRouterState` matching pathname prefix.

### 6. Grouping logic (in `plan.tsx`)

Compute once with `useMemo`:

```ts
const startToday = startOfDay(now);
const startTomorrow = addDays(startToday, 1);
const startDayAfter = addDays(startToday, 2);
const endOfWeek = startOfDay(addDays(startToday, 7)); // exclusive
// Today:  planned_date === today
// Zajtra: planned_date === tomorrow
// Tento týždeň: startDayAfter <= planned_date < endOfWeek
// Neskôr: planned_date >= endOfWeek OR planned_date < today (overdue bucketed here? -> include past in "Dnes")
```

Decision: past-due tasks (planned_date < today) bucket into **Dnes** so mechanics see overdue work immediately. Mentioned in summary.

Within each section sort by priority (`Vysoká`→`Stredná`→`Nízka`) then `planned_date` asc.

Implementation note: avoid adding `date-fns` (keep deps lean) — compute with native `Date` and an ISO-date comparator on the `YYYY-MM-DD` strings stored in `planned_date` (lexicographic comparison works for ISO dates).

### 7. Completion behavior

Clicking "Označiť ako dokončené" updates `status = "Dokončené"`. The query filters `.neq("status", "Zrušené")` but does NOT exclude completed tasks; however the **grouped list is built from active tasks only** (`status === "Čakajúce"`). Completed/cancelled tasks disappear from the four sections after invalidation. Toast: `"Úkon bol označený ako dokončený"`. (We don't render a "Dokončené" section this iteration — keeps the page focused on actionable work.)

Cancel uses the same UPDATE pattern; toast `"Plán bol zrušený"`.

### 8. Files

- New: `src/routes/_authenticated/plan.tsx`; `src/components/plan/{PlanPageHeader,PlanSection,PlannedTaskCard,EmptyPlanState}.tsx`; `src/components/garage/detail/{ScheduleServiceDialog,ScheduleTaskForm}.tsx`; `src/lib/queries/scheduledTasks.ts`; one migration.
- Edited: `src/components/app/AppSidebar.tsx`, `src/components/garage/detail/VehicleDetailHeader.tsx`, `src/routes/_authenticated/garage.$vehicleId.tsx`.

### 9. Out of scope (explicit)

Calendar view, drag-and-drop, recurrence, notifications, completed-history view, realtime.
