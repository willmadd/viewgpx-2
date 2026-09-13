import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/app/_components/Header";
import {
  Code2,
  Compass,
  Map,
  Mountain,
  Share2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About View GPX | Built for Better Adventures",
  description:
    "Learn why we built View GPX: a simple, reliable way to view, analyse, save and share GPX routes online.",
};

const values = [
  {
    icon: Compass,
    title: "Simple by design",
    description:
      "Open a route and understand it without wrestling with complicated navigation software.",
  },
  {
    icon: ShieldCheck,
    title: "Secure and reliable",
    description:
      "Your file is processed securely and is only uploaded when you choose to save or share it.",
  },
  {
    icon: Share2,
    title: "Made for sharing",
    description:
      "Turn a GPX file into a clear route page that is easy to revisit or send to someone else.",
  },
];

const AboutUsPage = () => {
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
            <Mountain className="h-4 w-4" aria-hidden="true" />
            Built for people who love the outdoors
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Adventures are better when they are{" "}
            <span className="text-terracotta">easy to explore</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-paper/80 sm:text-xl">
            View GPX makes it simple to open, understand, save and share the
            routes that take you somewhere memorable.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <article className="overflow-hidden rounded-[2rem] border border-ink/10 bg-paper shadow-xl shadow-ink/10">
          <div className="p-6 sm:p-10 lg:p-14">
            <section className="mx-auto grid max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-terracotta">
                  Welcome to View GPX
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Your route, brought to life
                </h2>
                <div className="mt-6 space-y-5 leading-8 text-ink/70">
                  <p>
                    View GPX is an online tool for viewing, analysing, saving
                    and sharing GPX files. It turns raw GPS data into an
                    interactive route map, elevation profile and useful journey
                    statistics.
                  </p>
                  <p>
                    Whether you are hiking, cycling, running or planning your
                    next trip, View GPX helps you understand the route before
                    you set off and share it when you are ready.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-ink/10 bg-ink/[0.025] p-2 shadow-lg shadow-ink/10">
                <Image
                  src="/images/dessert.webp"
                  alt="An outdoor landscape representing the adventures explored with View GPX"
                  width={1600}
                  height={1000}
                  priority
                  className="aspect-[8/5] h-auto w-full rounded-2xl object-cover"
                />
              </div>
            </section>

            <section className="mx-auto mt-16 max-w-5xl">
              <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-terracotta">
                  Why we built it
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Outdoor knowledge meets software
                </h2>
              </div>

              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                <div className="rounded-[1.75rem] bg-pine p-6 text-paper sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-paper/15 text-sage">
                    <Mountain className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-2xl font-extrabold">The outdoors</h3>
                  <p className="mt-4 leading-7 text-paper/80">
                    We are explorers and mountain bikers who regularly use GPS
                    routes. We know how valuable good route data can be—and how
                    frustrating it is when the tools used to open it feel dated
                    or unnecessarily difficult.
                  </p>
                </div>

                <div className="rounded-[1.75rem] border border-ink/10 bg-ink/[0.025] p-6 sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta/15 text-terracotta">
                    <Code2 className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-2xl font-extrabold">
                    The technology
                  </h3>
                  <p className="mt-4 leading-7 text-ink/70">
                    We are also software developers. View GPX grew from the idea
                    that opening a GPX file should be as straightforward as
                    dropping it onto a webpage, with the important information
                    presented clearly from the start.
                  </p>
                </div>
              </div>
            </section>

            <section className="mx-auto mt-16 max-w-5xl">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-terracotta">
                  What matters to us
                </p>
                <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Technology should support the adventure
                </h2>
                <p className="mt-5 text-lg leading-8 text-ink/70">
                  Our aim is to spend less time making sense of software and
                  more time discovering new places. That idea guides every part
                  of View GPX.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {values.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-ink/10 bg-ink/[0.025] p-6"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine/10 text-pine">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink/65">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mx-auto mt-16 max-w-5xl rounded-[1.75rem] bg-pine p-6 text-paper sm:p-9">
              <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <div className="flex items-center gap-3 text-sage">
                    <Map className="h-5 w-5" aria-hidden="true" />
                    <p className="text-sm font-bold uppercase tracking-[0.18em]">
                      Start exploring
                    </p>
                  </div>
                  <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
                    Bring your next route to life
                  </h2>
                  <p className="mt-4 max-w-2xl leading-7 text-paper/80">
                    View your route and elevation for free. If you want to
                    return to it later or send it to someone else, simply save
                    or share it when you are ready.
                  </p>
                </div>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-terracotta px-5 py-3 font-bold text-paper shadow-sm transition hover:-translate-y-0.5 hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-terracotta/25"
                >
                  <UploadCloud className="h-5 w-5" aria-hidden="true" />
                  Choose a GPX file
                </Link>
              </div>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
};

export default AboutUsPage;
