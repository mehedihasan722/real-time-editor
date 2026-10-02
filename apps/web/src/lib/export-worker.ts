import { jsPDF } from "jspdf";
import { encode } from "fast-png";
type ExportJob = { kind: "pdf"; png: string; width: number; height: number } | { kind: "pixels"; data: Uint8ClampedArray; width: number; height: number } | { kind: "image" | "png"; bitmap: ImageBitmap };
self.onmessage = async (event: MessageEvent<ExportJob>) => {
  try {
    const job = event.data;
    if (job.kind === "pdf") {
      const pdf = new jsPDF({ orientation: job.width > job.height ? "landscape" : "portrait", unit: "px", format: [job.width, job.height], hotfixes: ["px_scaling"] });
      pdf.addImage(job.png, "PNG", 0, 0, job.width, job.height);
      self.postMessage({ blob: pdf.output("blob") });
    } else if (job.kind === "pixels") {
      const encoded = encode({ data: job.data, width: job.width, height: job.height, channels: 4 });
      self.postMessage({ blob: new Blob([Uint8Array.from(encoded)], { type: "image/png" }) });
    } else {
      try {
        const scale = job.kind === "png" ? 1 : Math.min(1, 1600 / Math.max(job.bitmap.width, job.bitmap.height));
        const canvas = new OffscreenCanvas(Math.max(1, Math.round(job.bitmap.width * scale)), Math.max(1, Math.round(job.bitmap.height * scale)));
        const context = canvas.getContext("2d"); if (!context) throw new Error("Image processing is unavailable.");
        context.drawImage(job.bitmap, 0, 0, canvas.width, canvas.height);
        self.postMessage({ blob: await canvas.convertToBlob({ type: job.kind === "png" ? "image/png" : "image/webp", quality: .7 }), width: canvas.width, height: canvas.height });
      } finally { job.bitmap.close(); }
    }
  } catch { self.postMessage({ error: "Export processing failed. Try a smaller board or image." }); }
};
