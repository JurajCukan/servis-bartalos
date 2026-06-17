import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ServiceHistorySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="border-brand-border bg-brand-surface p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );
}
