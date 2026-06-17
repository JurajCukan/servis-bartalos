import { useEffect, useState } from "react";
import { Car } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { formatKm as formatMileage } from "@/lib/format";
import { getVehiclePhotoSignedUrl } from "@/lib/vehiclePhoto";
import type { VehicleWithCustomer } from "@/lib/queries/vehicles";


export function VehicleCard({
  vehicle,
  onClick,
}: {
  vehicle: VehicleWithCustomer;
  onClick?: (v: VehicleWithCustomer) => void;
}) {
  const customerName = vehicle.customer
    ? `${vehicle.customer.first_name} ${vehicle.customer.last_name}`
    : "—";
  const vinShort = vehicle.vin ? vehicle.vin.slice(-8) : null;

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!vehicle.photo_path) {
      setSignedUrl(null);
      return;
    }
    getVehiclePhotoSignedUrl(vehicle.photo_path).then((u) => {
      if (!cancelled) setSignedUrl(u);
    });
    return () => {
      cancelled = true;
    };
  }, [vehicle.photo_path]);

  const imageUrl = signedUrl ?? (vehicle.photo_path ? null : vehicle.photo_url);

  return (
    <button
      type="button"
      onClick={() => onClick?.(vehicle)}
      className="group flex w-full flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-surface text-left transition hover:border-brand-accent/60 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-brand-bg">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-brand-fg-subtle">
            <Car className="h-10 w-10" aria-hidden />
            <span className="text-xs">Bez fotky</span>
          </div>
        )}
        <StatusBadge status={vehicle.status} className="absolute left-3 top-3" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-brand-fg">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="truncate text-sm text-brand-fg-muted">
            {vehicle.year ? `${vehicle.year} · ` : ""}
            {customerName}
          </p>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-brand-fg-muted">ŠPZ</dt>
          <dd className="truncate font-medium text-brand-fg">{vehicle.license_plate}</dd>

          <dt className="text-brand-fg-muted">Nájazd</dt>
          <dd className="tabular-nums font-medium text-brand-fg">
            {formatMileage(vehicle.current_mileage)}
          </dd>

          {vinShort && (
            <>
              <dt className="text-brand-fg-muted">VIN</dt>
              <dd className="truncate font-mono text-xs text-brand-fg">…{vinShort}</dd>
            </>
          )}
        </dl>
      </div>
    </button>
  );
}
