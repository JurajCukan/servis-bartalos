import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Calendar, Gauge, CheckCircle2, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import type { PlannedTask, TaskPriority, TaskStatus } from "@/lib/queries/scheduledTasks";

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  Vysoká: "bg-red-500/15 text-red-300 border-red-500/40",
  Stredná: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  Nízka: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  "Čakajúce": "bg-brand-surface text-white/70 border-brand-border",
  "Dokončené": "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
  "Zrušené": "bg-white/10 text-white/50 border-brand-border",
};

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("sk-SK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatMileage(km: number) {
  return `${new Intl.NumberFormat("sk-SK").format(km)} km`;
}

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
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
          >
            {task.priority}
          </span>
          {task.task_type && (
            <span className="text-sm font-semibold text-white">{task.task_type}</span>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLES[task.status]}`}
        >
          {task.status}
        </span>
      </div>

      <div className="text-sm text-white/80">
        {v ? (
          <p>
            <span className="font-medium text-white">
              {v.brand} {v.model}
            </span>{" "}
            · <span className="font-mono">{v.license_plate}</span>
          </p>
        ) : (
          <p className="text-white/50">Vozidlo bolo odstránené</p>
        )}
        <p className="text-white/60">{customer}</p>
      </div>

      <p className="text-sm text-white/80">{task.description}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {formatDate(task.planned_date)}
        </span>
        {task.planned_mileage != null && (
          <span className="inline-flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5" />
            {formatMileage(task.planned_mileage)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-brand-border pt-3">
        {v && (
          <Link
            to="/garage/$vehicleId"
            params={{ vehicleId: v.id }}
            className="rounded-md border border-brand-border bg-transparent px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-brand-accent hover:text-white"
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
              className="inline-flex items-center gap-1 rounded-md border border-brand-border px-3 py-1.5 text-xs font-medium text-white/70 transition hover:text-white disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Zrušiť
            </button>
            <button
              type="button"
              onClick={() => updateStatus.mutate("Dokončené")}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-accent-hover disabled:opacity-50"
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
