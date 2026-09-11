import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@/app/lib/prisma";
import RouteMapLoader from "./RouteMapLoader";

type RouteParams = { identifier: string };

const getRoute = async (identifier: string) => {
  const route = await prisma.routes.findUnique({ where: { identifier } });

  if (!route || !route.gpx_storage_key) {
    return null;
  }

  const cdnHost = process.env.NEXT_PUBLIC_GPX_CDN_URL;

  if (!cdnHost) {
    throw new Error("NEXT_PUBLIC_GPX_CDN_URL is not configured");
  }

  const gpxResponse = await fetch(
    `https://${cdnHost}/${route.gpx_storage_key}`,
    { cache: "no-store" },
  );

  if (!gpxResponse.ok) {
    return null;
  }

  const gpxFile = await gpxResponse.text();

  const updated = await prisma.routes.update({
    where: { identifier },
    data: {
      view_count: { increment: 1 },
      last_viewed_at: new Date(),
    },
    select: { view_count: true },
  });

  return {
    identifier: route.identifier,
    title: route.title,
    description: route.description,
    gpxFile,
    viewCount: updated.view_count,
  };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { identifier } = await params;
  const route = await prisma.routes.findUnique({
    where: { identifier },
    select: { title: true, description: true },
  });

  if (!route) {
    return { title: "Route not found | View GPX" };
  }

  return {
    title: `${route.title || "Route"} | Route Information `,
    description:
      route.description ||
      `View, Download and share ${route.title || "Route"} information and GPX file on View GPX.`,
  };
}

export default async function RoutePage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { identifier } = await params;
  const route = await getRoute(identifier);

  if (!route) {
    notFound();
  }

  return (
    <RouteMapLoader
      identifier={route.identifier}
      title={route.title}
      description={route.description}
      gpxFile={route.gpxFile}
      viewCount={route.viewCount}
    />
  );
}
