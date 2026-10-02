"use client";
import dynamic from "next/dynamic";
import CanvasLoading from "../loading";
const Canvas = dynamic(() => import("./canvas"), { ssr: false, loading: () => <CanvasLoading /> });
export default Canvas;
