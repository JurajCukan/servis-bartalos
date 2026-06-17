import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField } from "./FormField";
import { inputCls, FUEL_TYPES, type EditFormInput } from "./editSchema";

const MAX_YEAR = new Date().getFullYear() + 1;

export function VehicleEditFormSection({
  form,
}: {
  form: UseFormReturn<EditFormInput>;
}) {
  const errors = form.formState.errors;
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-fg-muted">
        Vozidlo
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Značka" error={errors.brand?.message} required>
          <Input className={inputCls} {...form.register("brand")} />
        </FormField>
        <FormField label="Model" error={errors.model?.message} required>
          <Input className={inputCls} {...form.register("model")} />
        </FormField>
        <FormField label="ŠPZ" error={errors.license_plate?.message} required>
          <Input
            className={`${inputCls} uppercase`}
            {...form.register("license_plate")}
          />
        </FormField>
        <FormField label="Rok výroby" error={errors.year?.message}>
          <Input
            type="number"
            inputMode="numeric"
            min={1900}
            max={MAX_YEAR}
            className={inputCls}
            {...form.register("year")}
          />
        </FormField>
        <FormField label="VIN" error={errors.vin?.message}>
          <Input className={inputCls} {...form.register("vin")} />
        </FormField>
        <FormField
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
        </FormField>
        <FormField label="Motor" error={errors.engine?.message}>
          <Input className={inputCls} {...form.register("engine")} />
        </FormField>
        <FormField label="Prevodovka" error={errors.transmission?.message}>
          <Input className={inputCls} {...form.register("transmission")} />
        </FormField>
        <FormField label="Pohon" error={errors.drive?.message}>
          <Input className={inputCls} {...form.register("drive")} />
        </FormField>
        <FormField label="Výkon" error={errors.power?.message}>
          <Input className={inputCls} {...form.register("power")} />
        </FormField>
        <FormField label="Objem oleja" error={errors.oil_volume?.message}>
          <Input className={inputCls} {...form.register("oil_volume")} />
        </FormField>
        <FormField label="Rozmer pneu" error={errors.tire_size?.message}>
          <Input className={inputCls} {...form.register("tire_size")} />
        </FormField>
        <FormField label="Typ paliva" error={errors.fuel_type?.message}>
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
        </FormField>
      </div>
      <FormField label="Poznámky" error={errors.vehicle_notes?.message}>
        <Textarea rows={3} className={inputCls} {...form.register("vehicle_notes")} />
      </FormField>
    </section>
  );
}
