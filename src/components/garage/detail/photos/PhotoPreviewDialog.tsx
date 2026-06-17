import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function PhotoPreviewDialog({
  urls,
  startIndex,
  open,
  onOpenChange,
}: {
  urls: string[];
  startIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  if (urls.length === 0) return null;
  const safeIndex = Math.min(Math.max(index, 0), urls.length - 1);
  const current = urls[safeIndex];

  const prev = () => setIndex((i) => (i - 1 + urls.length) % urls.length);
  const next = () => setIndex((i) => (i + 1) % urls.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl border-brand-border bg-brand-bg p-0">
        <div className="relative flex items-center justify-center bg-black">
          <img
            src={current}
            alt={`Fotka ${safeIndex + 1} z ${urls.length}`}
            className="max-h-[80vh] w-auto max-w-full object-contain"
          />
          {urls.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                aria-label="Predchádzajúca"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-brand-fg transition hover:bg-black/80"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Ďalšia"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-brand-fg transition hover:bg-black/80"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-brand-fg">
                {safeIndex + 1} / {urls.length}
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Zavrieť"
            className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-brand-fg transition hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
