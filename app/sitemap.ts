import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://www.soundscape.run/", lastModified: new Date() },
    { url: "https://www.soundscape.run/mixer", lastModified: new Date() },
    { url: "https://www.soundscape.run/autopilot", lastModified: new Date() },
    { url: "https://www.soundscape.run/pricing", lastModified: new Date() },
    { url: "https://www.soundscape.run/about", lastModified: new Date() },
  ];
}
