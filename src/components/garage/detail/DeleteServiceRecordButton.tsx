import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import pb from "@/lib/pocketbase";
import type { ServiceRecord } from "@/lib/queries/vehicles";

export function DeleteServiceRecordButton({
  record,
  vehicleId,
  onDeleted,
}: {
  record: ServiceRecord;
  vehicleId: string;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      // PocketBase auto-deletes attached files when the record is deleted.
      await pb.collection("service_records").delete(record.id);
    },
    onSuccess: () => {
      toast.success("Servisný záznam bol odstránený");
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId, "service-records"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["service-history"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      setOpen(false);
      onDeleted();
    },
    onError: (e) => {
      console.warn("Service record delete failed", e);
      toast.error("Servisný záznam sa nepodarilo odstrániť");
    },
  });

  return (
    <>
      <div className="space-y-2 pt-2">
        <div className="h-px bg-brand-border" />
        <p className="text-xs uppercase tracking-wide text-brand-fg-muted">Nebezpečná zóna</p>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setOpen(true)}
          disabled={mutation.isPending}
          className="w-full sm:w-auto"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Odstrániť záznam
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="border-brand-border bg-brand-surface text-brand-fg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brand-fg">Odstrániť servisný záznam?</AlertDialogTitle>
            <AlertDialogDescription className="text-brand-fg-muted">
              Táto akcia sa nedá vrátiť späť.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={mutation.isPending}
              className="border-brand-border bg-transparent text-brand-fg hover:bg-brand-bg"
            >
              Zrušiť
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={mutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {mutation.isPending ? "Odstraňujem…" : "Odstrániť"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
