import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/app/lib/supabase/server";
import { prisma } from "@/app/lib/prisma";
import { isAdmin } from "@/app/lib/isAdmin";
import Header from "@/app/_components/Header";

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
};

const RouteList = ({
  title,
  description,
  routes,
  emptyLabel,
  metric,
}: {
  title: string;
  description: string;
  routes: RouteRow[];
  emptyLabel: string;
  metric: (route: RouteRow) => string;
}) => (
  <section className="rounded-2xl border border-ink/10 bg-paper p-5 sm:p-6">
    <h2 className="text-lg font-bold text-ink">{title}</h2>
    <p className="mt-1 text-sm text-ink/60">{description}</p>

    {routes.length === 0 ? (
      <p className="mt-4 text-sm text-ink/50">{emptyLabel}</p>
    ) : (
      <ol className="mt-4 space-y-2">
        {routes.map((route, index) => (
          <li key={route.identifier}>
            <Link
              href={`/route/${route.identifier}`}
              className="flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-white/70 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-pine/10 text-xs font-bold text-pine">
                  {index + 1}
                </span>

                <span className="truncate font-semibold text-ink">
                  {route.title || route.identifier}
                </span>
              </div>

              <span className="shrink-0 text-xs font-medium text-ink/50">
                {metric(route)}
              </span>
            </Link>
          </li>
        ))}
      </ol>
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
  const startOfWeek = getStartOfWeek();

  const [
    createdToday,
    createdThisWeek,
    totalRoutes,
    topViewedAllTime,
    mostRecent,
    topViewedThisWeek,
  ] = await Promise.all([
    prisma.routes.count({ where: { created_at: { gte: startOfToday } } }),
    prisma.routes.count({ where: { created_at: { gte: startOfWeek } } }),
    prisma.routes.count(),
    prisma.routes.findMany({
      orderBy: { view_count: "desc" },
      take: 10,
      select: {
        identifier: true,
        title: true,
        view_count: true,
        created_at: true,
      },
    }),
    prisma.routes.findMany({
      orderBy: { created_at: "desc" },
      take: 10,
      select: {
        identifier: true,
        title: true,
        view_count: true,
        created_at: true,
      },
    }),
    prisma.routes.findMany({
      where: { last_viewed_at: { gte: startOfWeek } },
      orderBy: { view_count: "desc" },
      take: 10,
      select: {
        identifier: true,
        title: true,
        view_count: true,
        created_at: true,
      },
    }),
  ]);

  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-ink">Admin</h1>
        <p className="mt-2 text-ink/60">Site activity overview.</p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-ink/10 bg-pine p-5 text-paper">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sage">
              Created today
            </p>
            <p className="mt-2 text-3xl font-extrabold">{createdToday}</p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-pine p-5 text-paper">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-sage">
              Created this week
            </p>
            <p className="mt-2 text-3xl font-extrabold">{createdThisWeek}</p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white/70 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-pine">
              Total routes
            </p>
            <p className="mt-2 text-3xl font-extrabold text-ink">
              {totalRoutes}
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <RouteList
            title="Top 10 — most viewed (all-time)"
            description="Ranked by total view count since the route was saved."
            routes={topViewedAllTime}
            emptyLabel="No routes yet."
            metric={(route) =>
              `${route.view_count} view${route.view_count === 1 ? "" : "s"}`
            }
          />

          <RouteList
            title="Top 10 — newest routes"
            description="The most recently created routes, newest first."
            routes={mostRecent}
            emptyLabel="No routes yet."
            metric={(route) => formatDate(route.created_at)}
          />

          <RouteList
            title="Top 10 — most viewed this week"
            description="Total view count for routes that were viewed at least once since Monday. View counts are cumulative (not reset weekly), so this approximates weekly popularity rather than measuring views within the week exactly."
            routes={topViewedThisWeek}
            emptyLabel="No routes viewed this week yet."
            metric={(route) =>
              `${route.view_count} view${route.view_count === 1 ? "" : "s"}`
            }
          />
        </div>
      </div>
    </main>
  );
}
