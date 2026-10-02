import Room from "@/engine/Room";
import Workspace from "@/engine/LazyWorkspace";
import type { Id } from "../../../../../convex/_generated/dataModel";
export default async function EnginePage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;
  return <Room boardId={boardId as Id<"boards">}><Workspace boardId={boardId as Id<"boards">} /></Room>;
}
