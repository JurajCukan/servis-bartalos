## Fix /plan blank page

### Cause

`/plan` returns 200 but renders blank. Console shows:

```
Uncaught: Invariant failed: Expected to find a match below the root match in SPA mode.
    at hydrate (.../router-core/.../ssr-client.js)
    at hydrateStart (.../start-client-core/.../hydrateStart.js)
```

This is a TanStack Start hydration mismatch on the new route. The static preview is serving a pre-built HTML shell whose route tree predates `src/routes/_authenticated/plan.tsx` (the file was added in the previous turn but the dev/preview server cached the prior client bundle). The server HTML has only the root match; the client router has the `/plan` leaf and asserts it should find a child match, so hydration aborts and React renders nothing.

`/garage` works because it existed in the cached build; `/plan` is new.

The user perceives "404" because the page is fully blank.

### Fix

1. Restart the dev server (`code--restart_dev_server`) so the regenerated `routeTree.gen.ts` and the new `plan.tsx` chunk are served fresh and SSR/hydration agree.
2. Verify in preview: navigate to `/plan`, confirm Dnešný plán renders with the four sections; also click "Dnešný plán" in the sidebar from `/garage` to verify in-app navigation; check `browser--read_console_logs` is clean of the invariant error.

No code changes needed — the route file (`src/routes/_authenticated/plan.tsx`), sidebar `<Link to="/plan">`, queries, and migration are already in place from the prior iteration and `routeTree.gen.ts` already lists `/_authenticated/plan`. The bug is a stale dev-server state, not a missing/incorrect route registration.

### Explicit non-changes

- Excel import remains intentionally not implemented.
- No redesign, no rewrite of plan page, scheduling form, or sidebar.
- Slovak labels and dark UI untouched.

### Verification checklist after restart

- `/plan` direct URL renders the dark plan page (no blank, no hydration error in console).
- Sidebar "Dnešný plán" navigates to `/plan` and marks itself active.
- "Zobraziť vozidlo" link on a task card navigates to `/garage/$vehicleId`.
- "Označiť ako dokončené" updates status and removes the task from the active list.
