import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScheduleTaskForm } from "./ScheduleTaskForm";

export function ScheduleServiceDialog({
  open,
  onOpenChange,
  vehicleId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
}) {
  const close = () => onOpenChange(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto border-brand-border bg-brand-surface text-brand-fg sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-brand-fg">Naplánovať servis</DialogTitle>
        </DialogHeader>
        <ScheduleTaskForm vehicleId={vehicleId} onCancel={close} onSuccess={close} />
      </DialogContent>
    </Dialog>
  );
}
