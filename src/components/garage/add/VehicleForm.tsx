import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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

const FUEL_TYPES = ["Benzín", "Diesel", "Hybrid", "Elektro", "LPG", "CNG"] as const;

const MAX_YEAR = new Date().getFullYear() + 1;

const optionalStr = z.string().trim().max(120).optional().or(z.literal(""));

const schema = z.object({
  brand: z.string().trim().min(1, "Toto pole je povinné").max(60),
  model: z.string().trim().min(1, "Toto pole je povinné").max(60),
  year: z
    .union([
      z.literal(""),
      z.coerce
        .number()
        .int("Zadajte platný rok")
        .min(1900, "Zadajte platný rok")
        .max(MAX_YEAR, "Zadajte platný rok"),
    ])
    .optional(),
  license_plate: z.string().trim().min(1, "Toto pole je povinné").max(20),
  vin: z.string().trim().max(32).optional().or(z.literal("")),
  current_mileage: z.coerce
    .number({ invalid_type_error: "Zadajte platný nájazd" })
    .int("Zadajte platný nájazd")
    .nonnegative("Zadajte platný nájazd"),
  engine: optionalStr,
  transmission: optionalStr,
  drive: optionalStr,
  power: optionalStr,
  oil_volume: optionalStr,
  tire_size: optionalStr,
  fuel_type: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type VehicleFormInput = z.input<typeof schema>;
export type VehicleFormValues = z.output<typeof schema>;

const inputCls =
  "bg-brand-bg border-brand-border text-brand-fg placeholder:text-brand-fg-subtle focus-visible:ring-brand-accent";

export function VehicleForm({
  onBack,
  onSubmit,
  isSubmitting,
}: {
  onBack: () => void;
  onSubmit: (values: VehicleFormValues) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<VehicleFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      brand: "",
      model: "",
      year: "",
      license_plate: "",
      vin: "",
      current_mileage: "" as unknown as number,
      engine: "",
      transmission: "",
      drive: "",
      power: "",
      oil_volume: "",
      tire_size: "",
      fuel_type: "",
      notes: "",
    },
  });

  const handler: SubmitHandler<VehicleFormInput> = (values) => {
    onSubmit(values as unknown as VehicleFormValues);
  };

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(handler)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Značka" error={errors.brand?.message} required>
          <Input className={inputCls} {...form.register("brand")} />
        </Field>
        <Field label="Model" error={errors.model?.message} required>
          <Input className={inputCls} {...form.register("model")} />
        </Field>
        <Field label="ŠPZ" error={errors.license_plate?.message} required>
          <Input
            className={`${inputCls} uppercase`}
            {...form.register("license_plate")}
          />
        </Field>
        <Field label="Rok výroby" error={errors.year?.message}>
          <Input
            type="number"
            inputMode="numeric"
            min={1900}
            max={MAX_YEAR}
            className={inputCls}
            {...form.register("year")}
          />
        </Field>
        <Field label="VIN" error={errors.vin?.message}>
          <Input className={inputCls} {...form.register("vin")} />
        </Field>
        <Field
          label="Aktuálny nájazd (km)"
          error={errors.current_mileage?.message}
          required
        >
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            className={inputCls}
            {...form.register("current_mileage")}
          />
        </Field>
        <Field label="Motor" error={errors.engine?.message}>
          <Input className={inputCls} {...form.register("engine")} />
        </Field>
        <Field label="Prevodovka" error={errors.transmission?.message}>
          <Input className={inputCls} {...form.register("transmission")} />
        </Field>
        <Field label="Pohon" error={errors.drive?.message}>
          <Input className={inputCls} {...form.register("drive")} />
        </Field>
        <Field label="Výkon" error={errors.power?.message}>
          <Input className={inputCls} {...form.register("power")} />
        </Field>
        <Field label="Objem oleja" error={errors.oil_volume?.message}>
          <Input className={inputCls} {...form.register("oil_volume")} />
        </Field>
        <Field label="Rozmer pneu" error={errors.tire_size?.message}>
          <Input className={inputCls} {...form.register("tire_size")} />
        </Field>
        <Field label="Typ paliva" error={errors.fuel_type?.message}>
          <Select
            value={form.watch("fuel_type") || ""}
            onValueChange={(v) =>
              form.setValue("fuel_type", v, { shouldDirty: true })
            }
          >
            <SelectTrigger className={inputCls}>
              <SelectValue placeholder="Vyberte typ paliva" />
            </SelectTrigger>
            <SelectContent>
              {FUEL_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field label="Poznámky" error={errors.notes?.message}>
        <Textarea rows={3} className={inputCls} {...form.register("notes")} />
      </Field>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="border-brand-border bg-transparent text-brand-fg hover:bg-brand-surface"
        >
          Späť
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-brand-accent text-white hover:bg-brand-accent-hover"
        >
          {isSubmitting ? "Ukladám…" : "Uložiť vozidlo"}
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
      <Label className="text-sm text-brand-fg">
        {label}
        {required && <span className="ml-1 text-brand-accent">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
