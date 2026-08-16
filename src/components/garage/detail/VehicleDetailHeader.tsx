import { Link } from "@tanstack/react-router";
import { ArrowLeft, Car, FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { formatKm as formatMileage } from "@/lib/format";
import type { VehicleDetail } from "@/lib/queries/vehicles";

export function VehicleDetailHeader({
  vehicle,
  onAction,
  onSchedule,
  onAddRecord,
  onExportClick,
}: {
  vehicle: VehicleDetail;
  onAction: () => void;
  onSchedule: () => void;
  onAddRecord: () => void;
  onExportClick: () => void;
}) {
  const title = [vehicle.year, vehicle.brand, vehicle.model].filter(Boolean).join(" ");
  const imageUrl = vehicle.photo_url;

  return (
    <header className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/garage"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-brand-fg-muted transition hover:text-brand-fg"
        >
          <ArrowLeft className="h-4 w-4" />
          Späť na garáž
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                if (!window.electronAPI) return;
                const result = await window.electronAPI.documents.generatePdf({
                  route: `/print/service-book/${vehicle.id}`,
                  filename: `servisna-knizka-${vehicle.license_plate}`
                });
                if (!result.canceled && result.filePath) {
                  window.electronAPI.documents.revealPdf(result.filePath);
                }
              } catch (error) {
                console.error("Chyba pri generovaní PDF:", error);
              }
            }}
            className="inline-flex items-center gap-2 rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm font-medium text-brand-fg transition hover:border-brand-accent hover:text-brand-accent disabled:opacity-50"
          >
            <FileDown className="h-4 w-4" />
            Servisná knižka PDF
          </button>
          <button
            type="button"
            onClick={onAction}
            className="rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm font-medium text-brand-fg transition hover:border-brand-accent hover:text-brand-accent"
          >
            Upraviť
          </button>
          <button
            type="button"
            onClick={onSchedule}
            className="rounded-md border border-brand-border bg-brand-surface px-3 py-2 text-sm font-medium text-brand-fg transition hover:border-brand-accent hover:text-brand-accent"
          >
            Naplánovať
          </button>
          <button
            type="button"
            onClick={onAddRecord}
            className="rounded-md bg-brand-accent px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent-hover"
          >
            + Pridať záznam
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
        <div className="relative aspect-[21/9] w-full bg-brand-bg sm:aspect-[21/7]">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-brand-fg-subtle">
              <Car className="h-12 w-12" aria-hidden />
              <span className="text-sm">Bez fotky</span>
            </div>
          )}

        </div>

        <div className="flex flex-col gap-4 p-5">
          <h1 className="text-2xl font-semibold text-brand-fg sm:text-3xl">{title}</h1>
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-brand-fg-muted">VIN</dt>
              <dd className="mt-0.5 break-all font-mono text-brand-fg">{vehicle.vin ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-brand-fg-muted">ŠPZ</dt>
              <dd className="mt-0.5 font-mono font-medium text-brand-fg">
                {vehicle.license_plate}
              </dd>
            </div>
            <div>
              <dt className="text-brand-fg-muted">Nájazd</dt>
              <dd className="mt-0.5 font-medium tabular-nums text-brand-fg">
                {formatMileage(vehicle.current_mileage)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </header>
  );
}
