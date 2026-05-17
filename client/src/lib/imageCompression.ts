export async function fileToCompressedDataUrl(
  file: File,
  opts?: { maxEdge?: number; targetMaxChars?: number }
): Promise<string> {
  const maxEdge = opts?.maxEdge || 1600;
  const targetMaxChars = opts?.targetMaxChars || 1_200_000;

  // Read file into an ImageBitmap or HTMLImageElement
  let bitmap: ImageBitmap | HTMLImageElement;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Fallback: use Image element
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = url;
    });
    URL.revokeObjectURL(url);
    bitmap = img;
  }

  // Compute dimensions preserving aspect ratio
  let { width, height } = bitmap;
  if (width > maxEdge || height > maxEdge) {
    if (width > height) {
      height = Math.round((height / width) * maxEdge);
      width = maxEdge;
    } else {
      width = Math.round((width / height) * maxEdge);
      height = maxEdge;
    }
  }

  // Draw to canvas and compress
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Try quality from 0.82 down to 0.65
  for (let q = 0.82; q >= 0.65; q -= 0.05) {
    const dataUrl = canvas.toDataURL("image/jpeg", q);
    if (dataUrl.length <= targetMaxChars) return dataUrl;
  }

  // Final attempt at lowest quality
  const final = canvas.toDataURL("image/jpeg", 0.65);
  if (final.length <= targetMaxChars) return final;

  throw new Error("Image too large even after compression.");
}
