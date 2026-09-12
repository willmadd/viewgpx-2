import { NextResponse } from "next/server";

import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";

type RouteParams = { identifier: string; routeIdentifier: string };

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { identifier, routeIdentifier } = await params;

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
    where: { identifier: routeIdentifier },
    select: { id: true },
  });

  if (!route) {
    return NextResponse.json({ error: "Route not found." }, { status: 404 });
  }

  await prisma.page_routes.deleteMany({
    where: { page_id: collection.id, route_id: route.id },
  });

  return NextResponse.json({ ok: true });
}
