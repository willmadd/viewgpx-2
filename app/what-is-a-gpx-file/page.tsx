import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/app/_components/Header";
import {
  Clock3,
  FileCode2,
  MapPinned,
  Mountain,
  Route,
  Share2,
  UploadCloud,
} from "lucide-react";

export const metadata: Metadata = {
  title: "What Is a GPX File? | View GPX",
  description:
    "Learn what a GPX file is, what route information it contains and how to view, save and share GPX routes online for free with View GPX.",
};

const exampleGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx
  xmlns="http://www.topografix.com/GPX/1/1"
  version="1.1"
  creator="View GPX"
>
  <rte>
    <name>High Paradise to Lord Stones loop</name>
    <rtept lat="54.292556" lon="-1.227839">
      <name>Start</name>
    </rtept>
    <rtept lat="54.292701" lon="-1.227990">
      <name>Finish</name>
    </rtept>
  </rte>
</gpx>`;

const dataTypes = [
  {
    icon: MapPinned,
    title: "GPS coordinates",
    description:
      "Latitude and longitude identify the precise position of each point along the route.",
    example: '<trkpt lon="-1.820133" lat="54.135110">',
  },
  {
    icon: Mountain,
    title: "Elevation",
    description:
      "Elevation records the height of a point, normally measured in metres above sea level.",
    example: "<ele>143.4</ele>",
  },
  {
    icon: Clock3,
    title: "Timestamp",
    description:
      "A timestamp records when a point was captured and can be used to calculate speed and duration.",
    example: "<time>2019-01-09T12:00:27.000Z</time>",
  },
];

const uses = [
  "Move routes between apps and GPS devices",
  "Share walking, running and cycling routes",
  "Analyse distance, elevation, speed and gradient",
  "Keep a portable copy of a recorded journey",
];

const WhatIsGpxPage = () => {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <Header variant="solid" />

      <section className="relative overflow-hidden bg-pine px-4 pb-20 pt-16 text-paper sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-sage/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-36 -left-24 h-80 w-80 rounded-full bg-terracotta/20 blur-3xl"
        />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-paper/10 px-4 py-2 text-sm font-semibold text-sage ring-1 ring-paper/15">
            <FileCode2 className="h-4 w-4" aria-hidden="true" />
            GPX explained simply
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            What is a <span className="text-terracotta">GPX file?</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-paper/80 sm:text-xl">
            A straightforward guide to the file format used to record and share
            walking, running, cycling and other GPS routes.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <article className="overflow-hidden rounded-[2rem] border border-ink/10 bg-paper shadow-xl shadow-ink/10">
          <div className="p-6 sm:p-10 lg:p-14">
            <section className="mx-auto max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-terracotta">
                The short answer
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                A portable map of your route
              </h2>

              <div className="mt-6 space-y-5 text-base leading-8 text-ink/70 sm:text-lg">
                <p>
                  GPX stands for{" "}
                  <strong className="text-ink">GPS Exchange Format</strong>. It
                  is a common file format for storing route, track and waypoint
                  data collected by GPS devices and apps.
                </p>
                <p>
                  A GPX file is written in XML, which means it is a structured
                  text file rather than an image of a map. Each waypoint can
                  contain a position, elevation, timestamp and other useful
                  information.
                </p>
              </div>
            </section>

            <section className="mx-auto mt-14 max-w-5xl">
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-terracotta">
                  Inside the file
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                  What information can GPX contain?
                </h2>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {dataTypes.map(
                  ({ icon: Icon, title, description, example }) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-ink/10 bg-ink/[0.025] p-5"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine/10 text-pine">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3 className="mt-5 text-lg font-bold">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-ink/65">
                        {description}
                      </p>
                      <code className="mt-5 block overflow-x-auto rounded-xl bg-ink px-3 py-3 text-xs text-paper">
                        {example}
                      </code>
                    </div>
                  ),
                )}
              </div>
            </section>

            <section className="mx-auto mt-16 grid max-w-5xl items-start gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-terracotta">
                  The raw data
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                  What does a GPX file look like?
                </h2>
                <p className="mt-5 leading-7 text-ink/70">
                  Open one in a text editor and it can initially look
                  complicated. However, every tag has a purpose: the example
                  shows a named route with a start point and a finish point.
                </p>
              </div>

              <div className="min-w-0 overflow-hidden rounded-2xl bg-ink shadow-lg shadow-ink/10">
                <div className="flex items-center gap-2 border-b border-paper/10 px-5 py-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-terracotta" />
                  <span className="h-2.5 w-2.5 rounded-full bg-sage" />
                  <span className="h-2.5 w-2.5 rounded-full bg-paper/40" />
                  <span className="ml-2 text-xs font-semibold text-paper/50">
                    example-route.gpx
                  </span>
                </div>
                <pre className="overflow-x-auto p-5 text-sm leading-6 text-paper/80 sm:p-6">
                  <code>{exampleGpx}</code>
                </pre>
              </div>
            </section>

            <section className="mx-auto mt-16 max-w-5xl rounded-[1.75rem] bg-pine p-6 text-paper sm:p-9">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-paper/15 text-sage">
                    <Route className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h2 className="mt-5 text-3xl font-extrabold tracking-tight">
                    Why are GPX files useful?
                  </h2>
                  <p className="mt-4 leading-7 text-paper/80">
                    Their main advantage is compatibility. A GPX route can be
                    exchanged between people, websites, navigation devices and
                    apps such as Garmin Connect and Strava.
                  </p>
                </div>

                <ul className="grid gap-3 sm:grid-cols-2">
                  {uses.map((use) => (
                    <li
                      key={use}
                      className="flex gap-3 rounded-xl bg-paper/10 p-4 text-sm font-semibold leading-6 ring-1 ring-paper/10"
                    >
                      <Share2
                        className="mt-0.5 h-5 w-5 shrink-0 text-sage"
                        aria-hidden="true"
                      />
                      {use}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mx-auto mt-16 max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-terracotta">
                Making your own
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                How are GPX files created?
              </h2>
              <div className="mt-5 space-y-5 leading-7 text-ink/70">
                <p>
                  Although you could write a GPX file by hand, it would be slow
                  and impractical. Most GPX files are recorded automatically by
                  a phone app, sports watch, bike computer or dedicated GPS
                  device.
                </p>
                <p>
                  Route-planning services can also create GPX files before a
                  journey. You can then transfer the file to another device or
                  open it in a viewer to inspect the route.
                </p>
              </div>
            </section>
          </div>

          <section className="border-t border-ink/10 bg-ink/[0.025] px-6 py-10 sm:px-10 lg:px-14">
            <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Have a GPX file ready?
                </h2>
                <p className="mt-2 text-ink/65">
                  View its map and elevation, save it for later or share it with
                  friends.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-terracotta px-5 py-3 font-bold text-paper shadow-sm transition hover:-translate-y-0.5 hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta/25"
              >
                <UploadCloud className="h-5 w-5" aria-hidden="true" />
                Open a GPX file
              </Link>
            </div>
          </section>
        </article>
      </div>
    </main>
  );
};

export default WhatIsGpxPage;
