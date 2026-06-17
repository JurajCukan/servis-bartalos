import { Link } from "@tanstack/react-router";
import { ArrowLeft, Car } from "lucide-react";
import { StatusBadge } from "../StatusBadge";
import type { VehicleDetail } from "@/lib/queries/vehicles";

function formatMileage(km: number) {
  return `${new Intl.NumberFormat("sk-SK").format(km)} km`;
}

export function VehicleDetailHeader({
  vehicle,
  onAction,
}: {
  vehicle: VehicleDetail;
  onAction: () => void;
}) {
  const title = [vehicle.year, vehicle.brand, vehicle.model].filter(Boolean).join(" ");

  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/garage"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-white/70 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Späť na garáž
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAction}
            className="rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm font-medium text-white transition hover:border-brand-accent hover:text-brand-accent"
          >
            Upraviť
          </button>
          <button
            type="button"
            onClick={onAction}
            className="rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm font-medium text-white transition hover:border-brand-accent hover:text-brand-accent"
          >
            Naplánovať
          </button>
          <button
            type="button"
            onClick={onAction}
            className="rounded-md bg-brand-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent-hover"
          >
            + Pridať záznam
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
        <div className="relative aspect-[21/9] w-full bg-brand-bg sm:aspect-[21/7]">
          {vehicle.photo_url ? (
            <img
              src={vehicle.photo_url}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-white/40">
              <Car className="h-12 w-12" aria-hidden />
              <span className="text-sm">Bez fotky</span>
            </div>
          )}
          <StatusBadge status={vehicle.status} className="absolute left-4 top-4" />
        </div>

        <div className="flex flex-col gap-4 p-5">
          <h1 className="text-2xl font-semibold text-white sm:text-3xl">{title}</h1>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-white/50">VIN</dt>
              <dd className="mt-0.5 break-all font-mono text-white">{vehicle.vin ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-white/50">ŠPZ</dt>
              <dd className="mt-0.5 font-medium text-white">{vehicle.license_plate}</dd>
            </div>
            <div>
              <dt className="text-white/50">Nájazd</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-white">
                {formatMileage(vehicle.current_mileage)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </header>
  );
}
