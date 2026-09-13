import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Header from "@/app/_components/Header";
import {
  CheckCircle2,
  Copy,
  Link2,
  MousePointerClick,
  PlayCircle,
  Share2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How to Share a GPX File Online | View GPX",
  description:
    "Learn how to upload and share a GPX route online in four simple steps. Create a link that friends can open to view your route map, elevation and statistics.",
};

const steps = [
  {
    number: "01",
    icon: MousePointerClick,
    title: "Open View GPX",
    description:
      "Go to the View GPX homepage to open the free online GPX viewer. You do not need to install any software or create an account to view a file.",
    content: (
      <Link
        href="/"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-pine px-4 py-2.5 text-sm font-bold text-paper transition hover:-translate-y-0.5 hover:bg-pine/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pine/20"
      >
        Visit the GPX viewer
        <Link2 className="h-4 w-4" aria-hidden="true" />
      </Link>
    ),
  },
  {
    number: "02",
    icon: UploadCloud,
    title: "Choose your GPX file",
    description:
      "Drag your .gpx file onto the upload area or click “Choose a GPX file” to select it from your device. Your route will open automatically.",
    content: (
      <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-ink shadow-lg shadow-ink/10">
        <div className="flex items-center gap-3 border-b border-paper/10 px-5 py-3 text-xs font-semibold text-paper/60">
          <PlayCircle className="h-4 w-4 text-sage" aria-hidden="true" />
          Uploading a GPX file
        </div>
        <video
          className="aspect-video h-auto w-full bg-ink object-cover"
          controls
          preload="metadata"
        >
          <source src="/movies/dragfile.mp4" type="video/mp4" />
          Your browser does not support the video element.
        </video>
      </div>
    ),
  },
  {
    number: "03",
    icon: Share2,
    title: "Select “Share this route”",
    description:
      "Once the route has loaded, use the Share this route button. View GPX will save the route and prepare a shareable page for it.",
    // content: (
    //   <Screenshot
    //     src="/images/sharethisgpsfile.png"
    //     alt="The Share this route button in the View GPX route dashboard"
    //   />
    // ),
  },
  {
    number: "04",
    icon: Copy,
    title: "Copy and send the link",
    description:
      "Use the copy button beside the generated URL, then paste the link into a message or email. Anyone with the link can open the shared route page.",
    // content: (
    //   <Screenshot
    //     src="/images/clicktocopy.png"
    //     alt="Copying a shared GPX route URL in View GPX"
    //   />
    // ),
  },
];

const ShareAGpxFilePage = () => {
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
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share a route in four simple steps
          </div>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            How to share a <span className="text-terracotta">GPX file</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-paper/80 sm:text-xl">
            Turn a GPX file into a simple web link that friends, family and
            fellow adventurers can open on any device.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-10 max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <article className="overflow-hidden rounded-[2rem] border border-ink/10 bg-paper shadow-xl shadow-ink/10">
          <div className="p-6 sm:p-10 lg:p-14">
            <section className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-terracotta">
                Quick and straightforward
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                From GPX file to shareable route
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-ink/70 sm:text-lg">
                Upload your file, check the interactive map and elevation
                profile, then create a link. The person receiving it does not
                need to download the original file or install a specialist app.
              </p>
            </section>

            <div className="mx-auto mt-14 max-w-5xl space-y-6 sm:space-y-8">
              {steps.map(
                ({ number, icon: Icon, title, description, content }) => (
                  <section
                    key={number}
                    className="relative overflow-hidden rounded-[1.75rem] border border-ink/10 bg-ink/[0.025] p-5 sm:p-8"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute -right-2 -top-8 text-[8rem] font-black leading-none text-pine/[0.045] sm:text-[10rem]"
                    >
                      {number}
                    </span>

                    <div className="relative grid gap-7 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
                      <div>
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pine text-paper shadow-sm">
                            <Icon className="h-6 w-6" aria-hidden="true" />
                          </div>
                          <span className="text-sm font-bold uppercase tracking-[0.18em] text-terracotta">
                            Step {number}
                          </span>
                        </div>

                        <h2 className="mt-5 text-2xl font-extrabold tracking-tight sm:text-3xl">
                          {title}
                        </h2>
                        <p className="mt-4 leading-7 text-ink/70">
                          {description}
                        </p>

                        {number === "01" && content}
                      </div>

                      {number !== "01" && (
                        <div className="min-w-0">{content}</div>
                      )}

                      {number === "01" && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Benefit
                            icon={CheckCircle2}
                            title="Free to view"
                            description="Open and inspect your route before sharing it."
                          />
                          <Benefit
                            icon={ShieldCheck}
                            title="You stay in control"
                            description="The file is only uploaded when you choose to save or share."
                          />
                        </div>
                      )}
                    </div>
                  </section>
                ),
              )}
            </div>

            <section className="mx-auto mt-14 max-w-5xl rounded-[1.75rem] bg-pine p-6 text-paper sm:p-9">
              <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.18em] text-sage">
                    Ready to share?
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                    Open your GPX route now
                  </h2>
                  <p className="mt-4 max-w-2xl leading-7 text-paper/80">
                    View the map, explore its elevation and statistics, then
                    save it or share it with a single link.
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

type ScreenshotProps = {
  src: string;
  alt: string;
};

const Screenshot = ({ src, alt }: ScreenshotProps) => {
  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-paper p-2 shadow-lg shadow-ink/10 lg:mt-0">
      <Image
        src={src}
        alt={alt}
        width={1200}
        height={750}
        className="h-auto w-full rounded-xl object-contain"
      />
    </div>
  );
};

type BenefitProps = {
  icon: typeof CheckCircle2;
  title: string;
  description: string;
};

const Benefit = ({ icon: Icon, title, description }: BenefitProps) => {
  return (
    <div className="rounded-2xl bg-paper p-5 ring-1 ring-ink/10">
      <Icon className="h-6 w-6 text-terracotta" aria-hidden="true" />
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-ink/65">{description}</p>
    </div>
  );
};

export default ShareAGpxFilePage;
