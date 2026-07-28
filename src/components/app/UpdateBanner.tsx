import { useEffect, useState } from "react";
import { Download } from "lucide-react";

export function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) {
      return;
    }

    const unsubscribe = window.electronAPI.onUpdateAvailable(() => {
      setUpdateAvailable(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!updateAvailable || dismissed) {
    return null;
  }

  const handleUpdate = () => {
    if (window.electronAPI) {
      window.electronAPI.downloadUpdate();
      setDismissed(true);
    }
  };

  return (
    <div className="bg-brand-accent text-white px-4 py-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm animate-in fade-in slide-in-from-top duration-300 relative z-50">
      <div className="flex items-center gap-2">
        <Download className="h-4 w-4 shrink-0 animate-bounce" />
        <span className="font-medium">Je dostupná nová verzia aplikácie.</span>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={handleUpdate}
          className="bg-white text-brand-accent font-semibold px-3 py-1 rounded hover:bg-neutral-100 transition text-xs cursor-pointer shadow-sm"
        >
          Stiahnuť a aktualizovať
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-white hover:text-neutral-200 transition text-xs px-2 py-1 font-medium cursor-pointer"
        >
          Neskôr
        </button>
      </div>
    </div>
  );
}
