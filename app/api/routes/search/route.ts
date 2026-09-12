import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/app/lib/prisma";
import { getThumbnailUrl } from "@/app/lib/thumbnail";

const QuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
});

const PAGE_SIZE = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid search query." },
      { status: 400 },
    );
  }

  const { q, page } = parsed.data;

  const where: Prisma.routesWhereInput = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [routes, total] = await Promise.all([
    prisma.routes.findMany({
      where,
      orderBy: q ? { view_count: "desc" } : { created_at: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        identifier: true,
        title: true,
        description: true,
        created_at: true,
        view_count: true,
        thumbnail_key: true,
      },
    }),
    prisma.routes.count({ where }),
  ]);

  return NextResponse.json({
    routes: routes.map(({ thumbnail_key, ...route }) => ({
      ...route,
      thumbnailUrl: getThumbnailUrl(thumbnail_key),
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
  });
}
