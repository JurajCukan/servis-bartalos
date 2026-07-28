import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VehicleWithCustomer } from "@/lib/queries/vehicles";

export const STATUS_OPTIONS = [
  { value: "all", label: "VŠETKY" },
  { value: "NAPLÁNOVANÉ", label: "NAPLÁNOVANÉ" },
] as const;

export const FUEL_OPTIONS = [
  { value: "all", label: "Všetky palivá" },
  { value: "benzín", label: "benzín" },
  { value: "diesel", label: "diesel" },
  { value: "hybrid", label: "hybrid" },
  { value: "elektro", label: "elektro" },
  { value: "LPG", label: "LPG" },
] as const;

export function VehicleFilters({
  status,
  fuel,
  vehicles,
  onStatusChange,
  onFuelChange,
}: {
  status: string;
  fuel: string;
  vehicles: VehicleWithCustomer[];
  onStatusChange: (v: string) => void;
  onFuelChange: (v: string) => void;
}) {
  const counts: Record<string, number> = { all: vehicles.length };
  for (const v of vehicles) counts[v.status] = (counts[v.status] ?? 0) + 1;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((o) => {
          const active = status === o.value;
          const count = counts[o.value] ?? 0;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onStatusChange(o.value)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition " +
                (active
                  ? "border-brand-accent bg-brand-accent/10 text-brand-accent"
                  : "border-brand-border bg-brand-surface text-brand-fg hover:bg-brand-bg hover:text-brand-accent/80")
              }
            >
              {o.label}
              {count > 0 && (
                <span
                  className={
                    "rounded-full px-1.5 py-0.5 text-[10px] leading-none flex items-center justify-center " +
                    (active ? "bg-brand-accent text-white" : "bg-brand-border text-brand-fg-muted")
                  }
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Select value={fuel} onValueChange={onFuelChange}>
        <SelectTrigger className="h-10 w-full sm:w-[170px] border-brand-border bg-brand-surface text-brand-fg">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {FUEL_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
