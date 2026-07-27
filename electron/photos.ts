import fs from "fs";
import path from "path";

let photosBaseDir = "";

export function initPhotos(userDataPath: string): void {
  photosBaseDir = path.join(userDataPath, "photos");
  fs.mkdirSync(path.join(photosBaseDir, "vehicles"), { recursive: true });
  fs.mkdirSync(path.join(photosBaseDir, "service_records"), { recursive: true });
  console.log(`[photos] Photos directory initialized at: ${photosBaseDir}`);
}

export function getPhotosDir(): string {
  return photosBaseDir;
}

export function savePhoto(
  collection: "vehicles" | "service_records",
  recordId: string,
  originalName: string,
  dataBase64: string
): string {
  const ext = path.extname(originalName) || ".jpg";
  const safeName = `${recordId}_${Date.now()}${ext}`;
  const filePath = path.join(photosBaseDir, collection, safeName);
  const buffer = Buffer.from(dataBase64, "base64");
  fs.writeFileSync(filePath, buffer);
  console.log(`[photos] Saved photo: ${filePath} (${buffer.length} bytes)`);
  return safeName;
}

export function deletePhoto(
  collection: "vehicles" | "service_records",
  filename: string
): void {
  const filePath = path.join(photosBaseDir, collection, filename);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[photos] Deleted photo: ${filePath}`);
    }
  } catch (e) {
    console.error(`[photos] Failed to delete photo: ${filePath}`, e);
  }
}

export function deleteAllPhotosForRecord(
  collection: "vehicles" | "service_records",
  recordId: string
): void {
  const dir = path.join(photosBaseDir, collection);
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.startsWith(`${recordId}_`)) {
        fs.unlinkSync(path.join(dir, file));
        console.log(`[photos] Deleted photo for record ${recordId}: ${file}`);
      }
    }
  } catch (e) {
    console.error(`[photos] Failed to delete photos for record: ${recordId}`, e);
  }
}

export function getPhotoPath(
  collection: "vehicles" | "service_records",
  filename: string
): string {
  return path.join(photosBaseDir, collection, filename);
}

export function photoExists(
  collection: "vehicles" | "service_records",
  filename: string
): boolean {
  return fs.existsSync(path.join(photosBaseDir, collection, filename));
}

export function readPhotoAsBase64(
  collection: "vehicles" | "service_records",
  filename: string
): string | null {
  const filePath = path.join(photosBaseDir, collection, filename);
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath).toString("base64");
    }
  } catch (e) {
    console.error(`[photos] Failed to read photo: ${filePath}`, e);
  }
  return null;
}
