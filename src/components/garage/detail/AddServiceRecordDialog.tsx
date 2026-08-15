import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServiceRecordForm } from "./ServiceRecordForm";

export function AddServiceRecordDialog({
  open,
  onOpenChange,
  vehicleId,
  currentMileage,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  currentMileage: number;
}) {
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto border-brand-border bg-brand-surface text-brand-fg sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-brand-fg">Pridať servisný záznam</DialogTitle>
        </DialogHeader>
        <ServiceRecordForm
          vehicleId={vehicleId}
          currentMileage={currentMileage}
          onCancel={close}
          onSuccess={close}
        />
      </DialogContent>
    </Dialog>
  );
}
