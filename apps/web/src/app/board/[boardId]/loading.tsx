import { ToolbarSkeleton } from "./_components/toolbar";
import { ParticipantsSkeleton } from "./_components/participants";
import { InfoSkeleton } from "./_components/info";
export default function CanvasLoading() {
  return <main className="h-full w-full relative board-canvas future-board touch-none overflow-hidden" aria-label="Loading board">
    <InfoSkeleton /><ParticipantsSkeleton /><ToolbarSkeleton />
    <div className="board-starter board-starter--skeleton" aria-hidden="true">
      <div className="board-skeleton h-5 w-40 rounded-full" />
      <div className="board-skeleton mt-5 h-8 w-4/5 rounded-lg" />
      <div className="board-skeleton mt-8 h-28 w-full rounded-xl" />
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {[96, 120, 104, 132].map((width) => <div key={width} className="board-skeleton h-8 rounded-full" style={{ width }} />)}
      </div>
    </div>
    <div className="board-skeleton absolute bottom-3 right-3 h-12 w-[250px] rounded-xl" />
  </main>;
}
