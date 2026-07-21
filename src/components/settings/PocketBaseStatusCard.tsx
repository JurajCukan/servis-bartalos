import { useState } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import pb from "@/lib/pocketbase";

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "ok"; latencyMs: number }
  | { kind: "error"; message: string };

const PB_URL =
  (import.meta.env.VITE_POCKETBASE_URL as string | undefined) || "http://localhost:8090";

export function PocketBaseStatusCard() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const test = async () => {
    setStatus({ kind: "checking" });
    const t0 = performance.now();
    try {
      await pb.health.check();
      setStatus({ kind: "ok", latencyMs: Math.round(performance.now() - t0) });
    } catch (e) {
      setStatus({ kind: "error", message: (e as Error).message ?? "Chyba pripojenia" });
    }
  };

  return (
    <Card className="border-brand-border bg-brand-surface text-brand-fg">
      <CardHeader>
        <CardTitle className="text-brand-fg">Pripojenie k databáze</CardTitle>
        <CardDescription className="text-brand-fg-muted">
          PocketBase server, ku ktorému je aplikácia pripojená.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-brand-fg-muted">URL servera</div>
          <code className="mt-1 block break-all rounded-md border border-brand-border bg-brand-bg px-3 py-2 font-mono text-sm text-brand-fg">
            {PB_URL}
          </code>
          <p className="mt-1 text-xs text-brand-fg-muted">
            URL sa nastavuje v súbore <code className="font-mono">.env</code> (premenná{" "}
            <code className="font-mono">VITE_POCKETBASE_URL</code>).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={test}
            disabled={status.kind === "checking"}
            className="bg-brand-accent text-white hover:bg-brand-accent-hover"
          >
            {status.kind === "checking" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testujem…
              </>
            ) : (
              "Testovať pripojenie"
            )}
          </Button>

          {status.kind === "ok" && (
            <span className="inline-flex items-center gap-1.5 text-sm text-brand-success">
              <CheckCircle2 className="h-4 w-4" />
              Pripojené ({status.latencyMs} ms)
            </span>
          )}
          {status.kind === "error" && (
            <span className="inline-flex items-center gap-1.5 text-sm text-brand-error">
              <XCircle className="h-4 w-4" />
              Nedostupné — {status.message}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
