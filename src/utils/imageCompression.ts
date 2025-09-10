export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

export async function compressImageFile(
  file: File,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number; mimeType?: string }
): Promise<File> {
  const { maxWidth = 1024, maxHeight = 1024, quality = 0.8, mimeType = 'image/jpeg' } = options || {};

  const { width: origW, height: origH } = await getImageDimensions(file);

  let targetW = origW;
  let targetH = origH;

  // maintain aspect ratio
  if (origW > maxWidth || origH > maxHeight) {
    const ratio = Math.min(maxWidth / origW, maxHeight / origH);
    targetW = Math.round(origW * ratio);
    targetH = Math.round(origH * ratio);
  }

  const url = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
  URL.revokeObjectURL(url);
  if (!blob) throw new Error('Image compression failed');

  const newFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: mimeType });
  return newFile;
}

/*
Usage:
const compressed = await compressImageFile(file, { maxWidth: 800, quality: 0.75 });
Then upload compressed instead of original.
*/
