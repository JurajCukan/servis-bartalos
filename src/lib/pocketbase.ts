import PocketBase from "pocketbase";

const url = import.meta.env.VITE_POCKETBASE_URL ?? "http://localhost:8090";

export const pb = new PocketBase(url);
// Persist auth across reloads (PocketBase SDK uses localStorage by default in browsers).
pb.autoCancellation(false);
