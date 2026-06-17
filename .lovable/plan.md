## Scope

Build the authenticated `/garage` dashboard ("Moja Garáž") with sidebar shell, search/filter/sort controls, and a vehicle card grid powered by the seeded data. Slovak UI, dark brand theme, no new backend changes.

## Data layer

- `src/lib/queries/vehicles.ts` — exports `vehiclesWithCustomersQuery` (TanStack Query `queryOptions`):
  ```ts
  supabase.from("vehicles").select("*, customer:customers(first_name,last_name)")
  ```
  Returns DTO `VehicleWithCustomer[]`. No service_records aggregation in this iteration (per spec: skip if not easy).
- `src/lib/queries/profile.ts` — `useProfileQuery()` fetching the row from `profiles` for the current user; used by sidebar footer.

## Routing

- Convert `/_authenticated/garage` from a leaf to a layout: keep `_authenticated/route.tsx` as-is (gate). Add `_authenticated/garage.tsx` which renders the new dashboard (no Outlet needed — sibling routes aren't built yet). Stub routes for the other sidebar items go to a single placeholder route `_authenticated/coming-soon.tsx` ("Pripravuje sa") — the sidebar links target that one path with a query/state telling it which feature; simplest: just make those items disabled buttons with a tooltip, no extra routes. **Decision: disabled buttons, no stub routes.** Keeps surface area small.

## App shell

- `src/components/app/AppShell.tsx` — wraps content with shadcn `SidebarProvider`. Desktop: `<Sidebar collapsible="icon">` + main column. Mobile: top bar with hamburger that opens the sidebar as a sheet (shadcn sidebar handles both responsively).
- `src/components/app/AppSidebar.tsx` — nav items (Vozidlá active, others disabled), footer with avatar/initials, name, role badge, "Odhlásiť sa" button. Uses `useProfileQuery` + `supabase.auth.getUser()`.
- `src/components/app/MobileTopBar.tsx` — title + `SidebarTrigger` (mobile-only via Tailwind responsive classes).

## Dashboard composition

- `src/routes/_authenticated/garage.tsx` — composes:
  - `DashboardHeader` (title, subtitle, "+ Pridať vozidlo" button → `toast.info("Pridanie vozidla bude doplnené v ďalšom kroku")`).
  - Controls row: `VehicleSearchBar`, `VehicleFilters` (status + fuel selects), `VehicleSort`.
  - `VehicleGrid` rendering `VehicleCard`s, with `LoadingSkeleton`, empty state, and no-results state.
- Local UI state via `useState` (search, status, fuel, sort). Search debounced 300 ms with a small `useDebouncedValue` hook in `src/hooks/use-debounced-value.ts`.

## Components

Under `src/components/garage/`:
- `DashboardHeader.tsx`
- `VehicleSearchBar.tsx` (controlled input, Slovak placeholder, Search icon)
- `VehicleFilters.tsx` (two shadcn `Select`s)
- `VehicleSort.tsx` (shadcn `Select` with 4 options)
- `VehicleCard.tsx` (image area 16:10, status badge overlay, brand/model, year + customer, ŠPZ / Nájazd / VIN-short rows; whole card is a `<button>` for keyboard focus — onClick toast "Detail vozidla bude doplnený v ďalšom kroku")
- `VehicleGrid.tsx` (responsive grid: 1 col mobile, 2 md, 3 xl)
- `EmptyState.tsx` (reused for both "no vehicles" and "no results" via props)
- `LoadingSkeleton.tsx` (controls skeleton + 4 card skeletons)
- `StatusBadge.tsx` (maps status → semantic color)

## Filtering/sorting logic

Pure derived state in the route component:
1. Filter by status (`!== "all"`).
2. Filter by fuel (`!== "all"`).
3. Filter by debounced search: normalize (`trim`, collapse spaces, lowercase), test against concatenated `first_name last_name license_plate vin brand model`.
4. Sort: default rule (status SERVIS NUTNÝ first, then `created_at` desc) OR one of the explicit sort options.

## Styling tokens

Reuse existing `--color-brand-bg`, `--color-brand-surface`, `--color-brand-border`, `--color-brand-accent`. Add semantic status colors as Tailwind classes inline (`bg-emerald-600`, `bg-red-600`, `bg-blue-600`, `bg-zinc-600`) — these are status indicators, not theme colors, and keeping them inline avoids token bloat for one-off badge palettes. `tabular-nums` utility on mileage.

## Out of scope (next iterations)
Vehicle detail, add/edit form, service history, scheduling, alerts page, settings page, Excel import, PWA, realtime, last-service-date aggregation, profile editing.
