import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AppInfoCard() {
  const [appVersion, setAppVersion] = useState<string>("Načítavam...");

  useEffect(() => {
    if (typeof window !== "undefined" && window.electronAPI) {
      window.electronAPI.getAppVersion().then((v) => {
        setAppVersion(`v${v}`);
      });
    } else {
      setAppVersion("Web verzia");
    }
  }, []);

  return (
    <Card className="border-brand-border bg-brand-surface text-brand-fg">
      <CardHeader>
        <CardTitle className="text-brand-fg">Aplikácia</CardTitle>
        <CardDescription className="text-brand-fg-muted">
          Základné informácie o tejto inštalácii.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="divide-y divide-brand-border">
          <div className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
            <dt className="text-sm text-brand-fg-muted">Verzia aplikácie</dt>
            <dd className="text-sm font-medium text-brand-fg">{appVersion}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
