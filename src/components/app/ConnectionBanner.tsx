import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import pb from "@/lib/pocketbase";

export function ConnectionBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const check = async () => {
      try {
        await pb.health.check();
        if (!cancelled) setOnline(true);
      } catch {
        if (!cancelled) setOnline(false);
      } finally {
        if (!cancelled) timer = setTimeout(check, 15000);
      }
    };

    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (online) return null;

  return (
    <div className="flex items-center gap-2 border-b border-brand-border bg-brand-error/10 px-4 py-2 text-sm text-brand-error">
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
      <span>⚠️ Nie je možné pripojiť k databáze. Skontrolujte sieť.</span>
    </div>
  );
}
