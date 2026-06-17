const NF_KM = new Intl.NumberFormat("sk-SK");
const NF_EUR = new Intl.NumberFormat("sk-SK", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const DASH = "—";

export function formatKm(km: number | null | undefined): string {
  if (km == null || !Number.isFinite(km)) return DASH;
  return `${NF_KM.format(km)} km`;
}

export function formatPrice(p: number | null | undefined): string | null {
  if (p == null || !Number.isFinite(p)) return null;
  return NF_EUR.format(p);
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return DASH;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return DASH;
  return date.toLocaleDateString("sk-SK", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateLong(d: string | null | undefined): string {
  if (!d) return DASH;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return DASH;
  return date.toLocaleDateString("sk-SK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
