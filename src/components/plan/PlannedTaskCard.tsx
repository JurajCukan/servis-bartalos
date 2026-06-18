import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Gauge, CheckCircle2, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { formatDateLong, formatKm } from "@/lib/format";
import type { PlannedTask, TaskPriority, TaskStatus } from "@/lib/queries/scheduledTasks";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Vysoká: "bg-red-500/15 text-red-300 border-red-500/40",
  Stredná: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  Nízka: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  "Čakajúce": "bg-brand-surface text-brand-fg-muted border-brand-border",
  "Dokončené": "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  "Zrušené": "bg-brand-surface text-brand-fg-muted border-brand-border",
};

export function PlannedTaskCard({ task }: { task: PlannedTask }) {
  const queryClient = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async (status: TaskStatus) => {
      const { error } = await supabase
        .from("scheduled_tasks")
        .update({ status })
        .eq("id", task.id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-tasks", "active"] });
      if (status === "Dokončené") toast.success("Úkon bol označený ako dokončený");
      else if (status === "Zrušené") toast.success("Plán bol zrušený");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Akciu sa nepodarilo uložiť");
    },
  });

  const v = task.vehicle;
  const customer = v?.customer
    ? `${v.customer.first_name} ${v.customer.last_name}`
    : "—";
  const busy = updateStatus.isPending;

  return (
    <article className="flex flex-col gap-3 rounded-xl border border-brand-border bg-brand-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
          >
            {task.priority}
          </span>
          {task.task_type && (
            <span className="min-w-0 truncate text-sm font-semibold text-brand-fg">
              {task.task_type}
            </span>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLES[task.status]}`}
        >
          {task.status}
        </span>
      </div>

      <div className="min-w-0 text-sm text-brand-fg">
        {v ? (
          <p className="break-words">
            <span className="font-medium text-brand-fg">
              {v.brand} {v.model}
            </span>{" "}
            · <span className="break-all font-mono">{v.license_plate}</span>
          </p>
        ) : (
          <p className="text-brand-fg-muted">Vozidlo bolo odstránené</p>
        )}
        <p className="break-words text-brand-fg-muted">{customer}</p>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm text-brand-fg">
        {task.description}
      </p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-fg-muted">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {formatDateLong(task.planned_date)}
        </span>
        {task.planned_mileage != null && (
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Gauge className="h-3.5 w-3.5" />
            {formatKm(task.planned_mileage)}
          </span>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-brand-border pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        {v && (
          <Link
            to="/garage/$vehicleId"
            params={{ vehicleId: v.id }}
            className="inline-flex items-center justify-center rounded-md border border-brand-border bg-transparent px-3 py-1.5 text-xs font-medium text-brand-fg transition hover:border-brand-accent hover:text-brand-fg"
          >
            Zobraziť vozidlo
          </Link>
        )}
        {task.status === "Čakajúce" && (
          <>
            <button
              type="button"
              onClick={() => updateStatus.mutate("Zrušené")}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1 rounded-md border border-brand-border px-3 py-1.5 text-xs font-medium text-brand-fg-muted transition hover:text-brand-fg disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Zrušiť
            </button>
            <button
              type="button"
              onClick={() => updateStatus.mutate("Dokončené")}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-accent-hover disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Označiť ako dokončené
            </button>
          </>
        )}
      </div>
    </article>
  );
}
