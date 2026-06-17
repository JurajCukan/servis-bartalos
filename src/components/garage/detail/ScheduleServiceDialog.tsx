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
import { useIsMobile } from "@/hooks/use-mobile";
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
  const isMobile = useIsMobile();
  const close = () => onOpenChange(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[95vh] overflow-y-auto border-brand-border bg-brand-surface text-brand-fg"
        >
          <SheetHeader>
            <SheetTitle className="text-brand-fg">Naplánovať servis</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <ScheduleTaskForm
              vehicleId={vehicleId}
              onCancel={close}
              onSuccess={close}
            />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-brand-border bg-brand-surface text-brand-fg">
        <DialogHeader>
          <DialogTitle className="text-brand-fg">Naplánovať servis</DialogTitle>
        </DialogHeader>
        <ScheduleTaskForm
          vehicleId={vehicleId}
          onCancel={close}
          onSuccess={close}
        />
      </DialogContent>
    </Dialog>
  );
}
