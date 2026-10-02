"use client";
import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";
import { useWorkspacePreferences } from "./workspace-preferences-provider";
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const { preferences } = useWorkspacePreferences();
  return <LazyMotion features={domAnimation} strict><MotionConfig reducedMotion={preferences.reducedMotion ? "always" : "user"}>{children}</MotionConfig></LazyMotion>;
}
