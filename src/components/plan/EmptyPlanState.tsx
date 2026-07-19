import { CalendarDays } from "lucide-react";

export function EmptyPlanState() {
  return (
    <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface/40 p-10 text-center">
      <CalendarDays className="mx-auto h-10 w-10 text-brand-fg-subtle" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold text-brand-fg">Zatiaľ nie je nič naplánované</h2>
      <p className="mt-1 text-sm text-brand-fg-muted">Naplánujte prvý servis z detailu vozidla.</p>
    </div>
  );
}
