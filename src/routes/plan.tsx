import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { AppShell } from "@/components/app/AppShell";
import { PlanPageHeader } from "@/components/plan/PlanPageHeader";
import { PlanSection } from "@/components/plan/PlanSection";
import { EmptyPlanState } from "@/components/plan/EmptyPlanState";
import { DashboardLoadingSkeleton } from "@/components/garage/LoadingSkeleton";
import { EmptyState } from "@/components/garage/EmptyState";
import {
  plannedTasksQuery,
  type PlannedTask,
  type TaskPriority,
} from "@/lib/queries/scheduledTasks";
import { usePocketBaseRealtime } from "@/hooks/usePocketBaseRealtime";

export const Route = createFileRoute("/plan")({
  head: () => ({ meta: [{ title: "Dnešný plán — Servisná knižka Bartalos" }] }),
  component: PlanPage,
});

function todayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const PRIORITY_ORDER: Record<TaskPriority, number> = {
  Vysoká: 0,
  Stredná: 1,
  Nízka: 2,
};

function sortBucket(a: PlannedTask, b: PlannedTask) {
  const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (p !== 0) return p;
  return a.planned_date.localeCompare(b.planned_date);
}

function PlanPage() {
  const { data, isLoading, error } = useQuery(plannedTasksQuery);

  usePocketBaseRealtime("scheduled_tasks", [["scheduled-tasks"]]);

  const grouped = useMemo(() => {
    const today = todayIso();
    const tomorrow = addDaysIso(today, 1);
    const weekEnd = addDaysIso(today, 7); // exclusive

    const dnes: PlannedTask[] = [];
    const zajtra: PlannedTask[] = [];
    const tyzden: PlannedTask[] = [];
    const neskor: PlannedTask[] = [];

    for (const t of data ?? []) {
      if (t.status !== "Čakajúce") continue;
      const d = t.planned_date;
      if (d <= today) dnes.push(t); // include overdue in today
      else if (d === tomorrow) zajtra.push(t);
      else if (d < weekEnd) tyzden.push(t);
      else neskor.push(t);
    }

    dnes.sort(sortBucket);
    zajtra.sort(sortBucket);
    tyzden.sort(sortBucket);
    neskor.sort(sortBucket);

    return { dnes, zajtra, tyzden, neskor };
  }, [data]);

  const total =
    grouped.dnes.length +
    grouped.zajtra.length +
    grouped.tyzden.length +
    grouped.neskor.length;

  return (
    <AppShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <PlanPageHeader />
        {isLoading ? (
          <DashboardLoadingSkeleton />
        ) : error ? (
          <EmptyState
            title="Nepodarilo sa načítať plán"
            description="Skúste obnoviť stránku."
          />
        ) : total === 0 ? (
          <EmptyPlanState />
        ) : (
          <div className="flex flex-col gap-8">
            <PlanSection title="Dnes" tasks={grouped.dnes} />
            <PlanSection title="Zajtra" tasks={grouped.zajtra} />
            <PlanSection title="Tento týždeň" tasks={grouped.tyzden} />
            <PlanSection title="Neskôr" tasks={grouped.neskor} />
          </div>
        )}
      </div>
    </AppShell>
  );
}
