import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import pb from "@/lib/pocketbase";

/**
 * Subscribe to PocketBase realtime events on a collection and invalidate
 * the given React Query keys when anything changes.
 */
export function usePocketBaseRealtime(
  collection: string,
  invalidateKeys: QueryKey[],
) {
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;

    pb.collection(collection)
      .subscribe("*", () => {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      })
      .then((unsub) => {
        if (cancelled) {
          unsub();
        } else {
          unsubscribe = unsub;
        }
      })
      .catch((err) => {
        console.warn(`PocketBase realtime subscribe failed for ${collection}`, err);
      });

    return () => {
      cancelled = true;
      if (unsubscribe) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection]);
}
