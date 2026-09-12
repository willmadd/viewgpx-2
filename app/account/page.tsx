import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { FolderPlus } from "lucide-react";

import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";
import { isAdmin } from "@/app/lib/isAdmin";
import { getThumbnailUrl } from "@/app/lib/thumbnail";
import Header from "@/app/_components/Header";
import RouteThumbnail from "@/app/_components/RouteThumbnail";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Manage the GPX routes and collections you've saved to your account.",
  robots: { index: false, follow: false },
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [routes, collections, admin] = await Promise.all([
    prisma.routes.findMany({
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
    }),
    prisma.pages.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      select: {
        identifier: true,
        title: true,
        description: true,
        is_public: true,
        created_at: true,
        _count: { select: { page_routes: true } },
      },
    }),
    isAdmin(user.id),
  ]);

  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>

          <div className="flex items-center gap-4">
            {admin && (
              <Link
                href="/admin"
                className="text-sm font-semibold text-pine underline-offset-4 hover:underline"
              >
                Admin
              </Link>
            )}

            <span className="text-sm text-ink/50">{user.email}</span>
          </div>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-ink">Your collections</h2>

            <Link
              href="/account/collections/new"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-pine px-4 py-2 text-sm font-bold text-paper transition hover:bg-pine/90"
            >
              <FolderPlus size={16} aria-hidden="true" />
              New collection
            </Link>
          </div>

          {collections.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-ink/10 bg-white/60 p-6 text-sm leading-6 text-ink/60">
              Group your saved routes into a collection and share them all
              with a single link.
            </p>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {collections.map((collection) => (
                <li key={collection.identifier}>
                  <Link
                    href={`/account/collections/${collection.identifier}`}
                    className="flex h-full flex-col justify-between gap-3 rounded-2xl border border-ink/10 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-bold text-ink">
                          {collection.title || collection.identifier}
                        </p>

                        <span
                          className={
                            collection.is_public
                              ? "shrink-0 rounded-full bg-pine/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-pine"
                              : "shrink-0 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink/50"
                          }
                        >
                          {collection.is_public ? "Public" : "Private"}
                        </span>
                      </div>

                      {collection.description && (
                        <p className="mt-1 truncate text-sm text-ink/60">
                          {collection.description}
                        </p>
                      )}
                    </div>

                    <p className="text-xs font-medium text-ink/40">
                      {collection._count.page_routes} route
                      {collection._count.page_routes === 1 ? "" : "s"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-ink">Your routes</h2>

          {routes.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-ink/10 bg-white/60 p-8 text-center">
              <p className="text-sm leading-6 text-ink/60">
                You haven&apos;t saved any routes yet. Upload a GPX file and
                save it to see it here.
              </p>

              <Link
                href="/"
                className="mt-4 inline-flex rounded-xl bg-pine px-5 py-2.5 text-sm font-bold text-paper transition hover:bg-pine/90"
              >
                Upload a GPX file
              </Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {routes.map((route) => (
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

                      <p className="mt-1 text-xs font-medium text-ink/40">
                        Saved {formatDate(route.created_at)} &middot;{" "}
                        {route.view_count} view
                        {route.view_count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
