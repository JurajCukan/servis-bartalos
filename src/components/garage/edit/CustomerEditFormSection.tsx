import type { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "./FormField";
import { inputCls, type EditFormInput } from "./editSchema";

export function CustomerEditFormSection({ form }: { form: UseFormReturn<EditFormInput> }) {
  const errors = form.formState.errors;
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-fg-muted">
        Zákazník
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Meno" error={errors.first_name?.message} required>
          <Input className={inputCls} {...form.register("first_name")} />
        </FormField>
        <FormField label="Priezvisko" error={errors.last_name?.message} required>
          <Input className={inputCls} {...form.register("last_name")} />
        </FormField>
        <FormField label="Telefón" error={errors.phone?.message} required>
          <Input className={inputCls} {...form.register("phone")} />
        </FormField>
        <FormField label="E-mail" error={errors.email?.message}>
          <Input type="email" className={inputCls} {...form.register("email")} />
        </FormField>
      </div>
      <FormField label="Poznámky" error={errors.customer_notes?.message}>
        <Textarea rows={2} className={inputCls} {...form.register("customer_notes")} />
      </FormField>
    </section>
  );
}
