export function formatCurrency(amount: number, currency: string = "EUR") {
  return new Intl.NumberFormat("sk-SK", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("sk-SK");
}

export function formatIco(ico: string | null | undefined) {
  if (!ico) return "";
  const cleaned = ico.replace(/\s+/g, "");
  if (cleaned.length === 8) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 8)}`;
  }
  return ico;
}

export function formatIban(iban: string | null | undefined) {
  if (!iban) return "";
  const cleaned = iban.replace(/\s+/g, "");
  return cleaned.match(/.{1,4}/g)?.join(" ") || iban;
}
