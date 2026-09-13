import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";
import { isAdmin } from "@/app/lib/isAdmin";
import Header from "@/app/_components/Header";

export const metadata: Metadata = {
  title: "Admin",
  description: "Site activity overview for View GPX admins.",
  robots: { index: false, follow: false },
};

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const getStartOfToday = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start;
};

const getStartOfWeek = () => {
  const start = getStartOfToday();
  const day = start.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - diffToMonday);
  return start;
};

type RouteRow = {
  identifier: string;
  title: string | null;
  view_count: number;
  created_at: Date;
  last_viewed_at: Date;
};

const routeSelect = {
  identifier: true,
  title: true,
  view_count: true,
  created_at: true,
  last_viewed_at: true,
} as const;

type CollectionRow = {
  identifier: string;
  title: string | null;
  is_public: boolean;
  created_at: Date;
  _count: { page_routes: number };
};

const RouteTable = ({
  title,
  description,
  routes,
  emptyLabel,
}: {
  title: string;
  description: string;
  routes: RouteRow[];
  emptyLabel: string;
}) => (
  <section className="rounded-2xl border border-ink/10 bg-paper p-5 sm:p-6">
    <h2 className="text-lg font-bold text-ink">{title}</h2>
    <p className="mt-1 text-sm text-ink/60">{description}</p>

    {routes.length === 0 ? (
      <p className="mt-4 text-sm text-ink/50">{emptyLabel}</p>
    ) : (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-ink/40">
              <th className="pb-2 pr-3 font-bold">#</th>
              <th className="pb-2 pr-3 font-bold">Route</th>
              <th className="pb-2 pr-3 font-bold">Views</th>
              <th className="pb-2 pr-3 font-bold">Created</th>
              <th className="pb-2 font-bold">Last viewed</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-ink/5">
            {routes.map((route, index) => (
              <tr key={route.identifier}>
                <td className="py-2.5 pr-3 text-ink/40">{index + 1}</td>

                <td className="max-w-[220px] py-2.5 pr-3">
                  <Link
                    href={`/route/${route.identifier}`}
                    className="block truncate font-semibold text-ink underline-offset-4 hover:text-pine hover:underline"
                  >
                    {route.title || route.identifier}
                  </Link>
                </td>

                <td className="py-2.5 pr-3 text-ink/60">{route.view_count}</td>
                <td className="whitespace-nowrap py-2.5 pr-3 text-ink/60">
                  {formatDate(route.created_at)}
                </td>
                <td className="whitespace-nowrap py-2.5 text-ink/60">
                  {formatDate(route.last_viewed_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

const CollectionTable = ({
  title,
  description,
  collections,
  emptyLabel,
}: {
  title: string;
  description: string;
  collections: CollectionRow[];
  emptyLabel: string;
}) => (
  <section className="rounded-2xl border border-ink/10 bg-paper p-5 sm:p-6">
    <h2 className="text-lg font-bold text-ink">{title}</h2>
    <p className="mt-1 text-sm text-ink/60">{description}</p>

    {collections.length === 0 ? (
      <p className="mt-4 text-sm text-ink/50">{emptyLabel}</p>
    ) : (
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="text-left text-xs font-bold uppercase tracking-wide text-ink/40">
              <th className="pb-2 pr-3 font-bold">#</th>
              <th className="pb-2 pr-3 font-bold">Collection</th>
              <th className="pb-2 pr-3 font-bold">Visibility</th>
              <th className="pb-2 pr-3 font-bold">Routes</th>
              <th className="pb-2 font-bold">Created</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-ink/5">
            {collections.map((collection, index) => (
              <tr key={collection.identifier}>
                <td className="py-2.5 pr-3 text-ink/40">{index + 1}</td>

                <td className="max-w-[220px] py-2.5 pr-3">
                  <Link
                    href={`/collections/${collection.identifier}`}
                    className="block truncate font-semibold text-ink underline-offset-4 hover:text-pine hover:underline"
                  >
                    {collection.title || collection.identifier}
                  </Link>
                </td>

                <td className="py-2.5 pr-3 text-ink/60">
                  {collection.is_public ? "Public" : "Private"}
                </td>

                <td className="py-2.5 pr-3 text-ink/60">
                  {collection._count.page_routes}
                </td>

                <td className="whitespace-nowrap py-2.5 text-ink/60">
                  {formatDate(collection.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = await isAdmin(user.id);

  if (!admin) {
    redirect("/");
  }

  const startOfToday = getStartOfToday();
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = getStartOfWeek();

  const [
    createdToday,
    createdYesterday,
    createdThisWeek,
    totalRoutes,
    mostRecent,
    topViewedThisWeek,
    topViewedAllTime,
    mostRecentCollections,
  ] = await Promise.all([
    prisma.routes.count({ where: { created_at: { gte: startOfToday } } }),
    prisma.routes.count({
      where: { created_at: { gte: startOfYesterday, lt: startOfToday } },
    }),
    prisma.routes.count({ where: { created_at: { gte: startOfWeek } } }),
    prisma.routes.count(),
    prisma.routes.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      select: routeSelect,
    }),
    prisma.routes.findMany({
      where: { last_viewed_at: { gte: startOfWeek } },
      orderBy: { view_count: "desc" },
      take: 10,
      select: routeSelect,
    }),
    prisma.routes.findMany({
      orderBy: { view_count: "desc" },
      take: 10,
      select: routeSelect,
    }),
    prisma.pages.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      select: {
        identifier: true,
        title: true,
        is_public: true,
        created_at: true,
        _count: { select: { page_routes: true } },
      },
    }),
  ]);

  const stats = [
    { label: "Created today", value: createdToday },
    { label: "Created yesterday", value: createdYesterday },
    { label: "Created this week", value: createdThisWeek },
    { label: "Total routes", value: totalRoutes },
  ];

  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-ink">Admin</h1>
        <p className="mt-2 text-ink/60">Site activity overview.</p>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-ink/10 bg-white/70 p-5"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-pine">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-extrabold text-ink">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RouteTable
            title="Newest routes"
            description="The 10 most recently created routes."
            routes={mostRecent}
            emptyLabel="No routes yet."
          />

          <RouteTable
            title="Most viewed this week"
            description="Ranked by total view count, limited to routes viewed at least once since Monday. View counts are cumulative rather than reset weekly, so this approximates weekly popularity."
            routes={topViewedThisWeek}
            emptyLabel="No routes viewed this week yet."
          />
        </div>

        <div className="mt-6">
          <RouteTable
            title="Most viewed — all time"
            description="Ranked by total view count since the route was saved."
            routes={topViewedAllTime}
            emptyLabel="No routes yet."
          />
        </div>

        <div className="mt-6">
          <CollectionTable
            title="Newest collections"
            description="The 10 most recently created collections."
            collections={mostRecentCollections}
            emptyLabel="No collections yet."
          />
        </div>
      </div>
    </main>
  );
}
