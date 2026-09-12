import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";
import { slugify } from "@/app/lib/identifier";

const UpdateCollectionSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  identifier: z.string().trim().min(1).max(80),
  isPublic: z.boolean().optional().default(false),
});

type RouteParams = { identifier: string };

export async function PATCH(
  request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { identifier: currentIdentifier } = await params;

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
    where: { identifier: currentIdentifier },
    select: { id: true, user_id: true },
  });

  if (!collection || collection.user_id !== user.id) {
    return NextResponse.json(
      { error: "Collection not found." },
      { status: 404 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = UpdateCollectionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "A collection title and URL identifier are required." },
      { status: 400 },
    );
  }

  const { title, description, isPublic } = parsed.data;
  const identifier = slugify(parsed.data.identifier);

  if (identifier.length < 3) {
    return NextResponse.json(
      {
        error:
          "The URL identifier must be at least 3 characters, using letters, numbers and dashes.",
      },
      { status: 400 },
    );
  }

  if (identifier !== currentIdentifier) {
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
  }

  const updated = await prisma.pages.update({
    where: { id: collection.id },
    data: {
      identifier,
      title,
      description: description || null,
      is_public: isPublic,
    },
  });

  return NextResponse.json({ identifier: updated.identifier });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<RouteParams> },
) {
  const { identifier } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "You must be signed in to delete this collection." },
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

  await prisma.pages.delete({ where: { id: collection.id } });

  return NextResponse.json({ ok: true });
}
