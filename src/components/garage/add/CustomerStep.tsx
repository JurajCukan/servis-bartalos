import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CustomerPicker, type PickedCustomer } from "./CustomerPicker";

export type NewCustomer = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  notes: string | null;
};

export type CustomerResolution =
  | { kind: "existing"; customer: PickedCustomer }
  | { kind: "new"; customer: NewCustomer };

const newCustomerSchema = z.object({
  first_name: z.string().trim().min(1, "Toto pole je povinné").max(120),
  last_name: z.string().trim().min(1, "Toto pole je povinné").max(120),
  phone: z.string().trim().min(1, "Toto pole je povinné").max(40),
  email: z.string().trim().max(255).email("Zadajte platný email").optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

type Mode = "existing" | "new";

const inputCls =
  "bg-brand-bg border-brand-border text-brand-fg placeholder:text-brand-fg-subtle focus-visible:ring-brand-accent";

export function CustomerStep({
  initial,
  onCancel,
  onContinue,
}: {
  initial: CustomerResolution | null;
  onCancel: () => void;
  onContinue: (r: CustomerResolution) => void;
}) {
  const [mode, setMode] = useState<Mode>(initial?.kind === "new" ? "new" : "existing");
  const [picked, setPicked] = useState<PickedCustomer | null>(
    initial?.kind === "existing" ? initial.customer : null,
  );
  const [form, setForm] = useState({
    first_name: initial?.kind === "new" ? initial.customer.first_name : "",
    last_name: initial?.kind === "new" ? initial.customer.last_name : "",
    phone: initial?.kind === "new" ? initial.customer.phone : "",
    email: initial?.kind === "new" ? (initial.customer.email ?? "") : "",
    notes: initial?.kind === "new" ? (initial.customer.notes ?? "") : "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickerError, setPickerError] = useState<string | null>(null);

  const handleContinue = () => {
    if (mode === "existing") {
      if (!picked) {
        setPickerError("Vyberte zákazníka zo zoznamu");
        return;
      }
      onContinue({ kind: "existing", customer: picked });
      return;
    }
    const parsed = newCustomerSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString();
        if (key && !next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    const v = parsed.data;
    onContinue({
      kind: "new",
      customer: {
        first_name: v.first_name,
        last_name: v.last_name,
        phone: v.phone,
        email: v.email ? v.email : null,
        notes: v.notes ? v.notes : null,
      },
    });
  };

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-md border border-brand-border bg-brand-bg p-1">
        <ToggleBtn active={mode === "existing"} onClick={() => setMode("existing")}>
          Existujúci zákazník
        </ToggleBtn>
        <ToggleBtn active={mode === "new"} onClick={() => setMode("new")}>
          Nový zákazník
        </ToggleBtn>
      </div>

      {mode === "existing" ? (
        <div className="space-y-2">
          <CustomerPicker
            value={picked}
            onChange={(c) => {
              setPicked(c);
              setPickerError(null);
            }}
          />
          {pickerError && <p className="text-xs text-red-400">{pickerError}</p>}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meno" error={errors.first_name} required>
            <Input
              className={inputCls}
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            />
          </Field>
          <Field label="Priezvisko" error={errors.last_name} required>
            <Input
              className={inputCls}
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            />
          </Field>
          <Field label="Telefón" error={errors.phone} required>
            <Input
              className={inputCls}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </Field>
          <Field label="E-mail" error={errors.email}>
            <Input
              type="email"
              className={inputCls}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Poznámky" error={errors.notes}>
              <Textarea
                rows={3}
                className={inputCls}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
          </div>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-brand-border bg-transparent text-brand-fg hover:bg-brand-surface"
        >
          Zrušiť
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          className="bg-brand-accent text-white hover:bg-brand-accent-hover"
        >
          Pokračovať
        </Button>
      </div>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-3 py-1.5 text-xs font-medium transition ${
        active ? "bg-brand-accent text-white" : "text-brand-fg-muted hover:text-brand-fg"
      }`}
    >
      {children}
    </button>
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
