"use client";

import { useRouter } from "next/navigation";
import {
  BarChart3,
  CloudUpload,
  Download,
  FileDown,
  Link2,
  ListChecks,
  Map,
  QrCode,
  Share2,
  Smartphone,
} from "lucide-react";

import Header from "./_components/Header";
import Blurb from "./_components/Blurb";

const featureSummary = [
  {
    title: "Interactive maps",
    description: "Explore your complete route on an easy-to-use map.",
    icon: Map,
  },
  {
    title: "Route statistics",
    description: "See distance, elevation and other useful route information.",
    icon: BarChart3,
  },
  {
    title: "Easy uploads",
    description: "Drag and drop a GPX file to view it instantly.",
    icon: CloudUpload,
  },
  {
    title: "Simple sharing",
    description: "Share your adventures with friends and family.",
    icon: Share2,
  },
  {
    title: "Works everywhere",
    description: "View your GPX files on desktop, tablet or mobile.",
    icon: Smartphone,
  },
  {
    title: "Download anytime",
    description: "Keep your original GPX file available to download.",
    icon: Download,
  },
];

const newFeatures = [
  {
    title: "QR codes for every route",
    description:
      "Generate a scannable QR code for any saved route and download it to print or share offline.",
    icon: QrCode,
  },
  {
    title: "Download as PDF",
    description:
      "Export a saved route as a print-ready PDF with the map, elevation profile, stats and a QR code back to the live version.",
    icon: FileDown,
  },
  {
    title: "Your saved routes",
    description:
      "Create a free account to save routes and find them all in one place, ready to open anytime.",
    icon: ListChecks,
  },
  {
    title: "One-click share links",
    description:
      "Every saved route gets a permanent link you can copy and send in a click.",
    icon: Link2,
  },
];

export default function HomePage() {
  const router = useRouter();

  const setGpx = (gpxFile: string) => {
    try {
      sessionStorage.setItem("currentGpxFile", gpxFile);
      router.push("/map");
    } catch (error) {
      console.error("Unable to save GPX file:", error);

      window.alert(
        "This GPX file is too large to open. Please try a smaller file.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header />

      <section className="relative overflow-hidden">
        <div className="relative min-h-[560px] md:min-h-[840px] pb-20 pt-8">
          <img
            src="/images/hero2.webp"
            alt="Mountain landscape displaying an outdoor GPX route"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-b from-ink/15 via-transparent to-ink/40" />

          <div className="relative z-10">
            <Blurb setGpx={setGpx} />
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-auto mt-8 w-[calc(100%-2rem)] max-w-6xl rounded-3xl border border-ink/10 bg-paper px-5 py-10 shadow-sm sm:-mt-20 sm:px-8 lg:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            <h1 className="text-center text-3xl font-extrabold tracking-tight text-pine sm:text-4xl lg:text-left">
              Visualize your GPX adventures
            </h1>

            <p className="mt-5 text-center text-base leading-7 text-ink/70 lg:text-left">
              View GPX allows you to effortlessly view, save and share your GPX
              files with friends and family. From interactive maps and elevation
              profiles to detailed route statistics, View GPX transforms your
              GPX data into insights you can explore, share and revisit.
            </p>

            <p className="mt-4 text-center text-base leading-7 text-ink/70 lg:text-left">
              Save your files securely and share links with friends—perfect for
              any device. No downloads, no hassle. Just pure adventure.
            </p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-paper p-3">
            <img
              src="/images/demo.webp"
              alt="Example of a GPX route displayed on View GPX"
              className="h-auto w-full rounded-xl object-cover"
            />
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-center text-2xl font-bold text-pine">
            Key features
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featureSummary.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="flex items-start gap-4 rounded-2xl border border-ink/10 bg-paper p-5 transition duration-200 hover:-translate-y-1 hover:shadow-sm"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pine/10 text-pine">
                    <Icon size={26} aria-hidden="true" />
                  </div>

                  <div>
                    <h3 className="font-semibold text-ink">{feature.title}</h3>

                    <p className="mt-1 text-sm leading-6 text-ink/70">
                      {feature.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-16 overflow-hidden rounded-2xl border border-ink/10">
          <img
            src="/images/navigator.webp"
            alt="View GPX route navigation interface"
            className="h-auto w-full"
          />
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="text-center text-3xl font-extrabold text-pine sm:text-4xl">
            Why View GPX?
          </h2>

          <div className="mt-8 rounded-2xl bg-pine/5 p-6 sm:p-8">
            <p className="leading-7 text-ink/80">
              As the internet&apos;s favourite GPX file viewer, View GPX makes
              displaying and sharing GPX files effortless. It&apos;s the only
              tool you&apos;ll ever need for managing your GPX files.
            </p>

            <ul className="mt-6 grid gap-3 text-ink/80 sm:grid-cols-2">
              {[
                "Drag and drop GPX files",
                "Share files with friends and family",
                "Share using a simple link",
                "No need to sign up",
                "Free forever",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-2 w-2 shrink-0 rounded-full bg-terracotta"
                  />

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 border-t border-ink/10 pt-10">
            <h2 className="text-3xl font-extrabold text-ink">
              New in version 2
            </h2>

            <p className="mt-4 leading-7 text-ink/70">
              View GPX now gives you the ability to upload, save and share your
              GPX files. Files can be accessed by sharing a link with friends,
              where they can view and download your GPX file. It&apos;s ideal
              when they&apos;re using a device that doesn&apos;t normally
              support GPX files.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {newFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="flex items-start gap-4 rounded-2xl bg-pine p-5 text-paper shadow-sm ring-1 ring-paper/10 transition duration-200 hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-paper/15 text-terracotta">
                      <Icon size={26} aria-hidden="true" />
                    </div>

                    <div>
                      <h3 className="font-semibold text-paper">
                        {feature.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-paper/75">
                        {feature.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="h-20" />
    </main>
  );
}
