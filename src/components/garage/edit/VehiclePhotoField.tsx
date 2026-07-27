import { useEffect, useRef, useState } from "react";
import { Car, Upload, X, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const VEHICLE_PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"];
const MAX_VEHICLE_PHOTO_SIZE = 10 * 1024 * 1024; // 10 MB

function validateVehiclePhoto(file: File): string | null {
  if (!VEHICLE_PHOTO_MIME.includes(file.type)) {
    return `Typ súboru "${file.type}" nie je povolený. Povolené sú JPG, PNG a WEBP.`;
  }
  if (file.size > MAX_VEHICLE_PHOTO_SIZE) {
    return `Súbor "${file.name}" je príliš veľký (max 10 MB).`;
  }
  return null;
}

export type PhotoAction = "keep" | "replace" | "remove";

export function VehiclePhotoField({
  currentUrl,
  action,
  pendingFile,
  onChange,
  disabled,
}: {
  currentUrl: string | null;
  action: PhotoAction;
  pendingFile: File | null;
  onChange: (next: { action: PhotoAction; pendingFile: File | null }) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!pendingFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const hasCurrent = Boolean(currentUrl);
  const showRemoved = action === "remove";
  const displayUrl =
    action === "replace" && previewUrl ? previewUrl : showRemoved ? null : currentUrl;

  const handlePick = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const err = validateVehiclePhoto(file);
    if (err) {
      toast.error(err);
      return;
    }
    onChange({ action: "replace", pendingFile: file });
  };

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-fg-muted">
        Hlavná fotka vozidla
      </h3>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md border border-brand-border bg-brand-bg sm:w-64">
          {displayUrl ? (
            <img src={displayUrl} alt="Fotka vozidla" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-brand-fg-subtle">
              <Car className="h-8 w-8" aria-hidden />
              <span className="text-xs">Bez fotky</span>
            </div>
          )}
          {action === "replace" && (
            <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-brand-fg">
              Nová
            </span>
          )}
          {showRemoved && (
            <span className="absolute left-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-brand-fg">
              Odstránená
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => fileRef.current?.click()}
            className="border-brand-border bg-transparent text-brand-fg hover:bg-brand-surface"
          >
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {hasCurrent || action === "replace" ? "Nahradiť" : "Nahrať fotku"}
          </Button>
          {hasCurrent && action !== "remove" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => onChange({ action: "remove", pendingFile: null })}
              className="border-brand-border bg-transparent text-brand-fg hover:bg-brand-surface"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Odstrániť
            </Button>
          )}
          {action !== "keep" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onChange({ action: "keep", pendingFile: null })}
              className="text-brand-fg-muted hover:bg-brand-surface hover:text-brand-fg"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Zrušiť zmenu
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept={VEHICLE_PHOTO_MIME.join(",")}
            className="hidden"
            onChange={(e) => {
              handlePick(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      <p className="text-xs text-brand-fg-subtle">JPG, PNG alebo WEBP, max 10 MB.</p>
    </section>
  );
}
