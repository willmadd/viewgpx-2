import "server-only";

import { prisma } from "@/app/lib/prisma";
import { getThumbnailUrl } from "@/app/lib/thumbnail";

export type NearbyRoute = {
  identifier: string;
  title: string | null;
  type: string | null;
  thumbnailUrl: string | null;
  distanceKm: number;
};

type NearbyRouteRow = {
  identifier: string;
  title: string | null;
  type: string | null;
  thumbnail_key: string | null;
  location_key: string;
  distance_metres: number;
};

// Fetched before de-duplicating so that routes sharing an identical start
// point (e.g. the same start/finish line) still leave enough candidates to
// fill out RESULT_LIMIT distinct locations.
const CANDIDATE_LIMIT = 30;
const RESULT_LIMIT = 6;

export async function getNearbyRoutes(
  identifier: string,
): Promise<NearbyRoute[]> {
  const rows = await prisma.$queryRaw<NearbyRouteRow[]>`
    SELECT
      candidate.identifier,
      candidate.title,
      candidate.type,
      candidate.thumbnail_key,
      ST_AsText(candidate.start_location) AS location_key,
      candidate.start_location <-> origin.start_location AS distance_metres
    FROM public.routes candidate, (
      SELECT start_location FROM public.routes WHERE identifier = ${identifier}
    ) AS origin
    WHERE candidate.identifier != ${identifier}
      AND candidate.start_location IS NOT NULL
      AND origin.start_location IS NOT NULL
    ORDER BY candidate.start_location <-> origin.start_location
    LIMIT ${CANDIDATE_LIMIT}
  `;

  const seenLocations = new Set<string>();
  const nearby: NearbyRoute[] = [];

  for (const row of rows) {
    if (seenLocations.has(row.location_key)) {
      continue;
    }

    seenLocations.add(row.location_key);

    nearby.push({
      identifier: row.identifier,
      title: row.title,
      type: row.type,
      thumbnailUrl: getThumbnailUrl(row.thumbnail_key),
      distanceKm: Number(row.distance_metres) / 1000,
    });

    if (nearby.length >= RESULT_LIMIT) {
      break;
    }
  }

  return nearby;
}
