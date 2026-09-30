import React from "react";
import Canvas from "./_components/canvas";
import Room from "@/components/room";
import CanvasLoading from "./loading";

interface BoardIdPageProps {
  params: Promise<{
    boardId: string;
  }>;
  searchParams: Promise<{ template?: string }>;
}
const BoardIdPage = async ({ params, searchParams }: BoardIdPageProps) => {
  const [{ boardId }, { template }] = await Promise.all([params, searchParams]);

  return (
    <Room roomId={boardId} template={template} fallback={<CanvasLoading />}>
      <Canvas boardId={boardId} />
    </Room>
  );
};

export default BoardIdPage;
