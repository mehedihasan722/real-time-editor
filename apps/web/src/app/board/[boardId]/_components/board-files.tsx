"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { deterministicJson } from "@flowboard/utils/serialization";
import { compressImage } from "@/lib/export-jobs";
import { useAuth } from "@clerk/nextjs";
import { canEdit, workspaceRole } from "@/lib/roles";
import { useStorage } from "@liveblocks/react/suspense";
import { toast } from "sonner";
import { Layer, LayerType } from "@/types/canvas";
import { boardFileSchema, MAX_IMAGE_BYTES, MAX_IMPORT_BYTES, parseBoardFile } from "@/lib/board-portability";
import { createBoardPdf, renderBoardPng } from "@/lib/board-export";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BoardFiles({ boardId, onImport, onExportState }: { boardId: string; onImport: (layers: Layer[]) => void; onExportState?: (exporting: boolean) => void }) {
  const { orgRole } = useAuth();
  const permitted = canEdit(workspaceRole(orgRole));
  const snapshot = useStorage(root => root.layerIds.map(id => root.layers[id]).filter(Boolean));
  const [busy, setBusy] = useState(false);
  const boardInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const layers = () => boardFileSchema.parse({ version: 1, layers: snapshot }).layers;

  const exportBoard = async (format: "json" | "png" | "pdf") => {
    if (!permitted) { toast.error("An organization member role is required to export boards."); return; }
    setBusy(true);
    try {
      const data = layers();
      if (format === "json") {
        download(new Blob([deterministicJson({ version: 1, layers: data })], { type: "application/json" }), `flowboard-${boardId}.json`);
        return;
      }
      flushSync(() => onExportState?.(true));
      const content = document.querySelector("[data-export-content]");
      if (!content) throw new Error("Board is not ready to export.");
      const rendered = await renderBoardPng(content, data);
      if (format === "png") download(await (await fetch(rendered.png)).blob(), `flowboard-${boardId}.png`);
      else download(await createBoardPdf(rendered), `flowboard-${boardId}.pdf`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Export failed. Try again."); }
    finally { onExportState?.(false); setBusy(false); }
  };

  const importFile = async (file?: File) => {
    if (!permitted) return;
    if (!file) return;
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error("Board files must be smaller than 10 MB.");
      onImport(parseBoardFile(await file.text()));
    } catch { toast.error("Invalid board file. Use a Flowboard JSON export smaller than 10 MB."); }
  };

  const importImage = async (file?: File) => {
    if (!permitted) return;
    if (!file) return;
    try {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Choose a PNG, JPEG, or WebP image smaller than 10 MB.");
      const bitmap = await createImageBitmap(file);
      try {
        const result = await compressImage(bitmap);
        const src = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Image encoding failed.")); reader.readAsDataURL(result.blob); });
        const width = result.width!, height = result.height!;
        if (src.length * 0.75 > MAX_IMAGE_BYTES) throw new Error("This image is too detailed. Resize it before uploading.");
        onImport([{ type: LayerType.Image, x: 0, y: 0, width: Math.min(600, width), height: height * Math.min(1, 600 / width), fill: { r: 0, g: 0, b: 0, a: 0 }, src, alt: file.name.slice(0, 200) }]);
      } finally { bitmap.close(); }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Image could not be uploaded."); }
  };

  return <div className="absolute right-4 top-20 z-30">
    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline" disabled={busy || !permitted}>{busy ? "Exporting…" : "Board files"}</Button></DropdownMenuTrigger>
      <DropdownMenuContent><DropdownMenuItem onClick={() => void exportBoard("png")}>Export PNG</DropdownMenuItem><DropdownMenuItem onClick={() => void exportBoard("pdf")}>Export PDF</DropdownMenuItem><DropdownMenuItem onClick={() => void exportBoard("json")}>Export editable board</DropdownMenuItem><DropdownMenuItem onClick={() => boardInput.current?.click()}>Import editable board</DropdownMenuItem><DropdownMenuItem onClick={() => imageInput.current?.click()}>Upload image</DropdownMenuItem></DropdownMenuContent>
    </DropdownMenu>
    <input ref={boardInput} className="hidden" type="file" accept="application/json,.json" aria-label="Import board file" onChange={event => { void importFile(event.target.files?.[0]); event.target.value = ""; }} />
    <input ref={imageInput} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload board image" onChange={event => { void importImage(event.target.files?.[0]); event.target.value = ""; }} />
  </div>;
}
