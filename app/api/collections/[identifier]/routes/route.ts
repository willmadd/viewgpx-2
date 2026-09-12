import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";

const AddRouteSchema = z.object({
  routeIdentifier: z.string().trim().min(1),
});

type RouteParams = { identifier: string };

export async function POST(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { identifier } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to edit this collection." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = AddRouteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "A route is required." }, { status: 400 });
  }

  const collection = await prisma.pages.findUnique({
    where: { identifier },
    select: { id: true, user_id: true },
  });

  if (!collection || collection.user_id !== user.id) {
    return NextResponse.json(
      { error: "Collection not found." },
      { status: 404 },
    );
  }

  const route = await prisma.routes.findUnique({
    where: { identifier: parsed.data.routeIdentifier },
    select: { id: true, user_id: true },
  });

  if (!route || route.user_id !== user.id) {
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  }

  await prisma.page_routes.upsert({
    where: { page_id_route_id: { page_id: collection.id, route_id: route.id } },
    create: { page_id: collection.id, route_id: route.id },
    update: {},
  });

  return NextResponse.json({ ok: true });
}
