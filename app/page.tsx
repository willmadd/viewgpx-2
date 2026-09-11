import type { Metadata } from "next";

import HomeClient from "./_components/HomeClient";

export const metadata: Metadata = {
  title: "View GPX — Free Online GPX Viewer",
  description:
    "Upload a GPX file to instantly view your route on an interactive map with elevation profiles, stats, QR codes and PDF export. Free, no account required.",
};

export default function HomePage() {
  return <HomeClient />;
}
