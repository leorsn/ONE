import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://never-ruddy.vercel.app/", changeFrequency: "monthly", priority: 1 },
    { url: "https://never-ruddy.vercel.app/explore", changeFrequency: "monthly", priority: 0.9 },
  ];
}
