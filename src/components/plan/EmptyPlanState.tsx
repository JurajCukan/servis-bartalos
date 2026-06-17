import { CalendarDays } from "lucide-react";

export function EmptyPlanState() {
  return (
    <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface/40 p-10 text-center">
      <CalendarDays className="mx-auto h-10 w-10 text-white/40" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold text-white">
        Zatiaľ nie je nič naplánované
      </h2>
      <p className="mt-1 text-sm text-white/60">
        Naplánujte prvý servis z detailu vozidla.
      </p>
    </div>
  );
}
