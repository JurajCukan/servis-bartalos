import { useEffect, useMemo, useRef } from "react";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ALLOWED_MIME,
  MAX_PHOTOS_PER_RECORD,
  validateFiles,
} from "@/lib/photos";

export type ExistingPhoto = { filename: string; url: string };

export function ServiceRecordPhotoPicker({
  existing,
  pendingFiles,
  onExistingChange,
  onPendingChange,
  disabled,
}: {
  existing: ExistingPhoto[];
  pendingFiles: File[];
  onExistingChange: (next: ExistingPhoto[]) => void;
  onPendingChange: (files: File[]) => void;
  disabled?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const pendingUrls = useMemo(
    () => pendingFiles.map((f) => URL.createObjectURL(f)),
    [pendingFiles],
  );
  useEffect(() => {
    return () => {
      pendingUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [pendingUrls]);

  const totalCount = existing.length + pendingFiles.length;
  const atLimit = totalCount >= MAX_PHOTOS_PER_RECORD;

  const handleAdd = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const { accepted, errors } = validateFiles(Array.from(files), totalCount);
    if (errors.length > 0) {
      const seen = new Set<string>();
      for (const e of errors) {
        if (!seen.has(e.reason)) {
          toast.error(e.reason);
          seen.add(e.reason);
        }
      }
    }
    if (accepted.length > 0) {
      onPendingChange([...pendingFiles, ...accepted]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-brand-fg">
          Fotky{" "}
          <span className="text-xs text-brand-fg-subtle">
            ({totalCount}/{MAX_PHOTOS_PER_RECORD})
          </span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || atLimit}
          onClick={() => fileRef.current?.click()}
          className="border-brand-border bg-transparent text-brand-fg hover:bg-brand-surface"
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Pridať fotky
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept={ALLOWED_MIME.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            handleAdd(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {totalCount === 0 ? (
        <div className="rounded-md border border-dashed border-brand-border bg-brand-bg px-3 py-6 text-center text-sm text-brand-fg-subtle">
          Zatiaľ bez fotiek
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
          {existing.map((p, idx) => (
            <Thumb
              key={`e-${p.filename}`}
              url={p.url}
              label={`Fotka ${idx + 1}`}
              onRemove={() => onExistingChange(existing.filter((x) => x.filename !== p.filename))}
              disabled={disabled}
            />
          ))}
          {pendingFiles.map((file, idx) => (
            <Thumb
              key={`p-${idx}-${file.name}`}
              url={pendingUrls[idx]}
              label={file.name}
              pending
              onRemove={() =>
                onPendingChange(pendingFiles.filter((_, i) => i !== idx))
              }
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Thumb({
  url,
  label,
  onRemove,
  disabled,
  pending,
}: {
  url?: string;
  label: string;
  onRemove: () => void;
  disabled?: boolean;
  pending?: boolean;
}) {
  return (
    <div className="group relative aspect-square overflow-hidden rounded-md border border-brand-border bg-brand-bg">
      {url ? (
        <img src={url} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full animate-pulse bg-brand-surface" />
      )}
      {pending && (
        <div className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-brand-fg">
          Nové
        </div>
      )}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Odstrániť fotku"
          className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-brand-fg opacity-80 transition hover:bg-black hover:opacity-100"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
