import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Motion Community OS",
    short_name: "Motion OS",
    description: "Private relationship intelligence for Motion and Motion Foundation.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f1e6",
    theme_color: "#101725",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
