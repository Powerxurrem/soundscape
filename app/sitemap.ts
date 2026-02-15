import { MetadataRoute } from "next";

const base = "https://www.soundscape.run";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/mixer`, lastModified: now },
    { url: `${base}/autopilot`, lastModified: now },
    { url: `${base}/pricing`, lastModified: now },
    { url: `${base}/about`, lastModified: now },
    { url: `${base}/terms`, lastModified: now },
  ];
}
