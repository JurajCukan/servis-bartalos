import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import pb from "@/lib/pocketbase";
import { compressImage } from "@/lib/imageCompression";
import type { VehicleDetail } from "@/lib/queries/vehicles";

import { CustomerEditFormSection } from "./CustomerEditFormSection";
import { DeleteVehicleButton } from "./DeleteVehicleButton";
import { VehicleEditFormSection } from "./VehicleEditFormSection";
import { VehiclePhotoField, type PhotoAction } from "./VehiclePhotoField";
import {
  editSchema,
  emptyToNull,
  type EditFormInput,
  type EditFormValues,
} from "./editSchema";

function buildDefaults(vehicle: VehicleDetail): EditFormInput {
  const c = vehicle.customer;
  return {
    first_name: c?.first_name ?? "",
    last_name: c?.last_name ?? "",
    phone: c?.phone ?? "",
    email: c?.email ?? "",
    customer_notes: c?.notes ?? "",
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year ?? "",
    license_plate: vehicle.license_plate,
    vin: vehicle.vin ?? "",
    current_mileage: vehicle.current_mileage as unknown as EditFormInput["current_mileage"],
    engine: vehicle.engine ?? "",
    transmission: vehicle.transmission ?? "",
    drive: vehicle.drive ?? "",
    power: vehicle.power ?? "",
    oil_volume: vehicle.oil_volume ?? "",
    tire_size: vehicle.tire_size ?? "",
    fuel_type: vehicle.fuel_type ?? "",
    vehicle_notes: vehicle.notes ?? "",
  };
}

export function EditVehicleDialog({
  open,
  onOpenChange,
  vehicle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleDetail;
}) {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const form = useForm<EditFormInput>({
    resolver: zodResolver(editSchema),
    defaultValues: buildDefaults(vehicle),
  });

  const [photoAction, setPhotoAction] = useState<PhotoAction>("keep");
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      form.reset(buildDefaults(vehicle));
      setPhotoAction("keep");
      setPendingPhoto(null);
    } else {
      setPhotoAction("keep");
      setPendingPhoto(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicle.id]);

  const mutation = useMutation({
    mutationFn: async (values: EditFormValues) => {
      const plate = values.license_plate.trim().toUpperCase();

      if (plate !== vehicle.license_plate) {
        try {
          const dup = await pb
            .collection("vehicles")
            .getFirstListItem(
              pb.filter("license_plate = {:p} && id != {:id}", {
                p: plate,
                id: vehicle.id,
              }),
            );
          if (dup) {
            form.setError("license_plate", {
              type: "manual",
              message: "Vozidlo s touto ŠPZ už existuje",
            });
            throw new Error("DUPLICATE_PLATE");
          }
        } catch (e) {
          const status = (e as { status?: number }).status;
          if (status !== 404 && (e as Error).message !== "DUPLICATE_PLATE") {
            // ignore "not found" => no duplicate
          }
          if ((e as Error).message === "DUPLICATE_PLATE") throw e;
        }
      }

      if (vehicle.customer) {
        await pb.collection("customers").update(vehicle.customer.id, {
          first_name: values.first_name.trim(),
          last_name: values.last_name.trim(),
          phone: values.phone.trim(),
          email: emptyToNull(values.email as string),
          notes: emptyToNull(values.customer_notes as string),
        });
      }

      const vehiclePayload: Record<string, unknown> = {
        brand: values.brand.trim(),
        model: values.model.trim(),
        year:
          values.year === "" || values.year == null ? null : Number(values.year),
        license_plate: plate,
        vin: emptyToNull(values.vin as string),
        current_mileage: Number(values.current_mileage),
        engine: emptyToNull(values.engine as string),
        transmission: emptyToNull(values.transmission as string),
        drive: emptyToNull(values.drive as string),
        power: emptyToNull(values.power as string),
        oil_volume: emptyToNull(values.oil_volume as string),
        tire_size: emptyToNull(values.tire_size as string),
        fuel_type: emptyToNull(values.fuel_type as string),
        notes: emptyToNull(values.vehicle_notes as string),
      };

      await pb.collection("vehicles").update(vehicle.id, vehiclePayload);

      // Handle photo as a separate update so a failure doesn't roll back text data.
      let photoWarning: string | null = null;
      if (photoAction === "replace" && pendingPhoto) {
        try {
          const compressed = await compressImage(pendingPhoto);
          const fd = new FormData();
          fd.append("photo", compressed);
          await pb.collection("vehicles").update(vehicle.id, fd);
        } catch (e) {
          console.warn("Vehicle photo replace failed", e);
          photoWarning = "Fotku sa nepodarilo uložiť";
        }
      } else if (photoAction === "remove") {
        try {
          await pb.collection("vehicles").update(vehicle.id, { photo: null });
        } catch (e) {
          console.warn("Vehicle photo remove failed", e);
          photoWarning = "Fotku sa nepodarilo odstrániť";
        }
      }

      return { photoWarning };
    },
    onSuccess: ({ photoWarning }) => {
      toast.success("Údaje boli uložené");
      if (photoWarning) toast.warning(photoWarning);
      queryClient.invalidateQueries({ queryKey: ["vehicle", vehicle.id] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["service-history"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      if (err.message === "DUPLICATE_PLATE") return;
      toast.error("Údaje sa nepodarilo uložiť");
    },
  });

  const handler: SubmitHandler<EditFormInput> = (values) => {
    mutation.mutate(values as unknown as EditFormValues);
  };

  const body = (
    <form onSubmit={form.handleSubmit(handler)} className="space-y-6">
      <VehiclePhotoField
        currentUrl={vehicle.photo_url}
        action={photoAction}
        pendingFile={pendingPhoto}
        onChange={({ action, pendingFile }) => {
          setPhotoAction(action);
          setPendingPhoto(pendingFile);
        }}
        disabled={mutation.isPending}
      />
      <div className="h-px bg-brand-border" />
      <CustomerEditFormSection form={form} />
      <div className="h-px bg-brand-border" />
      <VehicleEditFormSection form={form} />
      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={mutation.isPending}
          className="border-brand-border bg-transparent text-brand-fg hover:bg-brand-surface"
        >
          Zrušiť
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
          className="bg-brand-accent text-white hover:bg-brand-accent-hover"
        >
          {mutation.isPending ? "Ukladám…" : "Uložiť zmeny"}
        </Button>
      </div>
      <DeleteVehicleButton vehicle={vehicle} onDeleted={() => onOpenChange(false)} />
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[95vh] overflow-y-auto border-brand-border bg-brand-surface text-brand-fg"
        >
          <SheetHeader>
            <SheetTitle className="text-brand-fg">Upraviť údaje</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{body}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-brand-border bg-brand-surface text-brand-fg sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-brand-fg">Upraviť údaje</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
