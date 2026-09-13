"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";

import Header from "../_components/Header";
import RouteThumbnail from "../_components/RouteThumbnail";
import { event as trackEvent } from "@/app/lib/gtag";

type RouteResult = {
  identifier: string;
  title: string | null;
  description: string | null;
  created_at: string;
  view_count: number;
  thumbnailUrl: string | null;
};

const quickSearches = [
  "Parkrun",
  "5K",
  "10K",
  "Half marathon",
  "Marathon",
  "Trail",
];

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const SearchClient = () => {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [routes, setRoutes] = useState<RouteResult[]>([]);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        if (submittedQuery) {
          params.set("q", submittedQuery);
        }

        params.set("page", String(page));

        const response = await fetch(
          `/api/routes/search?${params.toString()}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        setRoutes(data.routes ?? []);
        setTotal(data.total ?? 0);
        setPageSize(data.pageSize ?? 30);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setError("We couldn't load routes. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    run();

    return () => controller.abort();
  }, [submittedQuery, page]);

  useEffect(() => {
    if (submittedQuery) {
      trackEvent("search", { search_term: submittedQuery });
    }
  }, [submittedQuery]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSubmittedQuery(query.trim());
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    setPage(1);
    setSubmittedQuery(term);
  };

  const handleClear = () => {
    setQuery("");
    setPage(1);
    setSubmittedQuery("");
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-extrabold text-ink">Search routes</h1>

        <p className="mt-2 text-ink/60">
          Find GPX routes shared by the View GPX community.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by route name or description"
            className="w-full rounded-xl border border-ink/15 bg-white/80 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-pine focus:ring-2 focus:ring-pine/15"
          />

          <button
            type="submit"
            className="shrink-0 rounded-xl bg-pine px-5 py-3 text-sm font-bold text-paper transition hover:bg-pine/90"
          >
            Search
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {quickSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleQuickSearch(term)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                submittedQuery.toLowerCase() === term.toLowerCase()
                  ? "border-pine bg-pine text-paper"
                  : "border-ink/15 bg-white/70 text-ink hover:border-pine/40"
              }`}
            >
              {term}
            </button>
          ))}

          {submittedQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-ink/50 transition hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>

        <div className="mt-8">
          {isLoading ? (
            <p className="text-sm text-ink/50">Searching…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : routes.length === 0 ? (
            <p className="text-sm text-ink/50">
              No routes found{submittedQuery ? ` for "${submittedQuery}"` : ""}.
            </p>
          ) : (
            <>
              <p className="text-xs font-medium text-ink/40">
                Showing {(page - 1) * pageSize + 1}
                &ndash;{Math.min(page * pageSize, total)} of {total} route
                {total === 1 ? "" : "s"}
              </p>

              <ul className="mt-3 space-y-3">
                {routes.map((route) => (
                  <li key={route.identifier}>
                    <Link
                      href={`/route/${route.identifier}`}
                      className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                    >
                      <RouteThumbnail
                        src={route.thumbnailUrl}
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

              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    disabled={page <= 1}
                    className="rounded-xl border border-ink/15 bg-white/80 px-4 py-2 text-sm font-bold text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="text-xs font-medium text-ink/50">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(totalPages, current + 1))
                    }
                    disabled={page >= totalPages}
                    className="rounded-xl border border-ink/15 bg-white/80 px-4 py-2 text-sm font-bold text-ink transition hover:bg-ink/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default SearchClient;
