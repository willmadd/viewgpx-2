"use client";

import dynamic from "next/dynamic";

const RouteClient = dynamic(() => import("./RouteClient"), {
  ssr: false,
  loading: () => (
    <main className="flex min-h-screen items-center justify-center bg-stone-100">
      <span
        className="h-10 w-10 animate-spin rounded-full border-4 border-stone-200 border-t-orange-700"
        aria-hidden="true"
      />
    </main>
  ),
});

type RouteMapLoaderProps = {
  identifier: string;
  title: string | null;
  description: string | null;
  type: string | null;
  gpxFile: string;
  viewCount: number;
  isOwner: boolean;
};

const RouteMapLoader = (props: RouteMapLoaderProps) => {
  return <RouteClient {...props} />;
};

export default RouteMapLoader;
