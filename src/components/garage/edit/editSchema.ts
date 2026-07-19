import { z } from "zod";

const MAX_YEAR = new Date().getFullYear() + 1;
const optionalStr = z.string().trim().max(200).optional().or(z.literal(""));

export const editSchema = z.object({
  // customer
  first_name: z.string().trim().min(1, "Toto pole je povinné").max(60),
  last_name: z.string().trim().min(1, "Toto pole je povinné").max(60),
  phone: z.string().trim().min(1, "Toto pole je povinné").max(40),
  email: z.string().trim().max(120).email("Zadajte platný e-mail").optional().or(z.literal("")),
  customer_notes: z.string().trim().max(2000).optional().or(z.literal("")),

  // vehicle
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
  vehicle_notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type EditFormInput = z.input<typeof editSchema>;
export type EditFormValues = z.output<typeof editSchema>;

export const FUEL_TYPES = ["Benzín", "Diesel", "Hybrid", "Elektro", "LPG", "CNG"] as const;

export const inputCls =
  "bg-brand-bg border-brand-border text-brand-fg placeholder:text-brand-fg-subtle focus-visible:ring-brand-accent";

export function emptyToNull(s: string | undefined | null): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}
