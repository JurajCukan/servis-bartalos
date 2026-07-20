import { useState } from "react";
import { Download, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportData, importData } from "@/lib/exportImport";

type OperationState =
  | { type: "idle" }
  | { type: "running"; message: string; percent: number }
  | { type: "done"; message: string }
  | { type: "error"; message: string };

export function ExportImportCard() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<OperationState>({ type: "idle" });
  const [showImportConfirm, setShowImportConfirm] = useState(false);

  const isElectron = typeof window !== "undefined" && !!window.electronAPI;

  const handleExport = async () => {
    setState({ type: "running", message: "Pripravujem export…", percent: 0 });
    try {
      await exportData((message, percent) => {
        setState({ type: "running", message, percent });
      });
      setState({ type: "done", message: "Export bol úspešne dokončený." });
      toast.success("Údaje boli exportované");
    } catch (e) {
      console.error("Export failed:", e);
      const msg = e instanceof Error ? e.message : "Export sa nepodaril";
      setState({ type: "error", message: msg });
      toast.error(msg);
    }
  };

  const handleImport = async () => {
    setShowImportConfirm(false);
    setState({ type: "running", message: "Pripravujem import…", percent: 0 });
    try {
      const result = await importData((message, percent) => {
        setState({ type: "running", message, percent });
      });
      if (result.imported === 0) {
        setState({ type: "idle" });
        return;
      }
      setState({
        type: "done",
        message: `Import dokončený — importovaných ${result.imported} záznamov.`,
      });
      toast.success(`Importovaných ${result.imported} záznamov`);
      // Refresh all queries to show imported data
      queryClient.invalidateQueries();
    } catch (e) {
      console.error("Import failed:", e);
      const msg = e instanceof Error ? e.message : "Import sa nepodaril";
      setState({ type: "error", message: msg });
      toast.error(msg);
    }
  };

  const isRunning = state.type === "running";

  return (
    <>
      <Card className="border-brand-border bg-brand-surface text-brand-fg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-fg">
            <Download className="h-5 w-5 text-brand-accent" />
            Export a import údajov
          </CardTitle>
          <CardDescription className="text-brand-fg-muted">
            Preneste údaje medzi zariadeniami. Export vytvorí súbor s CSV údajmi a všetkými
            fotografiami.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress indicator */}
          {state.type === "running" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-brand-fg-muted">
                <Loader2 className="h-4 w-4 animate-spin text-brand-accent" />
                <span>{state.message}</span>
              </div>
              <Progress value={state.percent} className="h-2" />
            </div>
          )}

          {state.type === "done" && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}

          {state.type === "error" && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{state.message}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isRunning || !isElectron}
              className="flex-1 gap-2 border-brand-border bg-transparent text-brand-fg hover:bg-brand-surface"
            >
              <Download className="h-4 w-4" />
              Exportovať údaje
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowImportConfirm(true)}
              disabled={isRunning || !isElectron}
              className="flex-1 gap-2 border-brand-border bg-transparent text-brand-fg hover:bg-brand-surface"
            >
              <Upload className="h-4 w-4" />
              Importovať údaje
            </Button>
          </div>

          {!isElectron && (
            <p className="text-xs text-brand-fg-muted">
              Export a import sú dostupné iba v desktopovej aplikácii.
            </p>
          )}

          <p className="text-xs text-brand-fg-muted">
            Export vytvorí JSON súbor (pre import) a CSV súbory (pre čítanie) s údajmi zákazníkov,
            vozidiel, servisných záznamov, plánovaných úloh a všetkých fotografií.
          </p>
        </CardContent>
      </Card>

      {/* Import confirmation dialog */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent className="border-brand-border bg-brand-surface text-brand-fg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brand-fg">Importovať údaje?</AlertDialogTitle>
            <AlertDialogDescription className="text-brand-fg-muted">
              Import pridá nové záznamy do existujúcej databázy. Existujúce záznamy sa nezmažú ani
              neprepisujú. Ak importujete rovnaký súbor viackrát, záznamy sa môžu zduplikovať.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-brand-border bg-transparent text-brand-fg hover:bg-brand-surface">
              Zrušiť
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImport}
              className="bg-brand-accent text-white hover:bg-brand-accent-hover"
            >
              Importovať
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
