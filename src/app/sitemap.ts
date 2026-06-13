import type { MetadataRoute } from "next";
import { getPublishedMosques } from "@/lib/public-directory";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/masjid`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/ramadan`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const mosques = await getPublishedMosques({});
    const mosqueEntries: MetadataRoute.Sitemap = mosques.map((mosque) => ({
      url: `${base}/masjid/${mosque.org.slug}`,
      lastModified: mosque.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
    return [...staticEntries, ...mosqueEntries];
  } catch {
    // DB unavailable at build time — return static entries only
    return staticEntries;
  }
}
