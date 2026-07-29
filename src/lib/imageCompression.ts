import { compress } from "@fileslim/compress";

/**
 * Compress an image file before storing.
 * Uses @fileslim/compress with 'web' preset and 'best' mode.
 * If compression fails, returns the original file unchanged.
 */
export async function compressImage(file: File): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith("image/")) {
    return file;
  }

  try {
    const result = await compress(file, { preset: "web", mode: "best" });

    // Build a File with the correct name (swap extension if format changed)
    const baseName = file.name.replace(/\.[^.]+$/, "");
    let newExt = ".jpg";
    if (result.format === "image/webp") newExt = ".webp";
    if (result.format === "image/avif") newExt = ".avif";
    if (result.format === "image/png") newExt = ".png";

    const compressedFile = new File([result.blob], `${baseName}${newExt}`, {
      type: result.format,
      lastModified: Date.now(),
    });

    console.log(
      `[compress] ${file.name} (${(file.size / 1024).toFixed(0)} KB) → ${compressedFile.name} (${(compressedFile.size / 1024).toFixed(0)} KB) — ${result.savings}% smaller`,
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
