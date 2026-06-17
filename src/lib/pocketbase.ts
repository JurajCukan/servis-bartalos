import PocketBase, { type RecordModel } from "pocketbase";

const url =
  (typeof window !== "undefined" &&
    (import.meta.env.VITE_POCKETBASE_URL as string | undefined)) ||
  "http://localhost:8090";

const pb = new PocketBase(url);
pb.autoCancellation(false);

export default pb;

export function fileUrl(
  record: Pick<RecordModel, "id" | "collectionId" | "collectionName">,
  filename: string,
): string {
  return pb.files.getURL(record, filename);
}
