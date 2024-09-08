"use client";

import React from "react";
import Info from "./info";
import Participants from "./participants";
import Toolbar from "./toolbar";
import { useSelf } from "@liveblocks/react/suspense";
interface CanvasProps {
  boardId: string;
}
const Canvas = ({ boardId }: CanvasProps) => {
  const info = useSelf((me) => me.info);
  console.log("🚀 ~ Canvas ~ info:", info);

  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none">
      <Info />
      <Participants />
      <Toolbar />
    </main>
  );
};

export default Canvas;
