## Goal
Add a real `/settings` route with a working theme switcher (Svetlý / Tmavý / Podľa systému), persist preference in `localStorage`, and bring back the "Nastavenia" sidebar item.

## Theme system

The app currently uses hardcoded `brand-bg/brand-surface/brand-border` tokens (always dark) and `text-white` throughout. A true full-fidelity light mode would require a redesign of every screen, which is explicitly out of scope. Approach:

1. Make brand surface/border tokens swap with the `.dark` class so the toggle has a real visual effect on container surfaces:
   - Move `--color-brand-bg / -surface / -border` out of `@theme inline` literal values.
   - Define `--brand-bg`, `--brand-surface`, `--brand-border` in `:root` (light values) and `.dark` (current dark values: `#111`, `#1a1a1a`, `#2a2a2a`).
   - Register them in `@theme inline` as `var(--brand-*)`. Accent stays constant.
2. Add a tiny ThemeProvider (`src/components/theme/ThemeProvider.tsx`):
   - Stores `"light" | "dark" | "system"` in `localStorage` key `skb-theme`.
   - Default = `"dark"` (preserves current look on first load).
   - Effect toggles the `.dark` class on `document.documentElement`.
   - When `"system"`, listens to `matchMedia("(prefers-color-scheme: dark)")`.
   - Exposes `useTheme()` hook returning `{ theme, resolvedTheme, setTheme }`.
3. Wire `<ThemeProvider>` inside `RootComponent` in `src/routes/__root.tsx` (wraps `<Outlet />` and Toaster). Toaster gets `theme={resolvedTheme}` so toasts follow.

Persistence: `localStorage` is available in this client-side React app — preference WILL persist across reloads. Reading happens client-side only (ThemeProvider runs in a `useEffect`/lazy init that checks `typeof window`) to avoid SSR mismatch.

Caveat noted in the final summary: many components still use literal `text-white`, so light mode is functional infrastructure but text contrast on a few inner widgets is imperfect. The brand surfaces themselves swap correctly. A thorough light-mode pass is intentionally not in scope.

## Files

Created:
- `src/components/theme/ThemeProvider.tsx` — context, hook, persistence, system-pref listener.
- `src/components/settings/ThemeSettingCard.tsx` — "Vzhľad" card with three options using `RadioGroup` from shadcn (icons: Sun, Moon, Monitor).
- `src/components/settings/AppInfoCard.tsx` — "Aplikácia" read-only info card.
- `src/components/settings/DataSafetyCard.tsx` — "Dáta a bezpečnosť" tips card.
- `src/components/settings/SettingsPageHeader.tsx` — page header matching other page headers.
- `src/routes/_authenticated/settings.tsx` — `/settings` route with `head()` metadata, renders header + the four section cards (Vzhľad, Aplikácia, Dáta a bezpečnosť, Voliteľne → "Prejsť na garáž" Link button).

Edited:
- `src/styles.css` — move brand tokens into `:root`/`.dark` and register via `@theme inline`.
- `src/routes/__root.tsx` — wrap children in `<ThemeProvider>`; pass resolved theme to `<Toaster>`.
- `src/components/app/AppSidebar.tsx` — add fourth `NAV_ITEMS` entry: `{ key:"settings", label:"Nastavenia", icon: Settings, to:"/settings", match:"/settings" }`. Widen `to` union type accordingly.

No changes to existing screens, queries, or business logic.

## UI

- Settings page uses the same `AppShell` layout as other authenticated pages.
- Cards reuse the existing dark surface style (`bg-brand-surface border border-brand-border`).
- Sections: Vzhľad (radio group), Aplikácia (read-only key/value list), Dáta a bezpečnosť (bullet list), Voliteľne ("Prejsť na garáž" button linking to `/garage`).

## Out of scope
User accounts, permissions, cloud sync, notifications engine, exports, full light-mode visual polish across every screen.
