## Final cleanup before GitHub export

### 1. Remove Supabase from source

- Delete `src/integrations/supabase/` (all 4 files: `client.ts`, `client.server.ts`, `auth-attacher.ts`, `auth-middleware.ts`).
- Rewrite `src/start.ts` to drop the `attachSupabaseAuth` import and middleware:

```ts
import { createStart, createMiddleware } from "@tanstack/react-start";
import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try { return await next(); }
  catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) throw error;
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500, headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
```

- Run `rg supabase src/` after edits to confirm zero remaining references.

### 2. Stop the regeneration

The `src/integrations/supabase/` folder keeps reappearing because **Lovable Cloud is still enabled** on this project. As long as Cloud is on, the integration auto-injects those files on every build. To permanently prevent regeneration you must **disable Lovable Cloud in project Settings → Backend** (I can't toggle it from here). After you disable it, the folder will stay deleted.

### 3. Add `.env.example`

Create at project root:

```
VITE_POCKETBASE_URL=http://localhost:8090
```

### 4. Confirm final PocketBase file structure

Already present, will verify post-cleanup:
- `pocketbase/pb_schema.json` ✓
- `pocketbase/SETUP.md` ✓
- `src/lib/pocketbase.ts` ✓
- `.env.example` (to be created)

### Files touched
- delete: `src/integrations/supabase/` (whole folder)
- edit: `src/start.ts`
- create: `.env.example`

### Note
Until you disable Lovable Cloud in project settings, the Supabase folder may regenerate on the next build — the code-level cleanup is done, but the integration toggle is the permanent fix.
