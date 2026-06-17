## Cause
The previous theme work made `brand-bg/surface/border` swap with `.dark`, but ~200 occurrences of literal `text-white`, `text-white/60`, `border-white/10`, `bg-white/5`, etc. across ~40 files do not respond to the theme. In light mode these render white text on white/light surfaces → invisible UI. The `text-brand-muted` class some recent files use was also never registered in `@theme`, so it silently no-ops.

## Fix strategy
Systematic swap to semantic, theme-aware brand text tokens — no redesign, no layout changes.

### 1. Add three swapping foreground tokens in `src/styles.css`

In `:root` (light) and `.dark`:
- `--brand-fg`         light `#111111` / dark `#ffffff`           → primary text
- `--brand-fg-muted`   light `#5a5a60` / dark `rgba(255,255,255,0.62)` → secondary text
- `--brand-fg-subtle`  light `#8a8a90` / dark `rgba(255,255,255,0.42)` → tertiary/dim text

Register in `@theme inline`:
- `--color-brand-fg: var(--brand-fg)`
- `--color-brand-fg-muted: var(--brand-fg-muted)`
- `--color-brand-fg-subtle: var(--brand-fg-subtle)`
- `--color-brand-muted: var(--brand-fg-muted)`  (alias for files already using `text-brand-muted`)

### 2. Project-wide replacements (script via `sed` over `src/components` + `src/routes`)

| from | to |
| --- | --- |
| `text-white/80`, `text-white/90`, `text-white` (bare) | `text-brand-fg` |
| `text-white/60`, `text-white/70`, `text-white/50` | `text-brand-fg-muted` |
| `text-white/40`, `text-white/30` | `text-brand-fg-subtle` |
| `border-white/10`, `border-white/20` | `border-brand-border` |
| `bg-white/5` | `bg-brand-bg` |
| `bg-white/10` | `bg-brand-surface` |

Left alone:
- `bg-black/80` in `src/components/ui/dialog.tsx` and `alert-dialog.tsx` (modal overlay — meant to be dark in both modes).
- `text-white` on colored button surfaces (`bg-brand-accent`, `bg-destructive`, `bg-red-*`, `bg-green-*` etc.) — these need to stay white. After the sweep I'll grep for any line containing one of those background classes and `text-brand-fg`, and revert just those occurrences back to `text-white`.
- `text-white` inside `<Toaster theme=...>` props or sonner internals.
- shadcn primitives in `src/components/ui/*` — only touch the dialog/alert-dialog overlay (already excluded). Other ui primitives already use semantic tokens.

### 3. Settings theme card readability
`ThemeSettingCard` currently styles the *unselected* option with `bg-brand-bg` and the *selected* with `bg-brand-accent/10` plus `border-brand-accent`. After the token sweep these continue to work in both themes (brand-bg/surface swap; accent stays red and tinted background is readable on both). Verify the radio dot color (`text-brand-accent`) and the option labels (`text-brand-fg`, `text-brand-fg-muted`) read correctly.

### 4. Sidebar
`AppSidebar` uses `bg-brand-bg`, `border-brand-border`, plus `text-white` and `text-white/40` for labels. The sweep converts these to `text-brand-fg` / `text-brand-fg-subtle`, so the sidebar follows the theme.

### 5. Toaster
`ThemedToaster` already passes `resolvedTheme` to sonner — no change needed.

## Files touched
- `src/styles.css` — add foreground tokens (light + dark) and four `@theme inline` lines.
- All `*.tsx` under `src/components/` and `src/routes/` that contain the patterns above — sed-driven replacement, then targeted manual fix-back of `text-white` on colored-button rows.

## Out of scope
- No layout changes, no component rewrites, no design overhaul.
- shadcn `ui/` primitives are not edited (already semantic), except the dialog overlay which intentionally stays dark.
- Photo placeholders, status badges colored with red/yellow/green stay as-is.

## Verification
After changes I will:
1. Restart preview (if needed) and rg the codebase to confirm zero remaining `text-white\b` outside colored-button contexts and `border-white/`/`bg-white/` are gone.
2. Spot-check `/garage`, `/garage/$vehicleId`, `/plan`, `/service-history`, `/settings`, and the add/edit dialogs in both modes via `browser--view_preview`.
3. Confirm theme switch in Settings still works and selected card stays distinguishable in light mode.
