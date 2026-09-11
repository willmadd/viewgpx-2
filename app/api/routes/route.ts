import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";
import { uploadGpxToBunny } from "@/app/lib/bunny";
import { generateRouteIdentifier } from "@/app/lib/identifier";

const SaveRouteSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  gpx: z.string().min(1).max(20 * 1024 * 1024),
});

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
    },
  });

  return NextResponse.json({ routes });
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

  const { title, description, gpx } = parsed.data;

  const contents = Buffer.from(gpx, "utf8");
  const sha256 = crypto.createHash("sha256").update(contents).digest("hex");
  const identifier = await generateRouteIdentifier(title);
  const storageKey = `gpx/${identifier}.gpx`;

  await uploadGpxToBunny(storageKey, contents);

  const route = await prisma.routes.create({
    data: {
      identifier,
      title,
      description: description || null,
      gpx_storage_key: storageKey,
      gpx_size_bytes: BigInt(contents.length),
      gpx_sha256: sha256,
      user_id: user?.id ?? null,
    },
  });

  return NextResponse.json({ identifier: route.identifier });
}
