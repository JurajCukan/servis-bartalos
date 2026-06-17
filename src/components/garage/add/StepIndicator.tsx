export function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 text-xs text-brand-fg-muted">
      <span
        className={
          step === 1
            ? "rounded-full bg-brand-accent px-2 py-0.5 font-semibold text-brand-fg"
            : "rounded-full bg-brand-surface px-2 py-0.5 text-brand-fg-muted"
        }
      >
        1. Zákazník
      </span>
      <span aria-hidden>→</span>
      <span
        className={
          step === 2
            ? "rounded-full bg-brand-accent px-2 py-0.5 font-semibold text-brand-fg"
            : "rounded-full bg-brand-surface px-2 py-0.5 text-brand-fg-muted"
        }
      >
        2. Vozidlo
      </span>
    </div>
  );
}
