"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useDropzone, type FileRejection } from "react-dropzone";
import {
  Activity,
  BarChart3,
  Eye,
  FileCode2,
  Map,
  Save,
  Share2,
  UploadCloud,
  X,
} from "lucide-react";

type BlurbProps = {
  setGpx: (gpxContent: string) => void | Promise<void>;
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;

type DragOverlayProps = {
  isDragReject: boolean;
};

const DragOverlay = ({ isDragReject }: DragOverlayProps) => {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm"
      style={{ zIndex: 2147483647 }}
    >
      <div
        className={`flex h-full max-h-[620px] w-full max-w-5xl flex-col items-center justify-center rounded-[2rem] border-4 border-dashed bg-paper/95 p-8 text-center shadow-xl transition-colors ${
          isDragReject ? "border-red-400 text-red-700" : "border-pine text-pine"
        }`}
      >
        <div
          className={`flex h-24 w-24 items-center justify-center rounded-full ${
            isDragReject ? "bg-red-50" : "bg-pine/10"
          }`}
        >
          {isDragReject ? (
            <X className="h-12 w-12" />
          ) : (
            <UploadCloud className="h-12 w-12 animate-bounce" />
          )}
        </div>

        <h2 className="mt-7 text-3xl font-extrabold sm:text-4xl">
          {isDragReject
            ? "That doesn’t look like a GPX file"
            : "Drop your GPX file here"}
        </h2>

        <p className="mt-3 text-base text-ink/60 sm:text-lg">
          {isDragReject
            ? "Please choose a file ending in .gpx."
            : "Release the file and we’ll open your route."}
        </p>
      </div>
    </div>,
    document.body,
  );
};

const Blurb = ({ setGpx }: BlurbProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];

      if (!file) {
        return;
      }

      setError(null);
      setIsReading(true);

      try {
        const gpxContent = await file.text();

        if (!gpxContent.trim()) {
          throw new Error("The selected file is empty.");
        }

        if (!gpxContent.includes("<gpx") && !gpxContent.includes("<GPX")) {
          throw new Error(
            "This file doesn’t appear to contain valid GPX data.",
          );
        }

        await setGpx(gpxContent);
      } catch (readError) {
        setError(
          readError instanceof Error
            ? readError.message
            : "We couldn’t read that GPX file.",
        );
      } finally {
        setIsReading(false);
      }
    },
    [setGpx],
  );

  const onDropRejected = useCallback((rejections: FileRejection[]) => {
    const firstError = rejections[0]?.errors[0];

    if (firstError?.code === "file-too-large") {
      setError("That GPX file is larger than the 20 MB limit.");
      return;
    }

    if (firstError?.code === "too-many-files") {
      setError("Please select one GPX file at a time.");
      return;
    }

    setError("Please choose a valid .gpx file.");
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } =
    useDropzone({
      onDrop,
      onDropRejected,
      accept: {
        "application/gpx+xml": [".gpx"],
        "application/xml": [".gpx"],
        "text/xml": [".gpx"],
      },
      maxFiles: 1,
      maxSize: MAX_FILE_SIZE,
      multiple: false,
      noClick: true,
      noKeyboard: true,
    });

  return (
    <div
      {...getRootProps()}
      className="relative isolate z-[100] mx-auto flex w-full items-center px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16"
    >
      <input {...getInputProps()} />

      {isDragActive && <DragOverlay isDragReject={isDragReject} />}

      <div className="relative z-10 mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] border border-ink/10 bg-paper/95 shadow-xl shadow-ink/10 backdrop-blur-md">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-6 sm:p-9 lg:p-10 xl:p-12">
            <div className="mx-auto max-w-2xl text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-pine/10 px-3 py-1.5 text-sm font-semibold text-pine ring-1 ring-pine/20">
                <Map className="h-4 w-4" aria-hidden="true" />
                Free online GPX viewer
              </div>

              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                Bring your adventures{" "}
                <span className="text-terracotta">to life</span>
              </h1>

              <p className="mt-5 text-base leading-7 text-ink/70 sm:text-lg">
                Turn any{" "}
                <code className="rounded-md bg-ink/5 px-2 py-1 font-mono text-sm font-semibold text-ink">
                  .GPX
                </code>{" "}
                file into an interactive route you can view, save and share.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                <Capability icon={Eye} label="View" />
                <Capability icon={Save} label="Save" />
                <Capability icon={Share2} label="Share" />
              </div>
            </div>

            <button
              type="button"
              onClick={open}
              disabled={isReading}
              className="group mt-7 flex min-h-52 w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/20 bg-ink/[0.025] p-6 text-center transition duration-200 hover:border-pine hover:bg-pine/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pine/20 disabled:cursor-wait disabled:opacity-70 sm:p-8"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-paper text-pine shadow-sm ring-1 ring-ink/10 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-md">
                {isReading ? (
                  <span
                    className="h-7 w-7 animate-spin rounded-full border-2 border-pine/20 border-t-pine"
                    aria-hidden="true"
                  />
                ) : (
                  <UploadCloud className="h-8 w-8" aria-hidden="true" />
                )}
              </div>

              <span className="mt-5 text-lg font-bold text-ink">
                {isReading ? "Opening your route…" : "Choose a GPX file"}
              </span>

              <span className="mt-2 text-sm text-ink/60">
                or drag and drop it here
              </span>

              <span className="mt-4 rounded-full bg-paper px-3 py-1 text-xs font-medium text-ink/50 ring-1 ring-ink/10">
                GPX files up to 20 MB
              </span>
            </button>

            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                <div className="flex items-start gap-3">
                  <FileCode2
                    className="mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  />

                  <p>{error}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  aria-label="Dismiss error"
                  className="rounded-md p-1 transition hover:bg-red-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="relative overflow-hidden bg-pine p-6 text-paper sm:p-9 lg:p-10 xl:p-12">
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-sage/20 blur-3xl"
            />

            <div className="relative">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-sage">
                Your route, made useful
              </p>

              <h2 className="mt-4 text-3xl font-extrabold tracking-tight">
                Explore every detail of your GPX route
              </h2>

              <p className="mt-5 leading-7 text-paper/85">
                Open your file in a beautifully designed dashboard, keep it for
                later, or send a simple link to friends. No software to install
                and no account required to start.
              </p>

              <div className="mt-8 space-y-3">
                <Feature
                  icon={Map}
                  title="Interactive route map"
                  description="Explore every part of your journey."
                />

                <Feature
                  icon={Activity}
                  title="Elevation profile"
                  description="See the climbs and descents along your route."
                />

                <Feature
                  icon={BarChart3}
                  title="Detailed statistics"
                  description="Understand your distance, speed and elevation."
                />
              </div>

              <p className="mt-8 text-sm leading-6 text-paper/75">
                Your file is processed securely and will not be uploaded until
                you choose to save or share it.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

type CapabilityProps = {
  icon: typeof Map;
  label: string;
};

const Capability = ({ icon: Icon, label }: CapabilityProps) => {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl bg-pine/10 px-3 py-3 font-bold text-pine ring-1 ring-pine/15">
      <Icon className="h-4 w-4 shrink-0 text-terracotta" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
};

type FeatureProps = {
  icon: typeof Map;
  title: string;
  description: string;
};

const Feature = ({ icon: Icon, title, description }: FeatureProps) => {
  return (
    <div className="flex items-start gap-4 rounded-2xl bg-paper/[0.13] p-4 ring-1 ring-paper/15">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-paper/15 text-sage">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <div>
        <h3 className="font-bold">{title}</h3>

        <p className="mt-1 text-sm leading-6 text-paper/80">{description}</p>
      </div>
    </div>
  );
};

export default Blurb;
