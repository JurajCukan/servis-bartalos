import { useEffect, useMemo, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";

import { compressImages } from "@/lib/imageCompression";
import { ServiceRecordPhotoPicker, type ExistingPhoto } from "./photos/ServiceRecordPhotoPicker";
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

const MAX_MILEAGE = 2_000_000;
const MAX_PRICE = 1_000_000;
const MAX_TITLE = 120;
const MAX_LONG = 2000;
const MIN_DATE = "1900-01-01";
const MAX_NEXT_DATE = "2100-01-01";

function isValidDateStr(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !Number.isNaN(d.getTime());
}

function maxToday() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

const optionalPositiveInt = z
  .union([
    z.literal(""),
    z.coerce
      .number({ invalid_type_error: "Zadajte platný údaj" })
      .finite("Zadajte platný údaj")
      .int("Zadajte platný údaj")
      .positive("Zadajte platný údaj")
      .max(MAX_MILEAGE, "Hodnota je príliš vysoká"),
  ])
  .optional();

const optionalPositiveNumber = z
  .union([
    z.literal(""),
    z.coerce
      .number({ invalid_type_error: "Zadajte platnú cenu" })
      .finite("Zadajte platnú cenu")
      .positive("Zadajte platnú cenu")
      .max(MAX_PRICE, "Hodnota je príliš vysoká"),
  ])
  .optional();

const schema = z
  .object({
    date: z
      .string()
      .min(1, "Toto pole je povinné")
      .refine(isValidDateStr, "Zadajte platný dátum")
      .refine((s) => s >= MIN_DATE, "Zadajte platný dátum")
      .refine((s) => s <= maxToday(), "Zadajte platný dátum"),
    mileage_at_service: z.coerce
      .number({ invalid_type_error: "Zadajte platný nájazd" })
      .finite("Zadajte platný nájazd")
      .int("Zadajte platný nájazd")
      .positive("Zadajte platný nájazd")
      .max(MAX_MILEAGE, "Hodnota je príliš vysoká"),
    service_type: z
      .string()
      .min(1, "Toto pole je povinné")
      .refine((v) => (SERVICE_TYPES as readonly string[]).includes(v), "Zadajte platný údaj"),
    title: z
      .string()
      .trim()
      .min(1, "Toto pole je povinné")
      .max(MAX_TITLE, "Hodnota je príliš dlhá"),
    description: z
      .string()
      .trim()
      .min(1, "Toto pole je povinné")
      .max(MAX_LONG, "Hodnota je príliš dlhá"),
    parts_replaced: z
      .string()
      .trim()
      .max(MAX_LONG, "Hodnota je príliš dlhá")
      .optional()
      .or(z.literal("")),
    price: optionalPositiveNumber,
    technician: z
      .string()
      .trim()
      .max(MAX_TITLE, "Hodnota je príliš dlhá")
      .optional()
      .or(z.literal("")),
    next_service_km: optionalPositiveInt,
    next_service_date: z
      .string()
      .optional()
      .or(z.literal(""))
      .refine((s) => !s || (isValidDateStr(s) && s <= MAX_NEXT_DATE), "Zadajte platný dátum"),
  })
  .superRefine((val, ctx) => {
    if (typeof val.next_service_km === "number" && val.next_service_km <= val.mileage_at_service) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["next_service_km"],
        message: "Musí byť vyššie ako aktuálny nájazd",
      });
    }
    if (val.next_service_date && val.next_service_date < val.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["next_service_date"],
        message: "Nesmie byť pred dátumom servisu",
      });
    }
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

function trimOrNull(v: string | null | undefined): string | null {
  if (v == null) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function roundPrice(v: number | null): number | null {
  if (v == null || !Number.isFinite(v)) return null;
  return Math.round(v * 100) / 100;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

  const initialExisting = useMemo<ExistingPhoto[]>(() => {
    if (!isEdit || !record) return [];
    return record.photos.map((filename, i) => ({
      filename,
      url: record.photo_urls[i] ?? "",
    }));
  }, [isEdit, record]);

  const [existing, setExisting] = useState<ExistingPhoto[]>(initialExisting);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

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
        title: raw.title.trim(),
        description: raw.description.trim(),
        parts_replaced: trimOrNull(raw.parts_replaced as string | null | undefined),
        price: roundPrice(emptyToNull(raw.price) as number | null),
        technician: trimOrNull(raw.technician as string | null | undefined),
        next_service_km: nextKm,
        next_service_date: nextDate,
      };

      const originalFilenames = isEdit && record ? record.photos : [];

      const keptFilenames = new Set(existing.map((e) => e.filename));
      const removed = originalFilenames.filter((f) => !keptFilenames.has(f));
      
      let photoFailedCount = 0;
      let newPhotosData: { name: string, base64: string }[] | undefined = undefined;

      if (pendingFiles.length > 0) {
        try {
          const compressedFiles = await compressImages(pendingFiles);
          newPhotosData = await Promise.all(compressedFiles.map(async f => ({
            name: f.name,
            base64: await fileToBase64(f)
          })));
        } catch (e) {
          console.warn("Photo compression failed", e);
          photoFailedCount = pendingFiles.length;
        }
      }

      if (isEdit && record) {
        await window.electronAPI.db.updateServiceRecord(record.id, payload, newPhotosData, removed);
      } else {
        await window.electronAPI.db.createServiceRecord({ vehicle: vehicleId, ...payload }, newPhotosData);
      }

      let mileageUpdated = false;
      if (newMileage > currentMileage) {
        try {
          await window.electronAPI.db.updateVehicle(vehicleId, { current_mileage: newMileage });
          mileageUpdated = true;
        } catch (e) {
          console.warn("Mileage update failed", e);
        }
      }

      // Auto-create scheduled task only on create flow
      if (!isEdit && (nextKm != null || nextDate != null)) {
        try {
          await window.electronAPI.db.createScheduledTask({
            vehicle: vehicleId,
            planned_date: nextDate ?? today(),
            planned_mileage: nextKm,
            task_type: raw.service_type,
            description: `Automaticky vytvorené zo servisného záznamu: ${raw.title}`,
            priority: "Stredná",
            status: "Čakajúce",
          });
        } catch (e) {
          console.warn("Scheduled task creation failed", e);
          toast.warning("Záznam uložený, ale plánovanú úlohu sa nepodarilo vytvoriť");
        }
      }

      return { mileageUpdated, photoFailedCount };
    },
    onSuccess: ({ mileageUpdated, photoFailedCount }) => {
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId, "service-records"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["service-history"] });
      if (mileageUpdated) {
        queryClient.invalidateQueries({ queryKey: ["vehicles", "with-customers"] });
      }
      toast.success(isEdit ? "Servisný záznam bol upravený" : "Servisný záznam bol uložený");
      if (photoFailedCount > 0) {
        toast.warning(`Niektoré fotky sa nepodarilo nahrať (${photoFailedCount})`);
      }
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
    "bg-brand-bg border-brand-border text-brand-fg placeholder:text-brand-fg-subtle focus-visible:ring-brand-accent";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off" className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Dátum" error={errors.date?.message} required>
          <Input type="date" className={inputCls} {...form.register("date")} />
        </Field>

        <Field label="Nájazd pri servise (km)" error={errors.mileage_at_service?.message} required>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_MILEAGE}
            step={1}
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
          maxLength={MAX_TITLE}
          {...form.register("title")}
        />
      </Field>

      <Field label="Popis" error={errors.description?.message} required>
        <Textarea
          rows={4}
          maxLength={MAX_LONG}
          className={inputCls}
          {...form.register("description")}
        />
      </Field>

      <Field label="Vymenené diely" error={errors.parts_replaced?.message}>
        <Textarea
          rows={3}
          maxLength={MAX_LONG}
          className={inputCls}
          {...form.register("parts_replaced")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cena (€)" error={errors.price?.message}>
          <Input
            type="number"
            step="0.01"
            min={0}
            max={MAX_PRICE}
            className={inputCls}
            {...form.register("price")}
          />
        </Field>

        <Field label="Technik" error={errors.technician?.message}>
          <Input className={inputCls} maxLength={MAX_TITLE} {...form.register("technician")} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Ďalší servis pri (km)" error={errors.next_service_km?.message}>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_MILEAGE}
            step={1}
            className={inputCls}
            {...form.register("next_service_km")}
          />
        </Field>

        <Field label="Ďalší servis dátum" error={errors.next_service_date?.message}>
          <Input
            type="date"
            max={MAX_NEXT_DATE}
            className={inputCls}
            {...form.register("next_service_date")}
          />
        </Field>
      </div>

      <ServiceRecordPhotoPicker
        existing={existing}
        pendingFiles={pendingFiles}
        onExistingChange={setExisting}
        onPendingChange={setPendingFiles}
        disabled={isSubmitting}
      />

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-brand-border bg-transparent text-brand-fg hover:bg-brand-surface"
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
      <Label className="text-brand-fg-muted">
        {label}
        {required && <span className="text-brand-error"> *</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-brand-error">{error}</p>}
    </div>
  );
}
