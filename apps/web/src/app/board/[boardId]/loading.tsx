import BoardLoadingAnimation from "@/components/board-loading-animation";
import { ToolbarSkeleton } from "./_components/toolbar";
import { ParticipantsSkeleton } from "./_components/participants";
import { InfoSkeleton } from "./_components/info";
export default function CanvasLoading() {
  return <main className="h-full w-full relative board-canvas touch-none flex items-center justify-center">
    <BoardLoadingAnimation label="Opening your board" />
    <InfoSkeleton /><ParticipantsSkeleton /><ToolbarSkeleton />
  </main>;
}
