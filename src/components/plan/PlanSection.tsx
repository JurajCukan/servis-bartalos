import type { PlannedTask } from "@/lib/queries/scheduledTasks";
import { PlannedTaskCard } from "./PlannedTaskCard";

export function PlanSection({ title, tasks }: { title: string; tasks: PlannedTask[] }) {
  if (tasks.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-semibold text-brand-fg">{title}</h2>
        <span className="text-xs text-brand-fg-muted">{tasks.length}</span>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {tasks.map((t) => (
          <PlannedTaskCard key={t.id} task={t} />
        ))}
      </div>
    </section>
  );
}
