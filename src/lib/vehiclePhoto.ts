import { supabase } from "@/integrations/supabase/client";

const BUCKET = "vehicle-photos";
const TTL = 60 * 60;

export const VEHICLE_PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const VEHICLE_PHOTO_MAX_SIZE = 10 * 1024 * 1024;

export function validateVehiclePhoto(file: File): string | null {
  if (!(VEHICLE_PHOTO_MIME as readonly string[]).includes(file.type)) {
    return "Nepodporovaný formát súboru";
  }
  if (file.size > VEHICLE_PHOTO_MAX_SIZE) {
    return "Súbor je príliš veľký (max 10 MB)";
  }
  return null;
}

function extFromType(type: string): string {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "bin";
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export async function uploadVehiclePhoto(vehicleId: string, file: File): Promise<string> {
  const path = `${vehicleId}/main-${randomId()}.${extFromType(file.type)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function deleteVehiclePhoto(path: string | null | undefined): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.warn("Vehicle photo delete failed", error);
}

export async function getVehiclePhotoSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, TTL);
  if (error) {
    console.warn("Vehicle photo signed URL failed", error);
    return null;
  }
  return data?.signedUrl ?? null;
}
