import { Loader } from "lucide-react";
import React from "react";
import { ToolbarSkeleton } from "./_components/toolbar";
import { ParticipantsSkeleton } from "./_components/participants";
import { InfoSkeleton } from "./_components/info";

const CanvasLoading = () => {
  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none flex items-center justify-center">
      <Loader className="h-6 w-6 text-muted-foreground animate-spin" />
      <InfoSkeleton />
      <ParticipantsSkeleton />
      <ToolbarSkeleton />
    </main>
  );
};

export default CanvasLoading;
