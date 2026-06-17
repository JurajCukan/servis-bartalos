export function VehicleDetailSkeleton() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 animate-pulse rounded bg-brand-surface" />
        <div className="flex gap-2">
          <div className="h-9 w-20 animate-pulse rounded bg-brand-surface" />
          <div className="h-9 w-24 animate-pulse rounded bg-brand-surface" />
          <div className="h-9 w-32 animate-pulse rounded bg-brand-surface" />
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface">
        <div className="aspect-[21/9] w-full animate-pulse bg-brand-bg sm:aspect-[21/7]" />
        <div className="space-y-3 p-5">
          <div className="h-8 w-2/3 animate-pulse rounded bg-brand-bg" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-brand-bg" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <div className="h-40 animate-pulse rounded-xl border border-brand-border bg-brand-surface" />
          <div className="h-56 animate-pulse rounded-xl border border-brand-border bg-brand-surface" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="h-28 animate-pulse rounded-xl border border-brand-border bg-brand-surface" />
          <div className="h-28 animate-pulse rounded-xl border border-brand-border bg-brand-surface" />
          <div className="h-28 animate-pulse rounded-xl border border-brand-border bg-brand-surface" />
        </div>
      </div>
    </div>
  );
}
