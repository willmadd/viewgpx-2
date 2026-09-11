import type { Metadata } from "next";

import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search routes",
  description:
    "Search GPX routes shared by the View GPX community, or browse quick picks like Parkrun, 5K, 10K and marathon routes.",
};

export default function SearchPage() {
  return <SearchClient />;
}
