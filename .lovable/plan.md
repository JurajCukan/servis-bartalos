Cleanup leftover Supabase artifacts from the project.

### 1. Delete `/supabase` folder
- Remove `supabase/config.toml`
- Remove `supabase/migrations/` (all migration files inside)
- Remove the `supabase/` directory itself

### 2. Update `.gitignore`
Append these two lines to `.gitignore`:
```
# Supabase (legacy backend — no longer used)
supabase/
src/integrations/supabase/
```

### Files touched
- delete: `supabase/` (whole folder and contents)
- edit: `.gitignore` (add two ignore patterns)
