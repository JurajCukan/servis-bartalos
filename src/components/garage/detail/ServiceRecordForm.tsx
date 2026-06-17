import { useEffect } from "react";
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
import type { ServiceRecord } from "@/lib/queries/vehicles";

const SERVICE_TYPES = [
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

const optionalPositiveInt = z
  .union([z.literal(""), z.coerce.number().int().positive("Zadajte platný nájazd")])
  .optional();

const optionalPositiveNumber = z
  .union([z.literal(""), z.coerce.number().positive("Zadajte platnú cenu")])
  .optional();

const schema = z.object({
  date: z.string().min(1, "Toto pole je povinné"),
  mileage_at_service: z.coerce
    .number({ invalid_type_error: "Zadajte platný nájazd" })
    .int("Zadajte platný nájazd")
    .positive("Zadajte platný nájazd"),
  service_type: z.string().min(1, "Toto pole je povinné"),
  title: z.string().trim().min(1, "Toto pole je povinné").max(120),
  description: z.string().trim().min(1, "Toto pole je povinné").max(2000),
  parts_replaced: z.string().trim().max(2000).optional().or(z.literal("")),
  price: optionalPositiveNumber,
  technician: z.string().trim().max(120).optional().or(z.literal("")),
  next_service_km: optionalPositiveInt,
  next_service_date: z.string().optional().or(z.literal("")),
});

type FormValues = z.input<typeof schema>;
type ParsedValues = z.output<typeof schema>;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function emptyToNull<T>(v: T | "" | undefined | null): T | null {
  if (v === "" || v === undefined || v === null) return null;
  return v;
}

type Mode = "create" | "edit";

export function ServiceRecordForm({
  mode = "create",
  record,
  vehicleId,
  currentMileage,
  onCancel,
  onSuccess,
}: {
  mode?: Mode;
  record?: ServiceRecord;
  vehicleId: string;
  currentMileage: number;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = mode === "edit" && record != null;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? {
          date: record.date,
          mileage_at_service: record.mileage_at_service as unknown as number,
          service_type: record.service_type,
          title: record.title,
          description: record.description,
          parts_replaced: record.parts_replaced ?? "",
          price: (record.price ?? "") as unknown as number,
          technician: record.technician ?? "",
          next_service_km: (record.next_service_km ?? "") as unknown as number,
          next_service_date: record.next_service_date ?? "",
        }
      : {
          date: today(),
          mileage_at_service: "" as unknown as number,
          service_type: "",
          title: "",
          description: "",
          parts_replaced: "",
          price: "",
          technician: "",
          next_service_km: "",
          next_service_date: "",
        },
  });

  useEffect(() => {
    if (!isEdit) form.setFocus("title");
  }, [form, isEdit]);

  const mutation = useMutation({
    mutationFn: async (raw: ParsedValues) => {
      const newMileage = raw.mileage_at_service;
      const nextKm = emptyToNull(raw.next_service_km) as number | null;
      const nextDate = emptyToNull(raw.next_service_date) as string | null;

      const payload = {
        date: raw.date,
        mileage_at_service: newMileage,
        service_type: raw.service_type,
        title: raw.title,
        description: raw.description,
        parts_replaced: emptyToNull(raw.parts_replaced) as string | null,
        price: emptyToNull(raw.price) as number | null,
        technician: emptyToNull(raw.technician) as string | null,
        next_service_km: nextKm,
        next_service_date: nextDate,
      };

      if (isEdit && record) {
        const { error: updateError } = await supabase
          .from("service_records")
          .update(payload)
          .eq("id", record.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("service_records")
          .insert({ vehicle_id: vehicleId, ...payload });
        if (insertError) throw insertError;
      }

      let mileageUpdated = false;
      if (newMileage > currentMileage) {
        const { error: updErr } = await supabase
          .from("vehicles")
          .update({ current_mileage: newMileage })
          .eq("id", vehicleId);
        if (updErr) {
          console.warn("Mileage update failed", updErr);
        } else {
          mileageUpdated = true;
        }
      }

      // Auto-create scheduled task only on create flow
      if (!isEdit && (nextKm != null || nextDate != null)) {
        const { error: taskErr } = await supabase.from("scheduled_tasks").insert({
          vehicle_id: vehicleId,
          planned_date: nextDate ?? today(),
          planned_mileage: nextKm,
          task_type: raw.service_type,
          description: `Automaticky vytvorené zo servisného záznamu: ${raw.title}`,
          priority: "Stredná",
          status: "Čakajúce",
        });
        if (taskErr) {
          console.warn("Scheduled task creation failed", taskErr);
          toast.warning("Záznam uložený, ale plánovanú úlohu sa nepodarilo vytvoriť");
        }
      }

      return { mileageUpdated };
    },
    onSuccess: ({ mileageUpdated }) => {
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId, "service-records"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["service-history"] });
      if (mileageUpdated) {
        queryClient.invalidateQueries({ queryKey: ["vehicles", "with-customers"] });
      }
      toast.success(isEdit ? "Servisný záznam bol upravený" : "Servisný záznam bol uložený");
      onSuccess();
    },
    onError: (err) => {
      console.error(err);
      toast.error("Servisný záznam sa nepodarilo uložiť");
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    mutation.mutate(values as unknown as ParsedValues);
  };

  const errors = form.formState.errors;
  const isSubmitting = mutation.isPending || form.formState.isSubmitting;

  const inputCls =
    "bg-brand-bg border-brand-border text-white placeholder:text-white/30 focus-visible:ring-brand-accent";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dátum" error={errors.date?.message} required>
          <Input type="date" className={inputCls} {...form.register("date")} />
        </Field>

        <Field
          label="Nájazd pri servise (km)"
          error={errors.mileage_at_service?.message}
          required
        >
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            className={inputCls}
            {...form.register("mileage_at_service")}
          />
        </Field>
      </div>

      <Field label="Typ servisu" error={errors.service_type?.message} required>
        <Select
          value={form.watch("service_type")}
          onValueChange={(v) =>
            form.setValue("service_type", v, { shouldValidate: true, shouldDirty: true })
          }
        >
          <SelectTrigger className={inputCls}>
            <SelectValue placeholder="Vyberte typ servisu" />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Názov záznamu" error={errors.title?.message} required>
        <Input
          className={inputCls}
          placeholder="napr. Pravidelná údržba 60 000 km"
          {...form.register("title")}
        />
      </Field>

      <Field label="Popis" error={errors.description?.message} required>
        <Textarea rows={4} className={inputCls} {...form.register("description")} />
      </Field>

      <Field label="Vymenené diely" error={errors.parts_replaced?.message}>
        <Textarea rows={3} className={inputCls} {...form.register("parts_replaced")} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cena (€)" error={errors.price?.message}>
          <Input
            type="number"
            step="0.01"
            min={0}
            className={inputCls}
            {...form.register("price")}
          />
        </Field>

        <Field label="Technik" error={errors.technician?.message}>
          <Input className={inputCls} {...form.register("technician")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ďalší servis pri (km)" error={errors.next_service_km?.message}>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            className={inputCls}
            {...form.register("next_service_km")}
          />
        </Field>

        <Field label="Ďalší servis dátum" error={errors.next_service_date?.message}>
          <Input type="date" className={inputCls} {...form.register("next_service_date")} />
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-brand-border bg-transparent text-white hover:bg-brand-surface"
        >
          Zrušiť
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-accent text-white hover:bg-brand-accent-hover"
        >
          {isSubmitting ? "Ukladám…" : isEdit ? "Uložiť zmeny" : "Uložiť záznam"}
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
