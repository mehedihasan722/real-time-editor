import { NoteLayer } from "@/types/canvas";
import ContentEditable, { ContentEditableEvent } from "react-contenteditable";
import { useMutation } from "@liveblocks/react";
import { Kalam } from "next/font/google";
import React, { useEffect, useState } from "react";
import { cn, colorToCss, getContrastingTextColor } from "@/lib/utils";

const font = Kalam({
  subsets: ["latin"],
  weight: ["400"],
});

const calculateFontSize = (width: number, height: number) => {
  const maxFontSize = 96;
  const scaleFactor = 0.15;
  const fontSizeBasedOnHeight = height * scaleFactor;
  const fontSizeBasedOnWidth = width * scaleFactor;

  return Math.min(fontSizeBasedOnHeight, fontSizeBasedOnWidth, maxFontSize);
};

interface NoteProps {
  id: string;
  layer: NoteLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

const Note = ({ layer, onPointerDown, id, selectionColor }: NoteProps) => {
  const { x, y, width, height, fill, value } = layer;
  const [newValue, setNewValue] = useState("Text");

  const [hasModified, setHasModified] = useState(false);

  const updateValue = useMutation(({ storage }, newValue: string) => {
    const liveLayers = storage.get("layers");

    setNewValue(newValue);
    liveLayers.get(id)?.set("value", newValue);
  }, []);

  const handleContentChange = (e: ContentEditableEvent) => {
    const updatedValue = e.target.value;

    setHasModified(true);
    updateValue(updatedValue);
  };

  const handleFocus = () => {
    if (!hasModified && newValue === "Text") {
      setNewValue(""); //
    }
  };

  useEffect(() => {
    if (value) {
      setNewValue(value);
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
        backgroundColor: fill ? colorToCss(fill) : "rgba(0,0,0,1)",
      }}
      className="shadow-md drop-shadow-xl"
    >
      <ContentEditable
        html={newValue}
        onChange={handleContentChange}
        onFocus={handleFocus}
        className={cn(
          "h-full w-full flex items-center justify-center text-center outline-none",
          font.className
        )}
        style={{
          fontSize: calculateFontSize(width, height),
          color: fill ? getContrastingTextColor(fill) : "rgba(0,0,0,1)",
        }}
      />
    </foreignObject>
  );
};

export default Note;
