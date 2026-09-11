import Link from "next/link";

import { prisma } from "@/app/lib/prisma";
import Header from "@/app/_components/Header";

const staticPages = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search routes" },
  { href: "/login", label: "Log in / sign up" },
];

const PAGE_SIZE = 100;

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

export default async function SitemapPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const requestedPage = Number(pageParam);
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  const [routes, total] = await Promise.all([
    prisma.routes.findMany({
      orderBy: { created_at: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { identifier: true, title: true, created_at: true },
    }),
    prisma.routes.count(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-ink">Sitemap</h1>

        <p className="mt-2 text-ink/60">
          Every page and shared route on View GPX. See also the{" "}
          <a
            href="/sitemap.xml"
            className="text-pine underline-offset-4 hover:underline"
          >
            XML sitemap
          </a>{" "}
          for search engines.
        </p>

        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-pine">
            Pages
          </h2>

          <ul className="mt-3 space-y-2">
            {staticPages.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-ink underline-offset-4 transition hover:text-pine hover:underline"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-pine">
              Routes
            </h2>

            {total > 0 && (
              <span className="text-xs text-ink/40">
                {total} route{total === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {routes.length === 0 ? (
            <p className="mt-3 text-sm text-ink/50">
              No routes have been shared yet.
            </p>
          ) : (
            <>
              <ul className="mt-3 space-y-2">
                {routes.map((route) => (
                  <li
                    key={route.identifier}
                    className="flex items-center justify-between gap-4"
                  >
                    <Link
                      href={`/route/${route.identifier}`}
                      className="truncate text-ink underline-offset-4 transition hover:text-pine hover:underline"
                    >
                      {route.title || route.identifier}
                    </Link>

                    <span className="shrink-0 text-xs text-ink/40">
                      {formatDate(route.created_at)}
                    </span>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between gap-4">
                  {page > 1 ? (
                    <Link
                      href={`/sitemap?page=${page - 1}`}
                      className="rounded-xl border border-ink/15 bg-white/80 px-4 py-2 text-sm font-bold text-ink transition hover:bg-ink/5"
                    >
                      Previous
                    </Link>
                  ) : (
                    <span />
                  )}

                  <span className="text-xs font-medium text-ink/50">
                    Page {page} of {totalPages}
                  </span>

                  {page < totalPages ? (
                    <Link
                      href={`/sitemap?page=${page + 1}`}
                      className="rounded-xl border border-ink/15 bg-white/80 px-4 py-2 text-sm font-bold text-ink transition hover:bg-ink/5"
                    >
                      Next
                    </Link>
                  ) : (
                    <span />
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
