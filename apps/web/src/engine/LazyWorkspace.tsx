"use client";
import dynamic from "next/dynamic";
import { CanvasSkeleton } from "./Room";
export default dynamic(() => import("./CanvasWorkspace"), { ssr: false, loading: CanvasSkeleton });
