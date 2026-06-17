import type { VehicleStatus } from "@/lib/queries/vehicles";
import { cn } from "@/lib/utils";

const STYLES: Record<VehicleStatus, string> = {
  OK: "bg-emerald-600/90 text-brand-fg",
  "SERVIS NUTNÝ": "bg-red-600/90 text-brand-fg",
  NAPLÁNOVANÉ: "bg-blue-600/90 text-brand-fg",
  ARCHÍV: "bg-zinc-600/90 text-brand-fg",
};

export function StatusBadge({
  status,
  className,
}: {
  status: VehicleStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        STYLES[status],
        className,
      )}
    >
      {status}
    </span>
  );
}
