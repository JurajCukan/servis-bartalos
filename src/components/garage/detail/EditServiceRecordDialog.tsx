import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  const close = () => onOpenChange(false);

  if (!record) return null;

  const body = (
    <ServiceRecordForm
      key={record.id}
      mode="edit"
      record={record}
      vehicleId={vehicleId}
      currentMileage={currentMileage}
      onCancel={close}
      onSuccess={close}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[95vh] overflow-y-auto border-brand-border bg-brand-surface text-white"
        >
          <SheetHeader>
            <SheetTitle className="text-white">Upraviť servisný záznam</SheetTitle>
          </SheetHeader>
          <div className="mt-4">{body}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-brand-border bg-brand-surface text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Upraviť servisný záznam</DialogTitle>
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
