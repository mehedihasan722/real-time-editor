import { cn, colorToCss } from "@/lib/utils";
import { TextLayer } from "@/types/canvas";
import { useMutation } from "@liveblocks/react";
import React, { useEffect, useRef, useState } from "react";


const calculateFontSize = (width: number, height: number) => {
  const maxFontSize = 96;
  const scaleFactor = 0.5;
  const fontSizeBasedOnHeight = height * scaleFactor;
  const fontSizeBasedOnWidth = width * scaleFactor;

  return Math.min(fontSizeBasedOnHeight, fontSizeBasedOnWidth, maxFontSize);
};

interface TextProps {
  id: string;
  layer: TextLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

const Text = ({ layer, onPointerDown, id, selectionColor }: TextProps) => {
  const { x, y, width, height, fill, value } = layer;
  const editorRef = useRef<HTMLDivElement>(null);

  const [hasModified, setHasModified] = useState(false);

  const updateValue = useMutation(({ storage }, newValue: string) => {
    const liveLayers = storage.get("layers");

    liveLayers.get(id)?.set("value", newValue);
  }, []);

  const handleFocus = () => {
    if (!hasModified && editorRef.current?.textContent === "Text") {
      editorRef.current.textContent = "";
    }
  };

  useEffect(() => {
    if (editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.textContent = value || "Text";
    }
  }, [value]);
  return (
    <foreignObject
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={(e) => onPointerDown(e, id)}
      style={{
        outline: selectionColor ? `1px solid ${selectionColor}` : "none",
      }}
    >
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(event) => {
          setHasModified(true);
          updateValue(event.currentTarget.textContent ?? "");
        }}
        onFocus={handleFocus}
        className={cn(
          "canvas-text h-full w-full flex items-center justify-center text-center drop-shadow-md outline-none",
          "font-hand"
        )}
        style={{
          fontSize: calculateFontSize(width, height),
          color: !fill || (fill.r === 0 && fill.g === 0 && fill.b === 0) || (fill.r === 30 && fill.g === 41 && fill.b === 59) ? "var(--canvas-text-foreground)" : colorToCss(fill),
        }}
      />
    </foreignObject>
  );
};

export default Text;
