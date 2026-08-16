import { useState } from "react";
import { ChevronDown, ImageIcon, Pencil, FileDown } from "lucide-react";
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
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-base font-semibold text-brand-fg">
              {record.title}
            </h3>
            <ServiceTypeBadge type={record.service_type} />
            {record.photos && record.photos.length > 0 && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded border border-brand-border bg-brand-bg px-1.5 py-0.5 text-[11px] text-brand-fg-muted">
                <ImageIcon className="h-3 w-3" aria-hidden />
                {record.photos.length}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-brand-fg-muted">
            <span>
              <span className="text-brand-fg-subtle">Dátum: </span>
              {formatDate(record.date)}
            </span>
            <span className="tabular-nums">
              <span className="text-brand-fg-subtle">Nájazd: </span>
              {formatKm(record.mileage_at_service)}
            </span>
            {(() => {
              const price = formatPrice(record.price);
              return price ? (
                <span className="tabular-nums">
                  <span className="text-brand-fg-subtle">Cena: </span>
                  {price}
                </span>
              ) : null;
            })()}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={async (e) => {
              e.stopPropagation();
              try {
                if (!window.electronAPI) return;
                const result = await window.electronAPI.documents.generatePdf({
                  route: `/print/service-protocol/${record.id}`,
                  filename: `servisny-protokol-${record.id.substring(0, 8)}`
                });
                if (!result.canceled && result.filePath) {
                  window.electronAPI.documents.revealPdf(result.filePath);
                }
              } catch (error) {
                console.error("Chyba pri generovaní PDF:", error);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs font-medium text-brand-fg-muted transition hover:border-brand-border hover:bg-brand-bg hover:text-brand-fg"
            aria-label="Tlačiť protokol"
          >
            <FileDown className="h-3.5 w-3.5" aria-hidden />
            Protokol
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(record);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-xs font-medium text-brand-fg-muted transition hover:border-brand-border hover:bg-brand-bg hover:text-brand-fg"
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
            className="rounded-md p-1 text-brand-fg-muted transition hover:text-brand-fg"
          >
            <ChevronDown
              className={cn("h-5 w-5 transition-transform", open && "rotate-180")}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {!open && record.description?.trim() && (
        <p className="mt-2 line-clamp-2 text-sm text-brand-fg-muted">{record.description.trim()}</p>
      )}

      {open && (
        <div className="mt-4 space-y-3 border-t border-brand-border pt-4 text-sm">
          {record.description?.trim() && (
            <p className="whitespace-pre-wrap text-brand-fg">{record.description.trim()}</p>
          )}
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {record.parts_replaced?.trim() && (
              <div>
                <dt className="text-brand-fg-muted">Vymenené diely</dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-brand-fg">
                  {record.parts_replaced.trim()}
                </dd>
              </div>
            )}
            {record.technician?.trim() && (
              <div>
                <dt className="text-brand-fg-muted">Technik</dt>
                <dd className="mt-0.5 text-brand-fg">{record.technician.trim()}</dd>
              </div>
            )}
            {record.next_service_km != null && (
              <div>
                <dt className="text-brand-fg-muted">Ďalší servis pri</dt>
                <dd className="mt-0.5 tabular-nums text-brand-fg">
                  {formatKm(record.next_service_km)}
                </dd>
              </div>
            )}
            {record.next_service_date && (
              <div>
                <dt className="text-brand-fg-muted">Ďalší servis dátum</dt>
                <dd className="mt-0.5 text-brand-fg">{formatDate(record.next_service_date)}</dd>
              </div>
            )}
          </dl>
          {record.photo_urls && record.photo_urls.length > 0 && (
            <ServiceRecordPhotoGrid urls={record.photo_urls} />
          )}
        </div>
      )}
    </div>
  );
}
