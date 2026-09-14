import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Flowboard — Visual Workspace",
    short_name: "Flowboard",
    description: "Collaborative visual boards for teams.",
    start_url: "/",
    display: "standalone",
    background_color: "#10172f",
    theme_color: "#172554",
    orientation: "any",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" }
    ]
  };
}
