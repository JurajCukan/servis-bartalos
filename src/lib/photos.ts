import { supabase } from "@/integrations/supabase/client";

const BUCKET = "service-photos";
const SIGNED_URL_TTL = 60 * 60; // 1h

export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_PHOTOS_PER_RECORD = 8;

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

export async function uploadPhotos(
  vehicleId: string,
  recordId: string,
  files: File[],
): Promise<{ uploadedPaths: string[]; failedCount: number }> {
  const uploadedPaths: string[] = [];
  let failedCount = 0;

  for (const file of files) {
    const path = `${vehicleId}/${recordId}/${randomId()}.${extFromType(file.type)}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (error) {
      console.warn("Photo upload failed", path, error);
      failedCount += 1;
    } else {
      uploadedPaths.push(path);
    }
  }
  return { uploadedPaths, failedCount };
}

export async function deletePhotos(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) {
    console.warn("Photo delete failed", error);
  }
}

export async function getSignedUrls(paths: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (paths.length === 0) return result;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(paths, SIGNED_URL_TTL);
  if (error) {
    console.warn("Signed url generation failed", error);
    return result;
  }
  for (const item of data ?? []) {
    if (item.path && item.signedUrl) {
      result[item.path] = item.signedUrl;
    }
  }
  return result;
}
