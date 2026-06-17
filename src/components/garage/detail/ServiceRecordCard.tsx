import { useState } from "react";
import { ChevronDown, ImageIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatKm, formatPrice } from "@/lib/format";
import { ServiceTypeBadge } from "./ServiceTypeBadge";
import { ServiceRecordPhotoGrid } from "./photos/ServiceRecordPhotoGrid";
import type { ServiceRecord } from "@/lib/queries/vehicles";

export function ServiceRecordCard({
  record,
  onEdit,
}: {
  record: ServiceRecord;
  onEdit?: (record: ServiceRecord) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="group w-full rounded-xl border border-brand-border bg-brand-surface p-4 transition hover:border-brand-accent/60">
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent rounded-md"
        >
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
            {(() => {
              const price = formatPrice(record.price);
              return price ? (
                <span className="tabular-nums">
                  <span className="text-white/40">Cena: </span>
                  {price}
                </span>
              ) : null;
            })()}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(record);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs font-medium text-white/70 transition hover:border-brand-border hover:bg-brand-bg hover:text-white"
              aria-label="Upraviť záznam"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden />
              Upraviť
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Zbaliť" : "Rozbaliť"}
            className="rounded-md p-1 text-white/50 transition hover:text-white"
          >
            <ChevronDown
              className={cn("h-5 w-5 transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {!open && record.description?.trim() && (
        <p className="mt-2 line-clamp-2 text-sm text-white/70">{record.description.trim()}</p>
      )}

      {open && (
        <div className="mt-4 space-y-3 border-t border-brand-border pt-4 text-sm">
          {record.description?.trim() && (
            <p className="whitespace-pre-wrap text-white/80">{record.description.trim()}</p>
          )}
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {record.parts_replaced?.trim() && (
              <div>
                <dt className="text-white/50">Vymenené diely</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-white">{record.parts_replaced.trim()}</dd>
              </div>
            )}
            {record.technician?.trim() && (
              <div>
                <dt className="text-white/50">Technik</dt>
                <dd className="mt-0.5 text-white">{record.technician.trim()}</dd>
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
    </div>
  );
}
