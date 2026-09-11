"use client";

import dynamic from "next/dynamic";

const MapClient = dynamic(() => import("./MapClient"), {
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

export default function MapPageClient() {
  return <MapClient />;
}
