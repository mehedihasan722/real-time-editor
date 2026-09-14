"use client";

import Hint from "@/components/hint";
import { Color, Position } from "@/types/canvas";
import { ColorPicker as ReactColorPicker, themes } from "react-pick-color";
import React, { useEffect, useState } from "react";

interface ColorPickerProps {
  onChange: (color: Color) => void;
  selectionColor: Color;
  visible: boolean;
  toggleColorPicker: () => void; // Add toggleColorPicker prop
}

const ColorPicker = ({
  onChange,
  selectionColor,
  visible,
  toggleColorPicker,
}: ColorPickerProps) => {
  const [selectedColor, setSelectedColor] = useState(selectionColor);

  const [position, setPosition] = useState<Position>({
    top: "-310px",
    left: "-100px",
    right: "40px",
    bottom: "40px",
  });

  useEffect(() => {
    setSelectedColor(selectionColor);
  }, [selectionColor]);

  const handleColorChange = (color: Color) => {
    setSelectedColor(color);
    onChange(color);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center max-w-[164px] pr-2 mr-2 border-r border-neutral-200 relative">
      <Hint label="Color Picker">
        <button
          className=" w-8 h-8 rounded-full border border-gray-400 flex items-center justify-center relative"
          onClick={toggleColorPicker}
          style={{
            background:
              "conic-gradient(#ff0000, #ff0000 60deg, #00ff00 60deg, #00ff00 120deg, #0000ff 120deg, #0000ff 180deg, #ffff00 180deg, #ffff00 240deg, #800080 240deg, #800080 300deg, #00ffff 300deg, #00ffff)",
          }}
        />
      </Hint>
      {visible && (
        <div className="absolute z-10" style={position}>
          <ReactColorPicker
            color={selectedColor}
            theme={themes.light}
            onChange={(changedColor) => handleColorChange(changedColor.rgb)}
          />
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
