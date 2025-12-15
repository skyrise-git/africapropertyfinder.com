import type { MetadataRoute } from "next";
import { marketingSite } from "@/lib/config";

export default function manifest(): MetadataRoute.Manifest {
  const baseUrl = marketingSite.url;

  return {
    name: marketingSite.name,
    short_name: marketingSite.name.replace(" ⚡️", ""),
    description: marketingSite.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7b2d2d",
    icons: [
      {
        src: "/icon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        src: "/icon-16x16.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["productivity", "business"],
    lang: "en",
    orientation: "portrait-primary",
    scope: "/",
    id: baseUrl,
  };
}
