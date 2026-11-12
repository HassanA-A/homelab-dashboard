import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fitness OS",
    short_name: "Fitness",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0b0d",
    theme_color: "#0a0b0d",
    icons: [],
  };
}
