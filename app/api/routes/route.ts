import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";
import { uploadGpxToBunny, uploadThumbnailToBunny } from "@/app/lib/bunny";
import { generateRouteIdentifier } from "@/app/lib/identifier";
import { getStartCoordinates } from "@/app/lib/gpxCoordinates";
import { isRouteType } from "@/app/lib/routeTypes";
import { getThumbnailUrl } from "@/app/lib/thumbnail";

const PNG_DATA_URL_PATTERN = /^data:image\/png;base64,([a-zA-Z0-9+/=]+)$/;

const SaveRouteSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  type: z.string().trim().max(40).optional().or(z.literal("")),
  thumbnail: z.string().trim().max(2_000_000).optional().or(z.literal("")),
  ogImage: z.string().trim().max(8_000_000).optional().or(z.literal("")),
  gpx: z.string().min(1).max(20 * 1024 * 1024),
});

const uploadPngIfPresent = async (
  dataUrl: string | undefined,
  storageKey: string,
): Promise<string | null> => {
  const match = dataUrl ? PNG_DATA_URL_PATTERN.exec(dataUrl) : null;

  if (!match) {
    return null;
  }

  try {
    await uploadThumbnailToBunny(storageKey, Buffer.from(match[1], "base64"));
    return storageKey;
  } catch {
    // Thumbnails and OG images are a non-critical enhancement — the route
    // still saves.
    return null;
  }
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to view your saved routes." },
      { status: 401 },
    );
  }

  const routes = await prisma.routes.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    select: {
      identifier: true,
      title: true,
      description: true,
      created_at: true,
      view_count: true,
      thumbnail_key: true,
    },
  });

  return NextResponse.json({
    routes: routes.map(({ thumbnail_key, ...route }) => ({
      ...route,
      thumbnailUrl: getThumbnailUrl(thumbnail_key),
    })),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json().catch(() => null);
  const parsed = SaveRouteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "A route title and GPX file are required." },
      { status: 400 },
    );
  }

  const { title, description, type, thumbnail, ogImage, gpx } = parsed.data;
  const routeType = type && isRouteType(type) ? type : null;

  const contents = Buffer.from(gpx, "utf8");
  const sha256 = crypto.createHash("sha256").update(contents).digest("hex");

  const existingRoute = await prisma.routes.findFirst({
    where: user ? { gpx_sha256: sha256, user_id: user.id } : { gpx_sha256: sha256 },
    select: { identifier: true },
  });

  if (existingRoute) {
    return NextResponse.json({
      identifier: existingRoute.identifier,
      duplicate: true,
    });
  }

  const identifier = await generateRouteIdentifier(title);
  const storageKey = `gpx/${identifier}.gpx`;

  await uploadGpxToBunny(storageKey, contents);

  const [thumbnailKey, ogImageKey] = await Promise.all([
    uploadPngIfPresent(thumbnail, `thumbnails/${identifier}.png`),
    uploadPngIfPresent(ogImage, `og-images/${identifier}.png`),
  ]);

  const route = await prisma.routes.create({
    data: {
      identifier,
      title,
      description: description || null,
      type: routeType,
      gpx_storage_key: storageKey,
      gpx_size_bytes: BigInt(contents.length),
      gpx_sha256: sha256,
      thumbnail_key: thumbnailKey,
      og_image_key: ogImageKey,
      user_id: user?.id ?? null,
    },
  });

  // start_location is a PostGIS geography column, which Prisma exposes as
  // Unsupported and cannot write through the normal client.
  const startCoordinates = getStartCoordinates(gpx);

  if (startCoordinates) {
    await prisma.$executeRaw`
      UPDATE public.routes
      SET start_location = extensions.ST_SetSRID(
        extensions.ST_MakePoint(${startCoordinates.longitude}, ${startCoordinates.latitude}),
        4326
      )::extensions.geography
      WHERE id = ${route.id}
    `;
  }

  return NextResponse.json({ identifier: route.identifier });
}
