import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TASK_TYPES = [
  "Kompletný servis",
  "Výmena oleja",
  "Výmena bŕzd",
  "Výmena pneumatík",
  "Oprava – motor",
  "Oprava – elektroinštalácia",
  "Oprava – prevodovka",
  "Oprava – klimatizácia",
  "Kontrola / diagnostika",
  "STK príprava",
  "Iné",
] as const;

const PRIORITIES = ["Nízka", "Stredná", "Vysoká"] as const;

const schema = z.object({
  planned_date: z.string().min(1, "Toto pole je povinné"),
  task_type: z.string().min(1, "Toto pole je povinné"),
  description: z.string().trim().min(1, "Toto pole je povinné").max(2000),
  planned_mileage: z
    .union([
      z.literal(""),
      z.coerce.number().int("Zadajte platný nájazd").positive("Zadajte platný nájazd"),
    ])
    .optional(),
  priority: z.enum(PRIORITIES),
});

type FormInput = z.input<typeof schema>;
type FormValues = z.output<typeof schema>;

function today() {
  return new Date().toISOString().slice(0, 10);
}

const inputCls =
  "bg-brand-bg border-brand-border text-white placeholder:text-white/30 focus-visible:ring-brand-accent";

export function ScheduleTaskForm({
  vehicleId,
  onCancel,
  onSuccess,
}: {
  vehicleId: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      planned_date: today(),
      task_type: "",
      description: "",
      planned_mileage: "",
      priority: "Stredná",
    },
  });

  const mutation = useMutation({
    mutationFn: async (raw: FormValues) => {
      const mileage =
        raw.planned_mileage === "" || raw.planned_mileage == null
          ? null
          : Number(raw.planned_mileage);
      const { error } = await supabase.from("scheduled_tasks").insert({
        vehicle_id: vehicleId,
        planned_date: raw.planned_date,
        planned_mileage: mileage,
        task_type: raw.task_type,
        description: raw.description,
        priority: raw.priority,
        status: "Čakajúce",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-tasks", "active"] });
      toast.success("Servis bol naplánovaný");
      onSuccess();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Plán sa nepodarilo uložiť");
    },
  });

  const onSubmit: SubmitHandler<FormInput> = (values) => {
    mutation.mutate(values as unknown as FormValues);
  };

  const errors = form.formState.errors;
  const submitting = mutation.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dátum" error={errors.planned_date?.message} required>
          <Input type="date" className={inputCls} {...form.register("planned_date")} />
        </Field>
        <Field label="Plánovaný nájazd (km)" error={errors.planned_mileage?.message}>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            className={inputCls}
            {...form.register("planned_mileage")}
          />
        </Field>
      </div>

      <Field label="Typ úkonu" error={errors.task_type?.message} required>
        <Select
          value={form.watch("task_type")}
          onValueChange={(v) =>
            form.setValue("task_type", v, { shouldValidate: true, shouldDirty: true })
          }
        >
          <SelectTrigger className={inputCls}>
            <SelectValue placeholder="Vyberte typ úkonu" />
          </SelectTrigger>
          <SelectContent>
            {TASK_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Priorita" error={errors.priority?.message}>
        <Select
          value={form.watch("priority")}
          onValueChange={(v) =>
            form.setValue("priority", v as (typeof PRIORITIES)[number], {
              shouldDirty: true,
            })
          }
        >
          <SelectTrigger className={inputCls}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Popis" error={errors.description?.message} required>
        <Textarea rows={4} className={inputCls} {...form.register("description")} />
      </Field>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="border-brand-border bg-transparent text-white hover:bg-brand-surface"
        >
          Zrušiť
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-brand-accent text-white hover:bg-brand-accent-hover"
        >
          {submitting ? "Ukladám…" : "Uložiť plán"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-white/80">
        {label}
        {required && <span className="ml-1 text-brand-accent">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
