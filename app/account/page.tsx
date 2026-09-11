import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import Header from "@/app/_components/Header";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const routes = await prisma.routes.findMany({
    where: { user_id: Number(session.user.id) },
    orderBy: { created_at: "desc" },
    select: {
      identifier: true,
      title: true,
      description: true,
      created_at: true,
      view_count: true,
    },
  });

  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">Your saved routes</h1>

          <span className="text-sm text-ink/50">{session.user.email}</span>
        </div>

        {routes.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-ink/10 bg-white/60 p-8 text-center">
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
          <ul className="mt-6 space-y-3">
            {routes.map((route) => (
              <li key={route.identifier}>
                <Link
                  href={`/route/${route.identifier}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-ink/10 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                >
                  <div className="min-w-0">
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
      </div>
    </main>
  );
}
