import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
import { supabase } from "@/integrations/supabase/client";
import { deletePhotos } from "@/lib/photos";
import { deleteVehiclePhoto } from "@/lib/vehiclePhoto";
import type { VehicleDetail } from "@/lib/queries/vehicles";

export function DeleteVehicleButton({
  vehicle,
  onDeleted,
}: {
  vehicle: VehicleDetail;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async () => {
      // 1. collect service record photo paths
      const { data: records, error: rErr } = await supabase
        .from("service_records")
        .select("photo_paths")
        .eq("vehicle_id", vehicle.id);
      if (rErr) throw rErr;

      const allPhotoPaths = (records ?? [])
        .flatMap((r) => (r as { photo_paths?: string[] | null }).photo_paths ?? [])
        .filter(Boolean);

      // 2. best-effort storage cleanup
      try {
        if (allPhotoPaths.length) await deletePhotos(allPhotoPaths);
      } catch (e) {
        console.warn("Service photos cleanup failed", e);
      }
      try {
        if (vehicle.photo_path) await deleteVehiclePhoto(vehicle.photo_path);
      } catch (e) {
        console.warn("Vehicle photo cleanup failed", e);
      }

      // 3. delete child rows
      const { error: stErr } = await supabase
        .from("scheduled_tasks")
        .delete()
        .eq("vehicle_id", vehicle.id);
      if (stErr) throw stErr;

      const { error: srErr } = await supabase
        .from("service_records")
        .delete()
        .eq("vehicle_id", vehicle.id);
      if (srErr) throw srErr;

      // 4. delete vehicle (customer is intentionally kept)
      const { error: vErr } = await supabase
        .from("vehicles")
        .delete()
        .eq("id", vehicle.id);
      if (vErr) throw vErr;
    },
    onSuccess: () => {
      toast.success("Vozidlo bolo odstránené");
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["service-history"] });
      queryClient.invalidateQueries({ queryKey: ["scheduled-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setOpen(false);
      onDeleted();
      navigate({ to: "/garage" });
    },
    onError: (e) => {
      console.warn("Vehicle delete failed", e);
      toast.error("Vozidlo sa nepodarilo odstrániť");
    },
  });

  return (
    <>
      <div className="space-y-2 pt-2">
        <div className="h-px bg-brand-border" />
        <p className="text-xs uppercase tracking-wide text-brand-muted">Nebezpečná zóna</p>
        <Button
          type="button"
          variant="destructive"
          onClick={() => setOpen(true)}
          disabled={mutation.isPending}
          className="w-full sm:w-auto"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Odstrániť vozidlo
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent className="border-brand-border bg-brand-surface text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Odstrániť vozidlo?</AlertDialogTitle>
            <AlertDialogDescription className="text-brand-muted">
              Odstránia sa nasledujúce údaje:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <ul className="ml-5 list-disc space-y-1 text-sm text-brand-muted">
            <li>údaje o vozidle</li>
            <li>servisná história tohto vozidla</li>
            <li>naplánované úkony pre toto vozidlo</li>
            <li>pripojené fotky vozidla a servisných záznamov</li>
          </ul>
          <p className="text-sm text-brand-muted">
            Zákazník zostane zachovaný (môže mať ďalšie vozidlá).
          </p>
          <p className="text-sm font-medium text-white">Táto akcia sa nedá vrátiť späť.</p>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={mutation.isPending}
              className="border-brand-border bg-transparent text-white hover:bg-brand-bg"
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
              {mutation.isPending ? "Odstraňujem…" : "Odstrániť vozidlo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
