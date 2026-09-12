import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";
import { getThumbnailUrl } from "@/app/lib/thumbnail";
import Header from "@/app/_components/Header";
import CollectionEditor from "./CollectionEditor";

type RouteParams = { identifier: string };

const routeSelect = {
  identifier: true,
  title: true,
  description: true,
  thumbnail_key: true,
} as const;

export const metadata: Metadata = {
  title: "Edit collection",
  robots: { index: false, follow: false },
};

export default async function EditCollectionPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { identifier } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const collection = await prisma.pages.findUnique({
    where: { identifier },
    include: {
      page_routes: {
        orderBy: { created_at: "asc" },
        include: {
          route: { select: routeSelect },
        },
      },
    },
  });

  if (!collection || collection.user_id !== user.id) {
    notFound();
  }

  const addedRouteIdentifiers = new Set(
    collection.page_routes.map((pageRoute) => pageRoute.route.identifier),
  );

  const availableRoutes = await prisma.routes.findMany({
    where: {
      user_id: user.id,
      identifier: { notIn: [...addedRouteIdentifiers] },
    },
    orderBy: { created_at: "desc" },
    select: routeSelect,
  });

  const withThumbnailUrl = <T extends { thumbnail_key: string | null }>({
    thumbnail_key,
    ...route
  }: T) => ({ ...route, thumbnailUrl: getThumbnailUrl(thumbnail_key) });

  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <CollectionEditor
          collection={{
            identifier: collection.identifier,
            title: collection.title ?? "",
            description: collection.description ?? "",
            isPublic: collection.is_public,
          }}
          addedRoutes={collection.page_routes.map((pageRoute) =>
            withThumbnailUrl(pageRoute.route),
          )}
          availableRoutes={availableRoutes.map(withThumbnailUrl)}
        />
      </div>
    </main>
  );
}
