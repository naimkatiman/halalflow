import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MosRev — Islamic Finance Workflow",
    short_name: "MosRev",
    description:
      "Open-source workflow engine for Islamic finance operators, mosques, zakat organizations, and Muslim SMEs.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
