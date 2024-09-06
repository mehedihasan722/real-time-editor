import React from "react";
import Canvas from "./_components/canvas";

interface BoardIdPageProps {
  params: {
    boardId: string;
  };
}
const BoardIdPage = () => {
  return <Canvas />;
};

export default BoardIdPage;
