import { Mail, Phone, StickyNote } from "lucide-react";
import type { CustomerFull } from "@/lib/queries/vehicles";

export function CustomerInfoCard({ customer }: { customer: CustomerFull | null }) {
  if (!customer) {
    return (
      <section className="rounded-xl border border-brand-border bg-brand-surface p-5">
        <h2 className="text-lg font-semibold text-brand-fg">Zákazník</h2>
        <p className="mt-2 text-sm text-brand-fg-muted">Bez priradeného zákazníka.</p>
      </section>
    );
  }

  const fullName = `${customer.first_name} ${customer.last_name}`.trim();

  return (
    <section className="rounded-xl border border-brand-border bg-brand-surface p-5">
      <h2 className="text-lg font-semibold text-brand-fg">Zákazník</h2>
      <div className="mt-3 space-y-3">
        <p className="break-words text-base font-medium text-brand-fg">{fullName}</p>
        <a
          href={`tel:${customer.phone.replace(/\s+/g, "")}`}
          className="flex items-center gap-2 text-base font-medium text-brand-accent hover:underline"
        >
          <Phone className="h-4 w-4" aria-hidden />
          {customer.phone}
        </a>
        {customer.email && (
          <a
            href={`mailto:${customer.email}`}
            className="flex items-center gap-2 break-all text-sm text-brand-fg hover:underline"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
            {customer.email}
          </a>
        )}
        {customer.notes && (
          <div className="flex items-start gap-2 rounded-md border border-brand-border bg-brand-bg p-3 text-sm text-brand-fg">
            <StickyNote className="mt-0.5 h-4 w-4 shrink-0 text-brand-fg-muted" aria-hidden />
            <p className="whitespace-pre-wrap">{customer.notes}</p>
          </div>
        )}
      </div>
    </section>
  );
}
