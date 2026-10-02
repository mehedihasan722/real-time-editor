import type { Layer } from "@/types/canvas";
import { getBoardBounds } from "./board-portability";
import { runExportJob } from "./export-jobs";

export async function renderBoardPng(content: Element, layers: readonly Layer[]) {
  const bounds = getBoardBounds(layers);
  const scale = Math.min(1, 4096 / Math.max(bounds.width, bounds.height));
  const width = Math.ceil(bounds.width * scale), height = Math.ceil(bounds.height * scale);
  const surface = content.closest(".board-canvas");
  const backgroundColor = surface ? getComputedStyle(surface).backgroundColor : "#ffffff";
  const container = document.createElement("div");
  Object.assign(container.style, { position: "fixed", left: "-20000px", top: "0", width: `${width}px`, height: `${height}px`, background: backgroundColor });
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", String(width)); svg.setAttribute("height", String(height));
  svg.setAttribute("viewBox", `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);
  const clone = content.cloneNode(true) as Element;
  // SVG subtrees are serialized as-is by html-to-image. Capture their screen styles first.
  const originals = [content, ...content.querySelectorAll("*")];
  const copies = [clone, ...clone.querySelectorAll("*")];
  for (let index = 0; index < originals.length; index++) {
    const original = originals[index];
    const style = getComputedStyle(original);
    const copy = copies[index] as HTMLElement | SVGElement;
    for (const property of style) copy.style.setProperty(property, style.getPropertyValue(property));
    copy.removeAttribute("contenteditable");
    if (index % 100 === 99) await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
  }
  clone.querySelectorAll("[data-export-selection]").forEach(node => node.remove());
  svg.append(clone); container.append(svg); document.body.append(container);
  try {
    const { toCanvas } = await import("html-to-image");
    const canvas = await toCanvas(container, { width, height, pixelRatio: 1, backgroundColor, skipFonts: true, style: { position: "static", left: "0", top: "0" } });
    let result;
    if (typeof OffscreenCanvas === "undefined") {
      const pixels = canvas.getContext("2d")!.getImageData(0, 0, width, height).data;
      result = await runExportJob({ kind: "pixels", data: pixels, width, height }, [pixels.buffer]);
    } else {
      const bitmap = await createImageBitmap(canvas);
      result = await runExportJob({ kind: "png", bitmap }, [bitmap]);
    }
    const png = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("PNG encoding failed.")); reader.readAsDataURL(result.blob); });
    return { png, width, height };
  } finally { container.remove(); }
}

export async function createBoardPdf({ png, width, height }: { png: string; width: number; height: number }) {
  return (await runExportJob({ kind: "pdf", png, width, height })).blob;
}
