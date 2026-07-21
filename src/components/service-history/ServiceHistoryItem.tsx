import { Link } from "@tanstack/react-router";
import { Car, User, Gauge, ExternalLink } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ServiceTypeBadge } from "@/components/garage/detail/ServiceTypeBadge";
import { ServiceRecordPhotoGrid } from "@/components/garage/detail/photos/ServiceRecordPhotoGrid";
import { formatDateLong as formatDate, formatKm as formatMileage, formatPrice } from "@/lib/format";
import type { ServiceHistoryItem as Item } from "@/lib/queries/serviceHistory";

export function ServiceHistoryItem({ item }: { item: Item }) {
  const customer = item.vehicle?.customer
    ? `${item.vehicle.customer.first_name} ${item.vehicle.customer.last_name}`
    : "—";
  const vehicleLabel = item.vehicle
    ? `${item.vehicle.brand} ${item.vehicle.model}`
    : "Neznáme vozidlo";

  return (
    <Card className="border-brand-border bg-brand-surface p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-brand-fg">{item.title}</h3>
            <ServiceTypeBadge type={item.service_type} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-fg-muted">
            <span>{formatDate(item.date)}</span>
            <span className="inline-flex items-center gap-1">
              <Car className="h-3.5 w-3.5" />
              {vehicleLabel}
            </span>
            {item.vehicle?.license_plate ? (
              <span className="rounded border border-brand-border bg-brand-bg px-1.5 py-0.5 font-mono text-[11px] uppercase text-brand-fg">
                {item.vehicle.license_plate}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {customer}
            </span>
            <span className="inline-flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5" />
              {formatMileage(item.mileage_at_service)}
            </span>
          </div>
          {item.description ? (
            <p className="line-clamp-2 break-words text-sm text-brand-fg-muted">
              {item.description}
            </p>
          ) : null}
          {item.photo_urls && item.photo_urls.length > 0 ? (
            <div className="mt-1">
              <ServiceRecordPhotoGrid urls={item.photo_urls} />
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {(() => {
            const price = formatPrice(item.price);
            return price ? (
              <span className="text-sm font-semibold text-brand-fg">{price}</span>
            ) : null;
          })()}
          {item.vehicle?.id ? (
            <Link
              to="/garage/$vehicleId"
              params={{ vehicleId: item.vehicle.id }}
              className="inline-flex items-center gap-1 rounded-md border border-brand-border bg-brand-bg px-2.5 py-1 text-xs text-brand-fg transition-colors hover:bg-brand-bg hover:text-brand-fg"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Zobraziť vozidlo
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
