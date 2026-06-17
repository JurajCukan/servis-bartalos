import { useState } from "react";
import { ImageOff } from "lucide-react";
import { PhotoPreviewDialog } from "./PhotoPreviewDialog";

export function ServiceRecordPhotoGrid({ urls }: { urls: string[] }) {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  if (urls.length === 0) return null;

  return (
    <div>
      <div className="mb-2 text-xs text-brand-fg-muted">Fotky ({urls.length})</div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {urls.map((url, idx) => (
          <button
            key={url + idx}
            type="button"
            onClick={() => {
              setStartIndex(idx);
              setOpen(true);
            }}
            className="group relative aspect-square overflow-hidden rounded-md border border-brand-border bg-brand-bg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
          >
            {url ? (
              <img
                src={url}
                alt={`Fotka ${idx + 1}`}
                loading="lazy"
                className="h-full w-full object-cover transition group-hover:opacity-80"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-brand-fg-subtle">
                <ImageOff className="h-5 w-5" />
              </div>
            )}
          </button>
        ))}
      </div>
      <PhotoPreviewDialog
        urls={urls}
        startIndex={startIndex}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
