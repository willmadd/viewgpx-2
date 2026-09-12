import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";
import { slugify, generateCollectionIdentifier } from "@/app/lib/identifier";

const CreateCollectionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  identifier: z.string().trim().max(80).optional().or(z.literal("")),
  isPublic: z.boolean().optional().default(false),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to view your collections." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const routeIdentifier = searchParams.get("routeIdentifier") ?? undefined;

  const collections = await prisma.pages.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    select: {
      identifier: true,
      title: true,
      is_public: true,
      _count: { select: { page_routes: true } },
      page_routes: routeIdentifier
        ? { where: { route: { identifier: routeIdentifier } }, select: { route_id: true } }
        : false,
    },
  });

  return NextResponse.json({
    collections: collections.map((collection) => ({
      identifier: collection.identifier,
      title: collection.title,
      isPublic: collection.is_public,
      routeCount: collection._count.page_routes,
      hasRoute: routeIdentifier
        ? (collection.page_routes?.length ?? 0) > 0
        : undefined,
    })),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to create a collection." },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateCollectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "A collection title is required." },
      { status: 400 },
    );
  }

  const { title, description, isPublic } = parsed.data;

  let identifier: string;

  if (parsed.data.identifier) {
    identifier = slugify(parsed.data.identifier);

    if (identifier.length < 3) {
      return NextResponse.json(
        {
          error:
            "The URL identifier must be at least 3 characters, using letters, numbers and dashes.",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.pages.findUnique({
      where: { identifier },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "That URL identifier is already taken. Please choose another.",
        },
        { status: 409 },
      );
    }
  } else {
    identifier = await generateCollectionIdentifier(title);
  }

  const collection = await prisma.pages.create({
    data: {
      identifier,
      title,
      description: description || null,
      is_public: isPublic,
      user_id: user.id,
    },
  });

  return NextResponse.json({ identifier: collection.identifier });
}
