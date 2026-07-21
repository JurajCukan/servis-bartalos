import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.8,
};

/**
 * Compress an image file before uploading to PocketBase.
 * Outputs WebP at max 1920px and ~80% quality.
 * If compression fails, returns the original file unchanged.
 */
export async function compressImage(file: File): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith("image/")) {
    return file;
  }

  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

    // Build a File with the correct name (swap extension to .webp)
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const compressedFile = new File([compressed], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });

    const ratio = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
    console.log(
      `[compress] ${file.name} (${(file.size / 1024).toFixed(0)} KB) → ${compressedFile.name} (${(compressedFile.size / 1024).toFixed(0)} KB) — ${ratio}% smaller`,
    );

    return compressedFile;
  } catch (err) {
    console.warn("[compress] Compression failed, using original:", err);
    return file;
  }
}

/**
 * Compress multiple image files in parallel.
 */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
