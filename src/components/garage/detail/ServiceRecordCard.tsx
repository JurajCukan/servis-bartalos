import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceTypeBadge } from "./ServiceTypeBadge";
import type { ServiceRecord } from "@/lib/queries/vehicles";

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("sk-SK", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function formatKm(km: number) {
  return `${new Intl.NumberFormat("sk-SK").format(km)} km`;
}

function formatPrice(p: number) {
  return new Intl.NumberFormat("sk-SK", { style: "currency", currency: "EUR" }).format(p);
}

export function ServiceRecordCard({ record }: { record: ServiceRecord }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((o) => !o)}
      className="group w-full rounded-xl border border-brand-border bg-brand-surface p-4 text-left transition hover:border-brand-accent/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white">{record.title}</h3>
            <ServiceTypeBadge type={record.service_type} />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
            <span>
              <span className="text-white/40">Dátum: </span>
              {formatDate(record.date)}
            </span>
            <span className="tabular-nums">
              <span className="text-white/40">Nájazd: </span>
              {formatKm(record.mileage_at_service)}
            </span>
            {record.price != null && (
              <span className="tabular-nums">
                <span className="text-white/40">Cena: </span>
                {formatPrice(record.price)}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-white/50 transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </div>

      {!open && record.description && (
        <p className="mt-2 line-clamp-2 text-sm text-white/70">{record.description}</p>
      )}

      {open && (
        <div className="mt-4 space-y-3 border-t border-brand-border pt-4 text-sm">
          {record.description && (
            <p className="whitespace-pre-wrap text-white/80">{record.description}</p>
          )}
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {record.parts_replaced && (
              <div>
                <dt className="text-white/50">Vymenené diely</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-white">{record.parts_replaced}</dd>
              </div>
            )}
            {record.technician && (
              <div>
                <dt className="text-white/50">Technik</dt>
                <dd className="mt-0.5 text-white">{record.technician}</dd>
              </div>
            )}
            {record.next_service_km != null && (
              <div>
                <dt className="text-white/50">Ďalší servis pri</dt>
                <dd className="mt-0.5 tabular-nums text-white">
                  {formatKm(record.next_service_km)}
                </dd>
              </div>
            )}
            {record.next_service_date && (
              <div>
                <dt className="text-white/50">Ďalší servis dátum</dt>
                <dd className="mt-0.5 text-white">{formatDate(record.next_service_date)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </button>
  );
}
