"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SpatialScene } from "./spatial-scene";

const destinations: Record<string, { label: string; description: string; model: "cloud" | "ideas" }> = {
  "/templates": { label: "A head start for every idea.", description: "Find a starting point. Make it your own.", model: "ideas" },
  "/settings": { label: "Your space. Your way.", description: "Fine-tune your workspace and keep your team connected.", model: "cloud" },
  "/admin": { label: "Keep your team moving together.", description: "A clear view of your shared workspace.", model: "cloud" },
  "/guide": { label: "Turn a little inspiration into momentum.", description: "Discover what you can create with Flowboard.", model: "ideas" },
  "/games": { label: "Make room for a little play.", description: "A fresh perspective is one small break away.", model: "ideas" },
};

export function SpatialDashboard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const destination = destinations[pathname];
  return <div className="spatial-dashboard-content" key={pathname}>
    {destination && <section className="spatial-route-banner"><div><p className="spatial-eyebrow">FLOWBOARD / YOUR WORKSPACE</p><h2>{destination.label}</h2><p>{destination.description}</p></div><SpatialScene model={destination.model} compact /></section>}
    <div className="spatial-route-content">{children}</div>
  </div>;
}
