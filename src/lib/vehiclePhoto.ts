// Vehicle photo helpers (PocketBase single-file field "photo")
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
