import { Plus } from "lucide-react";
import { ServiceRecordCard } from "./ServiceRecordCard";
import { EmptyState } from "../EmptyState";
import type { ServiceRecord } from "@/lib/queries/vehicles";

function recordsLabel(n: number) {
  if (n === 1) return "1 záznam";
  if (n >= 2 && n <= 4) return `${n} záznamy`;
  return `${n} záznamov`;
}

function SkeletonCard() {
  return (
    <div className="h-28 animate-pulse rounded-xl border border-brand-border bg-brand-surface" />
  );
}

export function ServiceHistorySection({
  records,
  loading,
  onAdd,
  onEdit,
}: {
  records: ServiceRecord[] | undefined;
  loading: boolean;
  onAdd: () => void;
  onEdit?: (record: ServiceRecord) => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-brand-fg">Servisná história</h2>
        {records && records.length > 0 && (
          <span className="text-sm text-brand-fg-muted">{recordsLabel(records.length)}</span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : !records || records.length === 0 ? (
        <EmptyState
          title="Zatiaľ bez servisnej histórie"
          description="Pre toto vozidlo ešte nebol pridaný žiadny servisný záznam."
          action={
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex items-center gap-2 rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Pridať záznam
            </button>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {records.map((r) => (
            <ServiceRecordCard key={r.id} record={r} onEdit={onEdit} />
          ))}
        </div>
      )}
    </section>
  );
}
