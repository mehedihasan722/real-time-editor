"use client";
import Hint from "@/components/hint";
import { Button } from "@/components/ui/button";
import useDeleteLayers from "@/hooks/use-delete-layers";
import useSelectionBounds from "@/hooks/use-selection-bounds";
import { Camera, Color, LayerType, NoteLayer, ShapeLayer } from "@/types/canvas";
import { useMutation, useSelf, useStorage } from "@liveblocks/react";
import { Bold, BringToFront, Link2, List, RotateCcw, RotateCw, SendToBack, Strikethrough, Trash2 } from "lucide-react";
import React, { memo, useEffect, useState } from "react";
import ColorPicker from "./color-picker";
import { LiveObject } from "@liveblocks/client";
import { toast } from "sonner";

interface SelectionToolsProps {
  camera: Camera;
  zoom: number;
  setLastUsedColor: (color: Color) => void;
}
const SelectionTools = memo(
  ({ camera, zoom, setLastUsedColor }: SelectionToolsProps) => {
    const selection = useSelf((me) => me.presence.selection);
    const [selectionColor, setSelectionColor] = useState<Color>({
      a: 1,
      b: 0,
      g: 0,
      r: 0,
    });
    const [colorPickerVisible, setColorPickerVisible] = useState(false);

    const moveToFront = useMutation(
      ({ storage }) => {
        const liveLayerIds = storage.get("layerIds");
        const indices: number[] = [];

        const arr = liveLayerIds.toJSON();

        for (let i = 0; i < arr.length; i++) {
          if (selection?.includes(arr[i])) {
            indices.push(i);
          }
        }

        for (let i = indices.length - 1; i >= 0; i--) {
          liveLayerIds.move(
            indices[i],
            arr.length - 1 - (indices.length - 1 - i)
          );
        }
      },
      [selection]
    );

    const moveToBack = useMutation(
      ({ storage }) => {
        const liveLayerIds = storage.get("layerIds");
        const indices: number[] = [];

        const arr = liveLayerIds.toJSON();

        for (let i = 0; i < arr.length; i++) {
          if (selection?.includes(arr[i])) {
            indices.push(i);
          }
        }

        for (let i = 0; i < indices.length; i++) {
          liveLayerIds.move(indices[i], i);
        }
      },
      [selection]
    );

    const storage = useStorage((root) => root.layers);
    const selectedLayerType = useStorage((root) => {
      if (selection?.length !== 1) return null;
      return root.layers[selection[0]]?.type ?? null;
    });
    const selectedNote = useStorage((root) => {
      if (selection?.length !== 1) return null;
      const layer = root.layers[selection[0]];
      return layer?.type === LayerType.Note ? layer : null;
    });
    const selectedRotation = useStorage((root) => {
      if (selection?.length !== 1) return 0;
      const layer = root.layers[selection[0]];
      return layer?.type === LayerType.Note || layer?.type === LayerType.Shape ? layer.rotation ?? 0 : 0;
    });
    useEffect(() => {
      const firstColor = selection
        ?.map((id) => storage?.[id]?.fill)
        .find(isValidColor);
      setSelectionColor(firstColor ?? { r: 0, g: 0, b: 0, a: 1 });
    }, [selection, storage]);

    // Function to validate color format
    function isValidColor(color: any) {
      return (
        color &&
        typeof color === "object" &&
        "r" in color &&
        "g" in color &&
        "b" in color &&
        "a" in color
      );
    }

    const setFill = useMutation(
      ({ storage }, fill: Color) => {
        const liveLayers = storage.get("layers");
        setLastUsedColor(fill);
        selection?.forEach((id) => {
          liveLayers.get(id)?.set("fill", fill);
        });
      },
      [selection, setLastUsedColor]
    );

    const updateSelectedNote = useMutation(
      ({ storage }, patch: Partial<NoteLayer>) => {
        if (selection?.length !== 1) return;
        const note = storage.get("layers").get(selection[0]) as LiveObject<NoteLayer> | undefined;
        if (note?.get("type") === LayerType.Note) note.update(patch);
      },
      [selection]
    );

    const updateSelectedRotation = useMutation(
      ({ storage }, rotation: number) => {
        if (selection?.length !== 1) return;
        const layer = storage.get("layers").get(selection[0]) as LiveObject<NoteLayer | ShapeLayer> | undefined;
        if (!layer) return;
        const type = layer.get("type");
        if (type === LayerType.Note || type === LayerType.Shape) layer.set("rotation", rotation);
      },
      [selection],
    );

    const cycleNoteSize = () => {
      const current = selectedNote?.fontSize || "small";
      updateSelectedNote({ fontSize: current === "small" ? "medium" : current === "medium" ? "large" : "small" });
    };

    const editNoteLink = () => {
      const entered = window.prompt("Link this note to a URL", selectedNote?.link || "https://");
      if (entered === null) return;
      if (!entered.trim()) { updateSelectedNote({ link: "" }); return; }
      try {
        const url = new URL(entered.includes("://") ? entered : `https://${entered}`);
        updateSelectedNote({ link: url.toString() });
      } catch {
        toast.error("Enter a valid URL");
      }
    };

    const deleteLayers = useDeleteLayers();
    const selectionBounds = useSelectionBounds();
    const rotation = selectedRotation ?? 0;

    useEffect(() => {
      setColorPickerVisible(false);
    }, [selection]);

    if (!selectionBounds) {
      return null;
    }

    const x = (selectionBounds.width / 2 + selectionBounds.x) * zoom + camera.x;
    const y = selectionBounds.y * zoom + camera.y;
    return (
      <div
        className={`selection-tools absolute flex select-none ${selectedLayerType === LayerType.Note ? "selection-tools--note" : ""}`}
        style={{
          transform: `translate(
            calc(${x}px - 50%),
            calc(${y - 16}px - 100%)
          )`,
        }}
      >
        {selectedLayerType === LayerType.Note && (
          <>
            <span className="selection-tools__label">Sticky note</span>
            <select
              className="note-format-font"
              aria-label="Sticky note font style"
              title="Font style"
              value={selectedNote?.fontFamily || "calibri"}
              onChange={(event) => updateSelectedNote({ fontFamily: event.target.value as NoteLayer["fontFamily"] })}
            >
              <option value="arial">Arial</option>
              <option value="calibri">Calibri</option>
              <option value="times">Times New Roman</option>
              <option value="georgia">Georgia</option>
              <option value="verdana">Verdana</option>
              <option value="courier">Courier New</option>
              <option value="comic">Comic Sans</option>
            </select>
            <button type="button" className="note-format-size" title="Change text size" onClick={cycleNoteSize}>{selectedNote?.fontSize || "small"}</button>
            <button type="button" className={`note-format-button ${selectedNote?.bold ? "is-active" : ""}`} title="Bold" onClick={() => updateSelectedNote({ bold: !selectedNote?.bold })}><Bold size={16} /></button>
            <button type="button" className={`note-format-button ${selectedNote?.strike ? "is-active" : ""}`} title="Strikethrough" onClick={() => updateSelectedNote({ strike: !selectedNote?.strike })}><Strikethrough size={16} /></button>
            <button type="button" className={`note-format-button ${selectedNote?.link ? "is-active" : ""}`} title="Add link" onClick={editNoteLink}><Link2 size={16} /></button>
            <button type="button" className={`note-format-button ${selectedNote?.list ? "is-active" : ""}`} title="Toggle list" onClick={() => updateSelectedNote({ list: !selectedNote?.list })}><List size={16} /></button>
          </>
        )}
        {(selectedLayerType === LayerType.Note || selectedLayerType === LayerType.Shape) && (
          <div className="rotation-control" title="Rotate selected object">
            <button type="button" aria-label="Rotate left 15 degrees" onClick={() => updateSelectedRotation(Math.max(-180, rotation - 15))}><RotateCcw size={15} /></button>
            <input aria-label="Rotation in degrees" type="range" min="-180" max="180" step="5" value={rotation} onChange={(event) => updateSelectedRotation(Number(event.target.value))} />
            <button type="button" aria-label="Rotate right 15 degrees" onClick={() => updateSelectedRotation(Math.min(180, rotation + 15))}><RotateCw size={15} /></button>
            <button type="button" className="rotation-control__value" aria-label="Reset rotation" title="Reset rotation" onClick={() => updateSelectedRotation(0)}>{rotation}°</button>
          </div>
        )}
        <ColorPicker
          selectionColor={selectionColor}
          onChange={setFill}
          visible={colorPickerVisible}
          toggleColorPicker={() => setColorPickerVisible(!colorPickerVisible)}
        />
        <div className="flex flex-col gap-y-0.5">
          <Hint label="Bring to front">
            <Button onClick={moveToFront} variant="board" size="icon">
              <BringToFront />
            </Button>
          </Hint>
          <Hint label="Send to back" side="bottom">
            <Button onClick={moveToBack} variant="board" size="icon">
              <SendToBack />
            </Button>
          </Hint>
        </div>
        <div className="flex items-center pl-2 ml-2 border-l border-neutral-200">
          <Hint label="Delete">
            <Button variant="board" size="icon" onClick={deleteLayers}>
              <Trash2 />
            </Button>
          </Hint>
        </div>
      </div>
    );
  }
);

SelectionTools.displayName = "SelectionTools";
export default SelectionTools;
