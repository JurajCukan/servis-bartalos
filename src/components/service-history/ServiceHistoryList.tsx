import { ServiceHistoryItem } from "./ServiceHistoryItem";
import type { ServiceHistoryItem as Item } from "@/lib/queries/serviceHistory";

export function ServiceHistoryList({ items }: { items: Item[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <ServiceHistoryItem key={item.id} item={item} />
      ))}
    </div>
  );
}
