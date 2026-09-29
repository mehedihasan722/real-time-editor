"use client";
import Hint from "@/components/hint";
import { Button } from "@/components/ui/button";
import useDeleteLayers from "@/hooks/use-delete-layers";
import useSelectionBounds from "@/hooks/use-selection-bounds";
import { Camera, Color, LayerType, NoteLayer } from "@/types/canvas";
import { useMutation, useSelf, useStorage } from "@liveblocks/react";
import { Bold, BringToFront, CaseUpper, Link2, List, SendToBack, Strikethrough, Trash2 } from "lucide-react";
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

        const arr = liveLayerIds.toImmutable();

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

        const arr = liveLayerIds.toImmutable();

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
      return root.layers.get(selection[0])?.type ?? null;
    });
    const selectedNote = useStorage((root) => {
      if (selection?.length !== 1) return null;
      const layer = root.layers.get(selection[0]);
      return layer?.type === LayerType.Note ? layer : null;
    });
    useEffect(() => {
      const firstColor = selection
        ?.map((id) => storage?.get(id)?.fill)
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
            <button type="button" className={`note-format-button ${selectedNote?.fontFamily === "hand" ? "is-active" : ""}`} title="Toggle typeface" onClick={() => updateSelectedNote({ fontFamily: selectedNote?.fontFamily === "hand" ? "sans" : "hand" })}><CaseUpper size={17} /></button>
            <button type="button" className="note-format-size" title="Change text size" onClick={cycleNoteSize}>{selectedNote?.fontSize || "small"}</button>
            <button type="button" className={`note-format-button ${selectedNote?.bold ? "is-active" : ""}`} title="Bold" onClick={() => updateSelectedNote({ bold: !selectedNote?.bold })}><Bold size={16} /></button>
            <button type="button" className={`note-format-button ${selectedNote?.strike ? "is-active" : ""}`} title="Strikethrough" onClick={() => updateSelectedNote({ strike: !selectedNote?.strike })}><Strikethrough size={16} /></button>
            <button type="button" className={`note-format-button ${selectedNote?.link ? "is-active" : ""}`} title="Add link" onClick={editNoteLink}><Link2 size={16} /></button>
            <button type="button" className={`note-format-button ${selectedNote?.list ? "is-active" : ""}`} title="Toggle list" onClick={() => updateSelectedNote({ list: !selectedNote?.list })}><List size={16} /></button>
          </>
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
