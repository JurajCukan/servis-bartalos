import { useEffect, useState } from "react";
import { RefreshCw, Download, CheckCircle2, AlertCircle, Sparkles, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type UpdateState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "available"; version: string }
  | { status: "downloading"; percent: number; version?: string }
  | { status: "ready"; version: string }
  | { status: "up-to-date" }
  | { status: "error"; message: string };

export function UpdateSettingCard() {
  const [appVersion, setAppVersion] = useState<string>("v1.1.8");
  const [state, setState] = useState<UpdateState>({ status: "idle" });

  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  useEffect(() => {
    if (!isElectron) return;

    window.electronAPI.getAppVersion().then((v) => {
      setAppVersion(`v${v}`);
    });

    const unsubChecking = window.electronAPI.onUpdateChecking(() => {
      setState({ status: "checking" });
    });

    const unsubAvailable = window.electronAPI.onUpdateAvailable((info) => {
      setState({ status: "available", version: info.version });
      toast.info(`Je dostupná nová verzia v${info.version}! Kliknite na "Stiahnuť aktualizáciu".`);
    });

    const unsubNotAvailable = window.electronAPI.onUpdateNotAvailable(() => {
      setState({ status: "up-to-date" });
      toast.success("Používate najnovšiu verziu aplikácie.");
    });

    const unsubProgress = window.electronAPI.onDownloadProgress((progress) => {
      setState({ status: "downloading", percent: progress.percent });
    });

    const unsubDownloaded = window.electronAPI.onUpdateDownloaded((info) => {
      setState({ status: "ready", version: info.version });
      toast.success(`Aktualizácia v${info.version} je pripravená na inštaláciu!`);
    });

    const unsubError = window.electronAPI.onUpdateError((err) => {
      setState({ status: "error", message: err.message });
    });

    return () => {
      unsubChecking();
      unsubAvailable();
      unsubNotAvailable();
      unsubProgress();
      unsubDownloaded();
      unsubError();
    };
  }, [isElectron]);

  const handleCheckForUpdates = () => {
    if (!isElectron) return;
    setState({ status: "checking" });
    window.electronAPI.checkForUpdates();
  };

  const handleDownloadUpdate = () => {
    if (!isElectron) return;
    window.electronAPI.downloadUpdate();
  };

  const handleInstallUpdate = () => {
    if (!isElectron) return;
    window.electronAPI.installUpdate();
  };

  const isPrivateRepoError = state.status === "error" && state.message.includes("404");

  return (
    <Card className="border-brand-border bg-brand-surface text-brand-fg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-fg">
          <RefreshCw className="h-5 w-5 text-brand-accent" />
          Aktualizácie aplikácie
        </CardTitle>
        <CardDescription className="text-brand-fg-muted">
          Skontrolujte dostupnosť nových verzií z GitHub Releases a aktualizujte aplikáciu jedným klikom.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-brand-border bg-brand-bg p-3 text-sm">
          <div>
            <span className="text-brand-fg-muted">Aktuálne nainštalovaná verzia: </span>
            <span className="font-semibold text-brand-fg">{appVersion}</span>
          </div>
          <div className="flex items-center gap-2">
            {state.status === "up-to-date" && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                <CheckCircle2 className="h-4 w-4" /> Najnovšia verzia
              </span>
            )}
          </div>
        </div>

        {/* Status displays */}
        {state.status === "checking" && (
          <div className="flex items-center gap-2 text-sm text-brand-fg-muted">
            <RefreshCw className="h-4 w-4 animate-spin text-brand-accent" />
            <span>Kontrolujem dostupnosť novej verzie na GitHub Releases…</span>
          </div>
        )}

        {state.status === "downloading" && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-brand-fg-muted">
              <span>Sťahujem novú verziu z GitHubu…</span>
              <span>{state.percent}%</span>
            </div>
            <Progress value={state.percent} className="h-2" />
          </div>
        )}

        {state.status === "available" && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-400">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Nová verzia {state.version} je pripravená na stiahnutie!</span>
            </div>
            <Button
              onClick={handleDownloadUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2 font-semibold"
            >
              <Download className="h-4 w-4" />
              Stiahnuť aktualizáciu
            </Button>
          </div>
        )}

        {state.status === "ready" && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>Nová verzia {state.version} je stiahnutá a pripravená!</span>
            </div>
            <Button
              onClick={handleInstallUpdate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold"
            >
              <Download className="h-4 w-4" />
              Nainštalovať a reštartovať
            </Button>
          </div>
        )}

        {state.status === "error" && (
          <div className="flex flex-col gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Nepodarilo sa skontrolovať aktualizácie</p>
                {isPrivateRepoError ? (
                  <p className="mt-1 text-xs text-red-300">
                    GitHub repozitár je nastavený ako <strong>Súkromný (Private)</strong>. Aby automatické aktualizácie fungovali, nastavte na GitHube <em>Settings &rarr; Change visibility &rarr; Public</em>.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-red-300">{state.message}</p>
                )}
              </div>
            </div>
            <div className="pt-1">
              <a
                href="https://github.com/JurajCukan/servis-bartalos/releases"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs underline hover:text-red-300"
              >
                Otvoriť GitHub Releases stránku <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Main Action Buttons */}
        {state.status !== "ready" && state.status !== "available" && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleCheckForUpdates}
              disabled={state.status === "checking" || state.status === "downloading" || !isElectron}
              className="gap-2 border-brand-border bg-transparent text-brand-fg hover:bg-brand-surface"
            >
              <RefreshCw className={`h-4 w-4 ${state.status === "checking" ? "animate-spin" : ""}`} />
              Skontrolovať aktualizácie na GitHub
            </Button>
          </div>
        )}

        {!isElectron && (
          <p className="text-xs text-brand-fg-muted">
            Automatické aktualizácie sú dostupné v desktopovej Windows aplikácii.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
