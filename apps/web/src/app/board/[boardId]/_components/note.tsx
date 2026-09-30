import { NoteLayer } from "@/types/canvas";
import { useMutation } from "@liveblocks/react";
import React, { useEffect, useRef } from "react";
import { colorToCss, getContrastingTextColor } from "@/lib/utils";


const calculateFontSize = (width: number, height: number) => {
  return Math.max(14, Math.min(width, height) * 0.075, Math.min(32, height * 0.12));
};

interface NoteProps {
  id: string;
  layer: NoteLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

const Note = ({ layer, onPointerDown, id, selectionColor }: NoteProps) => {
  const { x, y, width, height, fill, value, author, fontFamily = "calibri", fontSize = "small", bold, strike, list, link } = layer;
  const editorRef = useRef<HTMLDivElement>(null);

  const updateValue = useMutation(({ storage }, newValue: string) => {
    const liveLayers = storage.get("layers");

    liveLayers.get(id)?.set("value", newValue);
  }, []);

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.textContent = value ?? "";
    }
  }, [value]);

  const backgroundColor = fill ? colorToCss(fill) : "rgb(177, 239, 188)";
  const textColor = fill ? getContrastingTextColor(fill) : "rgb(42, 64, 52)";
  const sizeMultiplier = fontSize === "large" ? 1.42 : fontSize === "medium" ? 1.2 : 1;

  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => onPointerDown(e, id)}
      style={{
        overflow: "visible",
      }}
      className="figjam-note-object"
    >
      <div
        className="figjam-note"
        data-selected={selectionColor ? "true" : "false"}
        style={{
          backgroundColor,
          color: textColor,
          outlineColor: selectionColor,
        }}
      >
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={(event) => updateValue(event.currentTarget.textContent ?? "")}
          aria-label="Sticky note text"
          data-placeholder="Type anything, @mention anyone"
          className="figjam-note__content"
          style={{
            fontSize: calculateFontSize(width, height) * sizeMultiplier,
            fontFamily: {
              arial: "Arial, Helvetica, sans-serif",
              calibri: "Calibri, Carlito, Arial, sans-serif",
              times: "'Times New Roman', Times, serif",
              georgia: "Georgia, serif",
              verdana: "Verdana, Geneva, sans-serif",
              courier: "'Courier New', Courier, monospace",
              comic: "'Comic Sans MS', 'Segoe Print', cursive",
            }[fontFamily],
            fontWeight: bold ? 800 : 500,
            textDecoration: strike ? "line-through" : "none",
            display: list ? "list-item" : "block",
            listStylePosition: "inside",
          }}
        />
        <span className="figjam-note__author">{author || "Team note"}</span>
        {link && <a className="figjam-note__link" href={link} target="_blank" rel="noreferrer" onPointerDown={(event) => event.stopPropagation()}>Link</a>}
      </div>
    </foreignObject>
  );
};

export default Note;
