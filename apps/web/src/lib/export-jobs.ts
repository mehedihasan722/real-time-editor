type WorkerResult = { blob: Blob; width?: number; height?: number };
export async function compressImage(bitmap: ImageBitmap): Promise<WorkerResult> {
  if (typeof OffscreenCanvas !== "undefined") return runExportJob({ kind: "image", bitmap }, [bitmap]);
  // Older WebKit has no worker canvas. Its asynchronous native encoder avoids a synchronous data URL encode.
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d"); if (!context) throw new Error("Image processing is unavailable.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Image encoding failed.")), "image/webp", .7));
  return { blob, width: canvas.width, height: canvas.height };
}
export function runExportJob(job: unknown, transfer: Transferable[] = []): Promise<WorkerResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./export-worker.ts", import.meta.url), { type: "module" });
    const finish = () => { clearTimeout(timeout); worker.terminate(); };
    const timeout = setTimeout(() => { finish(); reject(new Error("Export took too long. Try a smaller board.")); }, 60000);
    worker.onmessage = event => { finish(); if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data); };
    worker.onerror = () => { finish(); reject(new Error("Export processing is unavailable.")); };
    try { worker.postMessage(job, transfer); } catch (error) { finish(); reject(error); }
  });
}
