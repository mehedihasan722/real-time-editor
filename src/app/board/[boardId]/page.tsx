import React from "react";
import Canvas from "./_components/canvas";
import Room from "@/components/room";
import CanvasLoading from "./loading";

interface BoardIdPageProps {
  params: {
    boardId: string;
  };
  searchParams: { template?: string };
}
const BoardIdPage = ({ params, searchParams }: BoardIdPageProps) => {
  return (
    <Room roomId={params.boardId} template={searchParams.template} fallback={<CanvasLoading />}>
      <Canvas boardId={params.boardId} />
    </Room>
  );
};

export default BoardIdPage;
