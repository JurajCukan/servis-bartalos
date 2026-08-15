import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ServiceRecordForm } from "./ServiceRecordForm";
import { DeleteServiceRecordButton } from "./DeleteServiceRecordButton";
import type { ServiceRecord } from "@/lib/queries/vehicles";

export function EditServiceRecordDialog({
  open,
  onOpenChange,
  vehicleId,
  currentMileage,
  record,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  currentMileage: number;
  record: ServiceRecord | null;
}) {
  const close = () => onOpenChange(false);

  if (!record) return null;

  const body = (
    <div className="space-y-6">
      <ServiceRecordForm
        key={record.id}
        mode="edit"
        record={record}
        vehicleId={vehicleId}
        currentMileage={currentMileage}
        onCancel={close}
        onSuccess={close}
      />
      <DeleteServiceRecordButton record={record} vehicleId={vehicleId} onDeleted={close} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto border-brand-border bg-brand-surface text-brand-fg sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-brand-fg">Upraviť servisný záznam</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
