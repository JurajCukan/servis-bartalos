import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { getSignedUrls } from "@/lib/photos";
import { PhotoPreviewDialog } from "./PhotoPreviewDialog";

export function ServiceRecordPhotoGrid({ paths }: { paths: string[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (paths.length === 0) {
      setUrls({});
      return;
    }
    getSignedUrls(paths).then((res) => {
      if (!cancelled) setUrls(res);
    });
    return () => {
      cancelled = true;
    };
  }, [paths]);

  if (paths.length === 0) return null;

  const orderedUrls = paths.map((p) => urls[p]).filter((u): u is string => !!u);

  return (
    <div>
      <div className="text-xs text-white/50 mb-2">Fotky ({paths.length})</div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {paths.map((path, idx) => {
          const url = urls[path];
          return (
            <button
              key={path}
              type="button"
              onClick={() => {
                const realIdx = orderedUrls.indexOf(url ?? "");
                setStartIndex(realIdx >= 0 ? realIdx : 0);
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
                <div className="flex h-full w-full items-center justify-center text-white/30">
                  <ImageOff className="h-5 w-5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      <PhotoPreviewDialog
        urls={orderedUrls}
        startIndex={startIndex}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
