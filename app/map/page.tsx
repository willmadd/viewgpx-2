import type { Metadata } from "next";

import MapPageClient from "./MapPageClient";

export const metadata: Metadata = {
  title: "Your route",
  description: "View your uploaded GPX route on an interactive map.",
  robots: { index: false, follow: false },
};

export default function MapPage() {
  return <MapPageClient />;
}
