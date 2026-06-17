import type { VehicleStatus } from "@/lib/queries/vehicles";
import { cn } from "@/lib/utils";

const STYLES: Record<VehicleStatus, string> = {
  OK: "bg-emerald-600/90 text-white",
  "SERVIS NUTNÝ": "bg-red-600/90 text-white",
  NAPLÁNOVANÉ: "bg-blue-600/90 text-white",
  ARCHÍV: "bg-zinc-600/90 text-white",
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
