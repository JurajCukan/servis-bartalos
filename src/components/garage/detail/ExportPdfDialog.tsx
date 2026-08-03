import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { VehicleDetail } from "@/lib/queries/vehicles";

interface ExportPdfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicle?: VehicleDetail;
  defaultRecordId?: string;
  records: any[];
}

export function ExportPdfDialog({ open, onOpenChange, vehicleId, vehicle, defaultRecordId, records }: ExportPdfDialogProps) {
  const [docType, setDocType] = useState<"book" | "protocol" | "invoice">("book");
  const [selectedRecordId, setSelectedRecordId] = useState<string>(defaultRecordId || (records.length > 0 ? records[0].id : ""));

  const handleExport = async () => {
    if (!window.electronAPI) return;

    if (vehicle) {
      const c = vehicle.customer;
      if (
        !vehicle.brand ||
        !vehicle.model ||
        !vehicle.license_plate ||
        !c?.first_name ||
        !c?.last_name ||
        !c?.phone
      ) {
        toast.error("Chýbajú údaje o vozidle alebo zákazníkovi. Pre export je nutné mať vyplnené Meno, Priezvisko, Telefón, Značku, Model a ŠPZ.", {
          duration: 6000
        });
        return;
      }
    }
    
    try {
      const recordId = (docType === "protocol" || docType === "invoice") ? selectedRecordId : undefined;
      const res = await window.electronAPI.exportVehiclePdf(docType, vehicleId, recordId);
      if (res.success) {
        onOpenChange(false);
      } else {
        alert(res.error || "Chyba pri generovaní PDF.");
      }
    } catch (e) {
      console.error(e);
      alert("Nastala chyba.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportovať do PDF</DialogTitle>
          <DialogDescription>
            Vyberte typ dokumentu pre export do formátu PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={docType} onValueChange={(val: any) => setDocType(val)} className="flex flex-col gap-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="book" id="r-book" />
              <Label htmlFor="r-book" className="cursor-pointer">Servisná knižka vozidla (Kompletná história)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="protocol" id="r-protocol" />
              <Label htmlFor="r-protocol" className="cursor-pointer">Servisný protokol (Jeden záznam)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="invoice" id="r-invoice" />
              <Label htmlFor="r-invoice" className="cursor-pointer">Fakturačný podklad (Kalkulácia)</Label>
            </div>
          </RadioGroup>

          {(docType === "protocol" || docType === "invoice") && (
            <div className="mt-4 pt-4 border-t">
              <Label className="mb-2 block">Vyberte servisný záznam:</Label>
              <select 
                className="w-full rounded-md border border-gray-300 p-2 text-sm"
                value={selectedRecordId}
                onChange={(e) => setSelectedRecordId(e.target.value)}
              >
                {records.map(r => (
                  <option key={r.id} value={r.id}>
                    {new Date(r.date).toLocaleDateString("sk-SK")} - {r.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200"
            onClick={() => onOpenChange(false)}
          >
            Zrušiť
          </button>
          <button 
            className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
            onClick={handleExport}
            disabled={(docType === "protocol" || docType === "invoice") && !selectedRecordId}
          >
            Generovať PDF
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
