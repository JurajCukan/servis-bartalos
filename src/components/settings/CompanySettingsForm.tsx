import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { companySettingsQuery } from "@/features/documents/DocumentLayout";

const schema = z.object({
  company_name: z.string().trim().min(1, "Názov firmy je povinný").max(100),
  street: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().max(50).default("Slovensko"),
  ico: z.string().trim().max(20).optional().or(z.literal("")),
  dic: z.string().trim().max(20).optional().or(z.literal("")),
  ic_dph: z.string().trim().max(20).optional().or(z.literal("")),
  bank_name: z.string().trim().max(100).optional().or(z.literal("")),
  iban: z.string().trim().max(50).optional().or(z.literal("")),
  bic_swift: z.string().trim().max(20).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().email("Neplatný e-mail").optional().or(z.literal("")),
  website: z.string().url("Neplatná URL").optional().or(z.literal("")),
  invoice_prefix: z.string().trim().min(1, "Prefix je povinný").max(10).default("FA"),
  invoice_next_number: z.coerce.number().int().min(1),
  vat_payer: z.coerce.number().int().min(0).max(1),
  default_vat_rate: z.coerce.number().min(0).max(100),
});

type FormValues = z.input<typeof schema>;
type ParsedValues = z.output<typeof schema>;

export function CompanySettingsForm() {
  const queryClient = useQueryClient();
  const { data: settings } = useSuspenseQuery(companySettingsQuery());

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: settings ? {
      ...settings,
    } : {
      company_name: "",
      country: "Slovensko",
      invoice_prefix: "FA",
      invoice_next_number: 1,
      vat_payer: 0,
      default_vat_rate: 20,
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ParsedValues) => {
      if (!window.electronAPI) throw new Error("Electron API not available");
      await window.electronAPI.db.updateCompanySettings(values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companySettings"] });
      toast.success("Firemné údaje boli uložené");
    },
    onError: (err) => {
      console.error(err);
      toast.error("Nepodarilo sa uložiť firemné údaje");
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (values) => {
    mutation.mutate(values as ParsedValues);
  };

  const isSubmitting = mutation.isPending || form.formState.isSubmitting;
  const inputCls = "bg-brand-bg border-brand-border text-brand-fg placeholder:text-brand-fg-subtle focus-visible:ring-brand-accent";
  const errors = form.formState.errors;

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-5 sm:p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-brand-fg">Firemné údaje a fakturácia</h2>
        <p className="text-sm text-brand-fg-muted mt-1">Tieto údaje sa budú zobrazovať na hlavičke dokumentov (Servisná knižka, Protokol, Faktúra).</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Základné údaje */}
        <div className="space-y-4">
          <h3 className="font-medium text-brand-fg border-b pb-2">Základné údaje</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Názov firmy / Meno" error={errors.company_name?.message} required>
              <Input className={inputCls} {...form.register("company_name")} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ulica a číslo" error={errors.street?.message}>
              <Input className={inputCls} {...form.register("street")} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="PSČ" error={errors.postal_code?.message}>
                <Input className={inputCls} {...form.register("postal_code")} />
              </Field>
              <Field label="Mesto" error={errors.city?.message}>
                <Input className={inputCls} {...form.register("city")} />
              </Field>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="IČO" error={errors.ico?.message}>
              <Input className={inputCls} {...form.register("ico")} />
            </Field>
            <Field label="DIČ" error={errors.dic?.message}>
              <Input className={inputCls} {...form.register("dic")} />
            </Field>
            <Field label="IČ DPH" error={errors.ic_dph?.message}>
              <Input className={inputCls} {...form.register("ic_dph")} />
            </Field>
          </div>
        </div>

        {/* Kontakt */}
        <div className="space-y-4">
          <h3 className="font-medium text-brand-fg border-b pb-2">Kontakt</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefón" error={errors.phone?.message}>
              <Input className={inputCls} {...form.register("phone")} />
            </Field>
            <Field label="E-mail" error={errors.email?.message}>
              <Input type="email" className={inputCls} {...form.register("email")} />
            </Field>
          </div>
        </div>

        {/* Bankové spojenie */}
        <div className="space-y-4">
          <h3 className="font-medium text-brand-fg border-b pb-2">Bankové spojenie</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Názov banky" error={errors.bank_name?.message}>
              <Input className={inputCls} {...form.register("bank_name")} />
            </Field>
            <div className="col-span-2">
              <Field label="IBAN" error={errors.iban?.message}>
                <Input className={inputCls} {...form.register("iban")} />
              </Field>
            </div>
          </div>
        </div>

        {/* Fakturácia */}
        <div className="space-y-4">
          <h3 className="font-medium text-brand-fg border-b pb-2">Nastavenie fakturácie</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Platca DPH" error={errors.vat_payer?.message}>
              <Select
                value={String(form.watch("vat_payer"))}
                onValueChange={(v) => form.setValue("vat_payer", Number(v), { shouldValidate: true, shouldDirty: true })}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Vyberte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Áno, som platca DPH</SelectItem>
                  <SelectItem value="0">Nie, nie som platca DPH</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            {form.watch("vat_payer") === 1 && (
              <Field label="Predvolená sadzba DPH (%)" error={errors.default_vat_rate?.message}>
                <Input type="number" className={inputCls} {...form.register("default_vat_rate")} />
              </Field>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Predpona faktúry (napr. FA)" error={errors.invoice_prefix?.message} required>
              <Input className={inputCls} {...form.register("invoice_prefix")} />
            </Field>
            <Field label="Nasledujúce číslo faktúry" error={errors.invoice_next_number?.message} required>
              <Input type="number" min="1" className={inputCls} {...form.register("invoice_next_number")} />
            </Field>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-accent text-white hover:bg-brand-accent-hover min-w-[120px]"
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? "Ukladám..." : "Uložiť údaje"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
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
