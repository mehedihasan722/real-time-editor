import { Loader } from "lucide-react";
import React from "react";
import Info from "./_components/info";
import Participants from "./_components/participants";
import Toolbar from "./_components/toolbar";

const CanvasLoading = () => {
  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none flex items-center justify-center">
      <Loader className="h-6 w-6 text-muted-foreground animate-spin" />
      <Info.Skeleton />
      <Participants.Skeleton />
      <Toolbar.Skeleton />
    </main>
  );
};

export default CanvasLoading;
