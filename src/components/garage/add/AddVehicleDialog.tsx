import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

import { StepIndicator } from "./StepIndicator";
import { CustomerStep, type CustomerResolution } from "./CustomerStep";
import { VehicleForm, type VehicleFormValues } from "./VehicleForm";

class DuplicatePlateError extends Error {
  constructor(public vehicleId: string) {
    super("DUPLICATE_PLATE");
  }
}

function emptyToNull(s: string | undefined | null): string | null {
  if (!s) return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}

export function AddVehicleDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [customer, setCustomer] = useState<CustomerResolution | null>(null);

  const reset = () => {
    setStep(1);
    setCustomer(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const mutation = useMutation({
    mutationFn: async (vehicle: VehicleFormValues) => {
      if (!customer) throw new Error("Chýba zákazník");

      // resolve customer id
      let customerId: string;
      if (customer.kind === "existing") {
        customerId = customer.customer.id;
      } else {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            first_name: customer.customer.first_name,
            last_name: customer.customer.last_name,
            phone: customer.customer.phone,
            email: customer.customer.email,
            notes: customer.customer.notes,
          })
          .select("id")
          .single();
        if (error) throw error;
        customerId = data.id;
      }

      const plate = vehicle.license_plate.trim().toUpperCase();

      // duplicate check
      const { data: existing, error: dupErr } = await supabase
        .from("vehicles")
        .select("id")
        .eq("license_plate", plate)
        .maybeSingle();
      if (dupErr) throw dupErr;
      if (existing) throw new DuplicatePlateError(existing.id);

      const { data: inserted, error: insErr } = await supabase
        .from("vehicles")
        .insert({
          customer_id: customerId,
          brand: vehicle.brand.trim(),
          model: vehicle.model.trim(),
          year: vehicle.year === "" || vehicle.year == null ? null : Number(vehicle.year),
          vin: emptyToNull(vehicle.vin as string | undefined),
          license_plate: plate,
          current_mileage: vehicle.current_mileage,
          engine: emptyToNull(vehicle.engine as string | undefined),
          transmission: emptyToNull(vehicle.transmission as string | undefined),
          drive: emptyToNull(vehicle.drive as string | undefined),
          power: emptyToNull(vehicle.power as string | undefined),
          oil_volume: emptyToNull(vehicle.oil_volume as string | undefined),
          tire_size: emptyToNull(vehicle.tire_size as string | undefined),
          fuel_type: emptyToNull(vehicle.fuel_type as string | undefined),
          notes: emptyToNull(vehicle.notes as string | undefined),
          status: "OK",
        })
        .select("id")
        .single();
      if (insErr) throw insErr;
      return inserted.id as string;
    },
    onSuccess: (vehicleId) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles", "with-customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Vozidlo bolo pridané");
      reset();
      onOpenChange(false);
      navigate({ to: "/garage/$vehicleId", params: { vehicleId } });
    },
    onError: (err) => {
      if (err instanceof DuplicatePlateError) {
        toast.error("Vozidlo s touto ŠPZ už existuje", {
          action: {
            label: "Otvoriť",
            onClick: () => {
              onOpenChange(false);
              navigate({
                to: "/garage/$vehicleId",
                params: { vehicleId: err.vehicleId },
              });
            },
          },
        });
        return;
      }
      console.error(err);
      toast.error("Vozidlo sa nepodarilo uložiť");
    },
  });

  const body = (
    <div className="space-y-5">
      <StepIndicator step={step} />
      {step === 1 ? (
        <CustomerStep
          initial={customer}
          onCancel={() => handleOpenChange(false)}
          onContinue={(r) => {
            setCustomer(r);
            setStep(2);
          }}
        />
      ) : (
        <VehicleForm
          onBack={() => setStep(1)}
          onSubmit={(v) => mutation.mutate(v)}
          isSubmitting={mutation.isPending}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[95vh] overflow-y-auto border-brand-border bg-brand-surface text-brand-fg"
        >
          <SheetHeader>
            <SheetTitle className="text-brand-fg">Pridať vozidlo</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{body}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-brand-border bg-brand-surface text-brand-fg">
        <DialogHeader>
          <DialogTitle className="text-brand-fg">Pridať vozidlo</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
