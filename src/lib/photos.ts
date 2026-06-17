// Photo helpers for service_records (PocketBase multi-file field "photos")
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_PHOTOS_PER_RECORD = 10;

export type PhotoValidationError = {
  file: File;
  reason: string;
};

export function validateFiles(
  incoming: File[],
  alreadyCount: number,
): { accepted: File[]; errors: PhotoValidationError[]; remainingSlots: number } {
  const errors: PhotoValidationError[] = [];
  const accepted: File[] = [];
  let slots = Math.max(0, MAX_PHOTOS_PER_RECORD - alreadyCount);

  for (const file of incoming) {
    if (slots <= 0) {
      errors.push({ file, reason: `Maximálne ${MAX_PHOTOS_PER_RECORD} fotiek na záznam` });
      continue;
    }
    if (!(ALLOWED_MIME as readonly string[]).includes(file.type)) {
      errors.push({ file, reason: "Nepodporovaný formát súboru" });
      continue;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push({ file, reason: "Súbor je príliš veľký (max 10 MB)" });
      continue;
    }
    accepted.push(file);
    slots -= 1;
  }

  return { accepted, errors, remainingSlots: slots };
}
