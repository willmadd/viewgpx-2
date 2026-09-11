import type { MetadataRoute } from "next";

import { prisma } from "@/app/lib/prisma";

const BASE_URL = "https://viewgpx.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = await prisma.routes.findMany({
    orderBy: { created_at: "desc" },
    select: { identifier: true, last_viewed_at: true, created_at: true },
  });

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/search`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/sitemap`,
      changeFrequency: "daily",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/login`,
      changeFrequency: "monthly",
      priority: 0.2,
    },
  ];

  const routeEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${BASE_URL}/route/${route.identifier}`,
    lastModified: route.last_viewed_at ?? route.created_at,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...routeEntries];
}
