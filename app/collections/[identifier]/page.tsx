import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";
import { getThumbnailUrl } from "@/app/lib/thumbnail";
import { isAdmin } from "@/app/lib/isAdmin";
import Header from "@/app/_components/Header";
import RouteThumbnail from "@/app/_components/RouteThumbnail";

type RouteParams = { identifier: string };

const getCollection = async (identifier: string) => {
  const collection = await prisma.pages.findUnique({
    where: { identifier },
    include: {
      page_routes: {
        orderBy: { created_at: "asc" },
        include: {
          route: {
            select: {
              identifier: true,
              title: true,
              description: true,
              thumbnail_key: true,
            },
          },
        },
      },
    },
  });

  if (!collection) {
    return null;
  }

  if (!collection.is_public) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isOwner = Boolean(user && user.id === collection.user_id);
    const viewerIsAdmin = Boolean(user && (await isAdmin(user.id)));

    if (!isOwner && !viewerIsAdmin) {
      return null;
    }
  }

  return collection;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<RouteParams>;
}): Promise<Metadata> {
  const { identifier } = await params;
  const collection = await getCollection(identifier);

  if (!collection) {
    return { title: "Collection not found | View GPX" };
  }

  return {
    title: `${collection.title || "Routes"} | View GPX`,
    description:
      collection.description ||
      `A collection of GPX routes shared on View GPX.`,
    robots: collection.is_public ? undefined : { index: false, follow: false },
  };
}

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { identifier } = await params;
  const collection = await getCollection(identifier);

  if (!collection) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        {!collection.is_public && (
          <p className="mb-6 inline-flex rounded-full bg-ink/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink/60">
            Private — not visible to the public
          </p>
        )}

        <h1 className="text-3xl font-extrabold text-ink">
          {collection.title || "Routes"}
        </h1>

        {collection.description && (
          <p className="mt-3 text-base leading-7 text-ink/70">
            {collection.description}
          </p>
        )}

        {collection.page_routes.length === 0 ? (
          <p className="mt-8 text-sm text-ink/60">
            This collection doesn&apos;t have any routes yet.
          </p>
        ) : (
          <ul className="mt-8 space-y-3">
            {collection.page_routes.map(({ route }) => (
              <li key={route.identifier}>
                <Link
                  href={`/route/${route.identifier}`}
                  className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                >
                  <RouteThumbnail
                    src={getThumbnailUrl(route.thumbnail_key)}
                    alt={route.title || route.identifier}
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink">
                      {route.title || route.identifier}
                    </p>

                    {route.description && (
                      <p className="mt-1 truncate text-sm text-ink/60">
                        {route.description}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
