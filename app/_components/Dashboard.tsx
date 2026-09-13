"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import L, { type LatLngBoundsExpression } from "leaflet";

import AuthPanel from "./AuthPanel";
import Header from "./Header";
import AddToCollectionMenu from "./AddToCollectionMenu";
import DraftCollectionMenu from "./DraftCollectionMenu";
import { useSupabaseAuth } from "./SupabaseProvider";
import { event as trackEvent } from "@/app/lib/gtag";
import { ROUTE_TYPES, getRouteTypeLabel } from "@/app/lib/routeTypes";
import type { NearbyRoute } from "@/app/lib/nearbyRoutes";
import RouteThumbnail from "./RouteThumbnail";

import "leaflet/dist/leaflet.css";

type GpxPoint = {
  lat: number;
  lon: number;
  distance: number;
  elevation?: number | null;
  time?: string | number | Date | null;
};

type GpxData = {
  name?: string;
  title?: string;
  description?: string;
  type?: string;
  route: GpxPoint[];
};

type DashboardMode = "draft" | "saved";

type DashboardProps = {
  gpsJson: GpxData | null;
  gpxFile: string;
  mode?: DashboardMode;
  identifier?: string;
  viewCount?: number;
  isOwner?: boolean;
  nearbyRoutes?: NearbyRoute[];
  setError?: () => void;
};

type MapMarker = {
  lat: number;
  lng: number;
};

type ElevationPoint = {
  x: number;
  y: number;
  lat: number;
  lng: number;
};

type RouteStats = {
  distanceKm: number;
  distanceMiles: number;
  durationSeconds: number | null;
  speedKph: number | null;
  speedMph: number | null;
  elevationGain: number;
  elevationLoss: number;
  highestPoint: number | null;
  lowestPoint: number | null;
};

const KM_TO_MILES = 0.621371;
const METRES_TO_FEET = 3.28084;

const startIcon = L.icon({
  iconUrl: "/images/startflag.svg",
  iconRetinaUrl: "/images/startflag.svg",
  iconSize: [24, 24],
  iconAnchor: [4, 24],
});

const endIcon = L.icon({
  iconUrl: "/images/endflag.svg",
  iconRetinaUrl: "/images/endflag.svg",
  iconSize: [24, 24],
  iconAnchor: [4, 24],
});

const crosshairIcon = L.icon({
  iconUrl: "/images/crosshair.svg",
  iconRetinaUrl: "/images/crosshair.svg",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const formatNumber = (value: number, decimals = 0) =>
  new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

const getRouteStats = (route: GpxPoint[]): RouteStats => {
  const elevations = route
    .map((point) => point.elevation)
    .filter((elevation): elevation is number => Number.isFinite(elevation));

  let elevationGain = 0;
  let elevationLoss = 0;

  const timestamps = route
    .map((point) => {
      if (point.time === null || point.time === undefined) {
        return null;
      }

      const timestamp =
        point.time instanceof Date
          ? point.time.getTime()
          : new Date(point.time).getTime();
      return Number.isFinite(timestamp) ? timestamp : null;
    })
    .filter((timestamp): timestamp is number => timestamp !== null);

  for (let index = 1; index < elevations.length; index += 1) {
    const difference = elevations[index] - elevations[index - 1];

    if (difference > 0) {
      elevationGain += difference;
    } else {
      elevationLoss += Math.abs(difference);
    }
  }

  const distanceKm = route.at(-1)?.distance ?? 0;
  const durationSeconds =
    timestamps.length > 1
      ? Math.max(0, (timestamps[timestamps.length - 1] - timestamps[0]) / 1000)
      : null;
  const speedKph =
    durationSeconds && durationSeconds > 0
      ? distanceKm / (durationSeconds / 3600)
      : null;

  return {
    distanceKm,
    distanceMiles: distanceKm * KM_TO_MILES,
    durationSeconds,
    speedKph,
    speedMph: speedKph === null ? null : speedKph * KM_TO_MILES,
    elevationGain,
    elevationLoss,
    highestPoint: elevations.length ? Math.max(...elevations) : null,
    lowestPoint: elevations.length ? Math.min(...elevations) : null,
  };
};

const formatDuration = (seconds: number | null) => {
  if (seconds === null) {
    return "No time data";
  }

  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const FitRouteBounds = ({
  bounds,
}: {
  bounds: LatLngBoundsExpression | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!bounds) {
      return;
    }

    const isDesktop = window.matchMedia("(min-width: 640px)").matches;

    map.fitBounds(bounds, {
      paddingTopLeft: [40, isDesktop ? 200 : 40],
      paddingBottomRight: [isDesktop ? 460 : 40, 40],
    });
  }, [bounds, map]);

  return null;
};

const MapView = ({
  route,
  marker,
}: {
  route: GpxPoint[];
  marker: MapMarker | null;
}) => {
  const positions = useMemo<[number, number][]>(
    () =>
      route
        .filter(
          (point) => Number.isFinite(point.lat) && Number.isFinite(point.lon),
        )
        .map((point) => [point.lat, point.lon]),
    [route],
  );

  const bounds: LatLngBoundsExpression | null = positions.length
    ? positions
    : null;

  const initialPosition = positions[0] ?? [54.474057, -1.040365];

  if (!positions.length) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center bg-paper text-sm font-medium text-ink/50">
        No valid route points were found.
      </div>
    );
  }

  return (
    <MapContainer
      center={initialPosition}
      zoom={13}
      scrollWheelZoom={false}
      dragging
      className="h-full min-h-[500px] w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      />

      <FitRouteBounds bounds={bounds} />

      <Polyline
        positions={positions}
        pathOptions={{
          color: "#3C5A54",
          weight: 5,
          opacity: 0.9,
        }}
      />

      <Marker position={positions[0]} icon={startIcon}>
        <Tooltip direction="top">Route start</Tooltip>
      </Marker>

      <Marker position={positions[positions.length - 1]} icon={endIcon}>
        <Tooltip direction="top">Route finish</Tooltip>
      </Marker>

      {marker && (
        <Marker position={[marker.lat, marker.lng]} icon={crosshairIcon} />
      )}
    </MapContainer>
  );
};

const StatCard = ({
  label,
  value,
  secondaryValue,
}: {
  label: string;
  value: React.ReactNode;
  secondaryValue?: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-ink/10 bg-white/65 p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
      {label}
    </p>

    <p className="mt-2 text-xl font-bold tracking-tight text-ink">{value}</p>

    {secondaryValue && (
      <p className="mt-0.5 text-sm font-semibold text-ink/50">
        {secondaryValue}
      </p>
    )}
  </div>
);

const Statistics = ({ route }: { route: GpxPoint[] }) => {
  const stats = useMemo(() => getRouteStats(route), [route]);

  return (
    <section className="h-full bg-paper p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine">
          Route overview
        </p>

        <h2 className="mt-1 text-xl font-bold text-ink">Statistics</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <StatCard
          label="Distance"
          value={`${formatNumber(stats.distanceKm, 2)} km`}
          secondaryValue={`${formatNumber(stats.distanceMiles, 2)} miles`}
        />

        <StatCard label="Time" value={formatDuration(stats.durationSeconds)} />

        <StatCard
          label="Average speed"
          value={
            stats.speedKph === null
              ? "No speed data"
              : `${formatNumber(stats.speedKph, 2)} km/h`
          }
          secondaryValue={
            stats.speedMph === null
              ? undefined
              : `${formatNumber(stats.speedMph, 2)} mph`
          }
        />

        <StatCard
          label="Elevation gain"
          value={`${formatNumber(stats.elevationGain)} m`}
          secondaryValue={`${formatNumber(
            stats.elevationGain * METRES_TO_FEET,
          )} ft`}
        />

        <StatCard
          label="Elevation loss"
          value={`${formatNumber(stats.elevationLoss)} m`}
          secondaryValue={`${formatNumber(
            stats.elevationLoss * METRES_TO_FEET,
          )} ft`}
        />

        <StatCard
          label="Highest point"
          value={
            stats.highestPoint === null
              ? "No elevation data"
              : `${formatNumber(stats.highestPoint)} m`
          }
          secondaryValue={
            stats.highestPoint === null
              ? undefined
              : `${formatNumber(stats.highestPoint * METRES_TO_FEET)} ft`
          }
        />

        <StatCard
          label="Lowest point"
          value={
            stats.lowestPoint === null
              ? "No elevation data"
              : `${formatNumber(stats.lowestPoint)} m`
          }
          secondaryValue={
            stats.lowestPoint === null
              ? undefined
              : `${formatNumber(stats.lowestPoint * METRES_TO_FEET)} ft`
          }
        />

        <StatCard
          label="Total elevation change"
          value={`${formatNumber(stats.elevationGain + stats.elevationLoss)} m`}
          secondaryValue={`${formatNumber(
            (stats.elevationGain + stats.elevationLoss) * METRES_TO_FEET,
          )} ft`}
        />
      </div>
    </section>
  );
};

const ElevationProfile = ({
  route,
  onHover,
}: {
  route: ElevationPoint[];
  onHover: (point: ElevationPoint) => void;
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<{
    point: ElevationPoint;
    pixelX: number;
    pixelY: number;
    gradient: number | null;
  } | null>(null);

  const width = 800;
  const height = 260;
  const padding = {
    top: 20,
    right: 20,
    bottom: 42,
    left: 54,
  };

  const validRoute = useMemo(
    () =>
      route.filter(
        (point) =>
          Number.isFinite(point.x) &&
          Number.isFinite(point.y) &&
          Number.isFinite(point.lat) &&
          Number.isFinite(point.lng),
      ),
    [route],
  );

  if (validRoute.length < 2) {
    return (
      <section className="flex h-full min-h-[330px] items-center justify-center bg-sage/10 p-6">
        <p className="max-w-md text-center text-sm font-medium leading-6 text-ink/60">
          Could not display the elevation profile because this GPX file does not
          contain elevation data.
        </p>
      </section>
    );
  }

  const xValues = validRoute.map((point) => point.x);
  const yValues = validRoute.map((point) => point.y);

  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);

  const xRange = maxX - minX || 1;
  const yRange = maxY - minY || 1;

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const scaleX = (value: number) =>
    padding.left + ((value - minX) / xRange) * chartWidth;

  const scaleY = (value: number) =>
    padding.top + chartHeight - ((value - minY) / yRange) * chartHeight;

  const linePoints = validRoute
    .map((point) => `${scaleX(point.x)},${scaleY(point.y)}`)
    .join(" ");

  const areaPoints = [
    `${scaleX(validRoute[0].x)},${padding.top + chartHeight}`,
    linePoints,
    `${scaleX(validRoute[validRoute.length - 1].x)},${
      padding.top + chartHeight
    }`,
  ].join(" ");

  const gridLines = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    const y = padding.top + chartHeight * ratio;
    const value = maxY - yRange * ratio;

    return {
      y,
      value,
    };
  });

  const distanceTicks = Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;

    return {
      x: padding.left + chartWidth * ratio,
      value: minX + xRange * ratio,
    };
  });

  const GRADIENT_LOOKBACK_POINTS = 5;

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;

    if (!svg) {
      return;
    }

    const rectangle = svg.getBoundingClientRect();
    const pointerX =
      ((event.clientX - rectangle.left) / rectangle.width) * width;

    const chartX = Math.min(
      padding.left + chartWidth,
      Math.max(padding.left, pointerX),
    );

    const ratio = (chartX - padding.left) / chartWidth;
    const index = Math.round(ratio * (validRoute.length - 1));
    const point = validRoute[index];

    if (!point) {
      return;
    }

    onHover(point);

    const lookbackPoint =
      validRoute[Math.max(0, index - GRADIENT_LOOKBACK_POINTS)];
    const distanceDeltaKm = point.x - lookbackPoint.x;
    const elevationDeltaM = point.y - lookbackPoint.y;
    const gradient =
      distanceDeltaKm > 0
        ? (elevationDeltaM / (distanceDeltaKm * 1000)) * 100
        : null;

    setHover({
      point,
      pixelX: scaleX(point.x),
      pixelY: scaleY(point.y),
      gradient,
    });
  };

  const handlePointerLeave = () => setHover(null);

  return (
    <section className="h-full bg-sage/10 p-5 sm:p-6">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine">
          Terrain
        </p>

        <h2 className="mt-1 text-xl font-bold text-ink">Elevation profile</h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink/10 bg-paper p-2">
        <div className="relative">
          <svg
            ref={svgRef}
            id="route-elevation-svg"
            viewBox={`0 0 ${width} ${height}`}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className="h-auto w-full touch-none"
            role="img"
            aria-label="Route elevation profile"
          >
            <defs>
              <linearGradient id="elevation-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3C5A54" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3C5A54" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {gridLines.map((line) => (
              <g key={line.y}>
                <line
                  x1={padding.left}
                  x2={padding.left + chartWidth}
                  y1={line.y}
                  y2={line.y}
                  stroke="#2B302E"
                  strokeOpacity="0.1"
                  strokeWidth="1"
                />

                <text
                  x={padding.left - 10}
                  y={line.y + 4}
                  textAnchor="end"
                  className="fill-ink/50 text-[11px]"
                >
                  {formatNumber(line.value)}m
                </text>
              </g>
            ))}

            {distanceTicks.map((tick) => (
              <text
                key={tick.x}
                x={tick.x}
                y={height - 12}
                textAnchor="middle"
                className="fill-ink/50 text-[11px]"
              >
                {formatNumber(tick.value, 1)}km
              </text>
            ))}

            <polygon points={areaPoints} fill="url(#elevation-fill)" />

            <polyline
              points={linePoints}
              fill="none"
              stroke="#3C5A54"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <rect
              x={padding.left}
              y={padding.top}
              width={chartWidth}
              height={chartHeight}
              fill="transparent"
            />

            {hover && (
              <g>
                <line
                  x1={hover.pixelX}
                  x2={hover.pixelX}
                  y1={padding.top}
                  y2={padding.top + chartHeight}
                  stroke="#2B302E"
                  strokeOpacity="0.25"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                <circle
                  cx={hover.pixelX}
                  cy={hover.pixelY}
                  r="5"
                  fill="#3C5A54"
                  stroke="#fdfaf6"
                  strokeWidth="2"
                />
              </g>
            )}
          </svg>

          {hover && (
            <div
              className="pointer-events-none absolute top-2 -translate-x-1/2 rounded-lg border border-ink/10 bg-ink px-3 py-2 text-xs font-semibold text-paper shadow-lg"
              style={{
                left: `${Math.min(94, Math.max(6, (hover.pixelX / width) * 100))}%`,
              }}
            >
              <p>
                {formatNumber(hover.point.x, 2)} km &middot;{" "}
                {formatNumber(hover.point.y)} m
              </p>

              {hover.gradient !== null && (
                <p className="mt-0.5 text-paper/70">
                  Gradient: {hover.gradient > 0 ? "+" : ""}
                  {formatNumber(hover.gradient, 1)}%
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const formatDistance = (distanceKm: number) => {
  if (distanceKm < 1) {
    return `${formatNumber(distanceKm * 1000)} m away`;
  }

  return `${formatNumber(distanceKm, distanceKm < 10 ? 1 : 0)} km away`;
};

const NearbyRoutes = ({ routes }: { routes: NearbyRoute[] }) => {
  if (!routes.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-screen-2xl border-x border-b border-ink/10 bg-paper p-5 sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine">
          Explore more
        </p>

        <h2 className="mt-1 text-xl font-bold text-ink">Nearby routes</h2>
      </div>

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((route) => {
          const routeTypeLabel = getRouteTypeLabel(route.type);

          return (
            <li key={route.identifier}>
              <Link
                href={`/route/${route.identifier}`}
                className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white/65 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <RouteThumbnail
                  src={route.thumbnailUrl}
                  alt={route.title || route.identifier}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink">
                    {route.title || route.identifier}
                  </p>

                  <p className="mt-1 text-xs font-medium text-ink/40">
                    {formatDistance(route.distanceKm)}
                    {routeTypeLabel && ` · ${routeTypeLabel}`}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

const Dashboard = ({
  gpsJson,
  gpxFile,
  mode = "draft",
  identifier,
  viewCount,
  isOwner = false,
  nearbyRoutes = [],
  setError,
}: DashboardProps) => {
  const [marker, setMarker] = useState<MapMarker | null>(null);
  const [title, setTitle] = useState(
    gpsJson?.title || (gpsJson?.name !== "gpxdata" ? gpsJson?.name : "") || "",
  );
  const [description, setDescription] = useState(gpsJson?.description ?? "");
  const [type, setType] = useState(gpsJson?.type ?? "");

  const route = useMemo(() => gpsJson?.route ?? [], [gpsJson]);

  const elevationData = useMemo<ElevationPoint[]>(
    () =>
      route
        .filter(
          (point) =>
            typeof point.elevation === "number" &&
            Number.isFinite(point.elevation),
        )
        .map((point) => ({
          x: point.distance,
          y: point.elevation as number,
          lat: point.lat,
          lng: point.lon,
        })),
    [route],
  );

  useEffect(() => {
    if (!gpsJson) {
      setError?.();
      return;
    }

    document.title = `${
      gpsJson.title || gpsJson.name || "Route"
    } | View GPX Dashboard`;
  }, [gpsJson, setError]);

  const handleElevationHover = (point: ElevationPoint) => {
    setMarker({
      lat: point.lat,
      lng: point.lng,
    });
  };

  const downloadGpxFile = () => {
    const file = new Blob([gpxFile], {
      type: "application/gpx+xml",
    });

    const url = URL.createObjectURL(file);
    const element = document.createElement("a");
    const filename = gpsJson?.name || "gpx-file";

    element.href = url;
    element.download = `viewgpx.com_${filename}.gpx`;
    document.body.appendChild(element);
    element.click();
    element.remove();

    URL.revokeObjectURL(url);

    trackEvent("file_download", {
      file_name: element.download,
      file_extension: "gpx",
    });
  };

  if (!gpsJson || !route.length) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper px-6">
        <div className="max-w-md rounded-2xl border border-ink/10 bg-paper p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-ink">Route unavailable</h1>

          <p className="mt-2 text-sm leading-6 text-ink/60">
            We could not find any route points in this GPX file.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex rounded-xl bg-pine px-5 py-3 text-sm font-bold text-paper transition hover:bg-pine/90"
          >
            Choose another GPX file
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper">
      <Header variant="solid" />

      <section className="relative flex flex-col sm:block">
        <div className="relative z-[1000] p-4 sm:absolute sm:right-4 sm:top-4 sm:w-[420px] sm:p-0">
          <CurrentRoutePanelWithSave
            mode={mode}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            type={type}
            setType={setType}
            identifier={identifier}
            viewCount={viewCount}
            isOwner={isOwner}
            gpxFile={gpxFile}
            route={route}
            onDownloadGpx={downloadGpxFile}
          />
        </div>

        <div className="h-[60vh] min-h-[420px] sm:h-[calc(100vh-5rem)] sm:min-h-[500px] sm:max-h-[850px]">
          <MapView route={route} marker={marker} />
        </div>
      </section>

      <div className="mx-auto grid max-w-screen-2xl overflow-hidden border-x border-b border-ink/10 lg:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
        <Statistics route={route} />

        <ElevationProfile
          route={elevationData}
          onHover={handleElevationHover}
        />
      </div>

      <NearbyRoutes routes={nearbyRoutes} />
    </main>
  );
};

const CurrentRoutePanelWithSave = ({
  mode,
  title,
  setTitle,
  description,
  setDescription,
  type,
  setType,
  identifier,
  viewCount,
  isOwner,
  gpxFile,
  route,
  onDownloadGpx,
}: {
  mode: DashboardMode;
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  type: string;
  setType: (value: string) => void;
  identifier?: string;
  viewCount?: number;
  isOwner: boolean;
  gpxFile: string;
  route: GpxPoint[];
  onDownloadGpx: () => void;
}) => {
  const router = useRouter();
  const { status } = useSupabaseAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [selectedCollectionIdentifiers, setSelectedCollectionIdentifiers] =
    useState<string[]>([]);
  const [pendingCollectionTitles, setPendingCollectionTitles] = useState<
    string[]
  >([]);

  const isSaved = mode === "saved";
  const hasDescription = description.trim().length > 0;
  const routeTypeLabel = getRouteTypeLabel(type);

  const toggleCollectionIdentifier = (collectionIdentifier: string) => {
    setSelectedCollectionIdentifiers((current) =>
      current.includes(collectionIdentifier)
        ? current.filter((item) => item !== collectionIdentifier)
        : [...current, collectionIdentifier],
    );
  };

  const addPendingCollectionTitle = (collectionTitle: string) => {
    setPendingCollectionTitles((current) =>
      current.includes(collectionTitle)
        ? current
        : [...current, collectionTitle],
    );
  };

  const removePendingCollectionTitle = (collectionTitle: string) => {
    setPendingCollectionTitles((current) =>
      current.filter((item) => item !== collectionTitle),
    );
  };

  const attachToCollections = async (routeIdentifier: string) => {
    const collectionIdentifiers = [...selectedCollectionIdentifiers];

    for (const collectionTitle of pendingCollectionTitles) {
      try {
        const createResponse = await fetch("/api/collections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: collectionTitle, isPublic: true }),
        });

        const createData = await createResponse.json().catch(() => ({}));

        if (createResponse.ok) {
          collectionIdentifiers.push(createData.identifier);
        }
      } catch {
        // ignore collection creation errors — the route itself already saved
      }
    }

    await Promise.all(
      collectionIdentifiers.map((collectionIdentifier) =>
        fetch(`/api/collections/${collectionIdentifier}/routes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ routeIdentifier }),
        }).catch(() => null),
      ),
    );
  };

  const handleSave = async () => {
    setSaveError(null);
    setIsSaving(true);

    try {
      const { renderStaticRouteMap } = await import("../utils/pdfImages");
      const [thumbnail, ogImage] = await Promise.all([
        renderStaticRouteMap(route, 256, 256).catch(() => null),
        // 1200x630 is the standard Open Graph image size used by
        // Facebook/X/LinkedIn link previews.
        renderStaticRouteMap(route, 1200, 630).catch(() => null),
      ]);

      const response = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          type,
          thumbnail: thumbnail ?? undefined,
          ogImage: ogImage ?? undefined,
          gpx: gpxFile,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSaveError(data.error || "Could not save this route.");
        return;
      }

      if (selectedCollectionIdentifiers.length || pendingCollectionTitles.length) {
        await attachToCollections(data.identifier);
      }

      try {
        sessionStorage.removeItem("currentGpxFile");
      } catch {
        // ignore storage errors
      }

      if (data.duplicate) {
        router.push(`/route/${data.identifier}?duplicate=1`);
        return;
      }

      trackEvent("save_route", { route_identifier: data.identifier });
      router.push(`/route/${data.identifier}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = async () => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      trackEvent("share", { method: "copy_link" });
    } catch {
      // ignore clipboard errors
    }
  };

  const handleToggleQr = async () => {
    if (qrDataUrl) {
      setQrDataUrl(null);
      return;
    }

    setIsLoadingQr(true);

    try {
      const { default: QRCode } = await import("qrcode");
      const dataUrl = await QRCode.toDataURL(window.location.href, {
        width: 240,
        margin: 1,
      });

      setQrDataUrl(dataUrl);
      trackEvent("share", { method: "qr_code" });
    } catch {
      // ignore QR generation errors
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPdfError(null);
    setIsGeneratingPdf(true);

    try {
      const [{ default: jsPDF }, { default: QRCode }, { renderStaticRouteMap, rasterizeElevationChart }] =
        await Promise.all([
          import("jspdf"),
          import("qrcode"),
          import("../utils/pdfImages"),
        ]);

      const shareUrl = window.location.href;

      const contentWidth = 499; // A4 width (595pt) minus 48pt margins either side
      const mapDisplayHeight = 240;
      const elevationDisplayHeight = Math.round(contentWidth * (260 / 800));

      const [qrUrl, mapImageUrl, elevationImageUrl] = await Promise.all([
        QRCode.toDataURL(shareUrl, { width: 240, margin: 1 }),
        renderStaticRouteMap(route, contentWidth * 2, mapDisplayHeight * 2),
        rasterizeElevationChart("route-elevation-svg", contentWidth * 2),
      ]);

      const stats = getRouteStats(route);
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const marginX = 48;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const footerReserve = 40;
      let y = 64;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - footerReserve) {
          doc.addPage();
          y = 64;
        }
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(title || "Route", marginX, y);
      y += 26;

      if (hasDescription) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(description, contentWidth);
        ensureSpace(lines.length * 14 + 16);
        doc.text(lines, marginX, y);
        y += lines.length * 14 + 16;
      } else {
        y += 8;
      }

      if (mapImageUrl) {
        ensureSpace(mapDisplayHeight + 16);
        doc.addImage(
          mapImageUrl,
          "PNG",
          marginX,
          y,
          contentWidth,
          mapDisplayHeight,
        );
        y += mapDisplayHeight + 20;
      }

      ensureSpace(22 + 7 * 18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("Route statistics", marginX, y);
      y += 22;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const rows: [string, string][] = [
        [
          "Distance",
          `${formatNumber(stats.distanceKm, 2)} km (${formatNumber(
            stats.distanceMiles,
            2,
          )} miles)`,
        ],
        ["Duration", formatDuration(stats.durationSeconds)],
        [
          "Average speed",
          stats.speedKph === null
            ? "No speed data"
            : `${formatNumber(stats.speedKph, 2)} km/h (${formatNumber(
                stats.speedMph ?? 0,
                2,
              )} mph)`,
        ],
        ["Elevation gain", `${formatNumber(stats.elevationGain)} m`],
        ["Elevation loss", `${formatNumber(stats.elevationLoss)} m`],
        [
          "Highest point",
          stats.highestPoint === null
            ? "No elevation data"
            : `${formatNumber(stats.highestPoint)} m`,
        ],
        [
          "Lowest point",
          stats.lowestPoint === null
            ? "No elevation data"
            : `${formatNumber(stats.lowestPoint)} m`,
        ],
      ];

      rows.forEach(([label, value]) => {
        ensureSpace(18);
        doc.text(label, marginX, y);
        doc.text(value, marginX + 170, y);
        y += 18;
      });

      y += 16;

      if (elevationImageUrl) {
        ensureSpace(24 + elevationDisplayHeight + 16);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.text("Elevation profile", marginX, y);
        y += 20;
        doc.addImage(
          elevationImageUrl,
          "PNG",
          marginX,
          y,
          contentWidth,
          elevationDisplayHeight,
        );
        y += elevationDisplayHeight + 20;
      }

      ensureSpace(110);
      doc.addImage(qrUrl, "PNG", marginX, y, 110, 110);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Scan to view this route online", marginX + 122, y + 46);
      doc.textWithLink(shareUrl, marginX + 122, y + 62, { url: shareUrl });

      const totalPages = doc.getNumberOfPages();

      for (let page = 1; page <= totalPages; page += 1) {
        doc.setPage(page);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text("Made with viewgpx.com", pageWidth / 2, pageHeight - 24, {
          align: "center",
        });
        doc.setTextColor(0);
      }

      const pdfFileName = `${identifier || "route"}.pdf`;
      doc.save(pdfFileName);
      trackEvent("file_download", {
        file_name: pdfFileName,
        file_extension: "pdf",
      });
    } catch {
      setPdfError("Could not generate the PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-paper/95 p-5 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-pine">
          {isSaved ? "Saved route" : "Current route"}
        </p>

        <Link
          href="/"
          className="text-xs font-semibold text-ink/50 underline-offset-4 transition hover:text-pine hover:underline"
        >
          New route
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="route-title"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Route title
          </label>

          <input
            id="route-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Give your route a title"
            maxLength={120}
            readOnly={isSaved}
            className="w-full rounded-xl border border-ink/15 bg-white/80 px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink/35 read-only:bg-ink/5 focus:border-pine focus:ring-2 focus:ring-pine/15"
          />
        </div>

        {(!isSaved || hasDescription) && (
          <div>
            <label
              htmlFor="route-description"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Description{" "}
              {!isSaved && (
                <span className="font-normal text-ink/40">(optional)</span>
              )}
            </label>

            <textarea
              id="route-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Add a few details about this route"
              maxLength={500}
              rows={3}
              readOnly={isSaved}
              className="w-full resize-none rounded-xl border border-ink/15 bg-white/80 px-3.5 py-2.5 text-sm leading-5 text-ink outline-none transition placeholder:text-ink/35 read-only:bg-ink/5 focus:border-pine focus:ring-2 focus:ring-pine/15"
            />
          </div>
        )}

        {isSaved ? (
          routeTypeLabel && (
            <p className="inline-flex rounded-full bg-pine/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-pine">
              {routeTypeLabel}
            </p>
          )
        ) : (
          <div>
            <label
              htmlFor="route-type"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Route type{" "}
              <span className="font-normal text-ink/40">(optional)</span>
            </label>

            <select
              id="route-type"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-white/80 px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-pine focus:ring-2 focus:ring-pine/15"
            >
              <option value="">Select an activity</option>
              {ROUTE_TYPES.map((routeType) => (
                <option key={routeType.value} value={routeType.value}>
                  {routeType.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isSaved ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex w-full items-center justify-center rounded-xl bg-terracotta px-4 py-3 text-sm font-bold text-paper shadow-sm transition hover:bg-terracotta/90"
            >
              {copied ? "Link copied!" : "Copy share link"}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleToggleQr}
                disabled={isLoadingQr}
                className="inline-flex items-center justify-center rounded-xl border border-ink/15 bg-white/80 px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-ink/5 disabled:opacity-60"
              >
                {isLoadingQr
                  ? "Loading…"
                  : qrDataUrl
                    ? "Hide QR code"
                    : "Show QR code"}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="inline-flex items-center justify-center rounded-xl border border-ink/15 bg-white/80 px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-ink/5 disabled:opacity-60"
              >
                {isGeneratingPdf ? "Preparing…" : "Download PDF"}
              </button>

              <button
                type="button"
                onClick={onDownloadGpx}
                className="col-span-2 inline-flex items-center justify-center rounded-xl border border-ink/15 bg-white/80 px-4 py-2.5 text-sm font-bold text-ink transition hover:bg-ink/5"
              >
                Download GPX
              </button>
            </div>

            {isOwner && identifier && (
              <AddToCollectionMenu routeIdentifier={identifier} />
            )}

            {pdfError && (
              <p className="text-center text-xs font-medium text-red-600">
                {pdfError}
              </p>
            )}

            {qrDataUrl && (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-ink/10 bg-white/80 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR code linking to this route"
                  className="h-40 w-40"
                />

                <a
                  href={qrDataUrl}
                  download={`${identifier || "route"}-qr.png`}
                  className="text-sm font-semibold text-pine underline-offset-4 hover:underline"
                >
                  Download QR code
                </a>
              </div>
            )}

            {typeof viewCount === "number" && (
              <p className="text-center text-xs text-ink/45">
                Viewed {viewCount} time{viewCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
        ) : (
          <div>
            {status === "authenticated" && (
              <div className="mb-3">
                <DraftCollectionMenu
                  selectedIdentifiers={selectedCollectionIdentifiers}
                  onToggleIdentifier={toggleCollectionIdentifier}
                  pendingTitles={pendingCollectionTitles}
                  onAddPendingTitle={addPendingCollectionTitle}
                  onRemovePendingTitle={removePendingCollectionTitle}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim() || isSaving}
              className="inline-flex w-full items-center justify-center rounded-xl bg-terracotta px-4 py-3 text-sm font-bold text-paper shadow-sm transition hover:bg-terracotta/90 focus:outline-none focus:ring-2 focus:ring-terracotta/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving…" : "Save route"}
            </button>

            {saveError && (
              <p className="mt-2 text-center text-xs font-medium text-red-600">
                {saveError}
              </p>
            )}

            {!title.trim() && (
              <p className="mt-2 text-center text-xs text-ink/45">
                Add a title to save this route.
              </p>
            )}

            {status === "unauthenticated" && (
              <div className="mt-4 border-t border-ink/10 pt-4">
                {showAuthPanel ? (
                  <>
                    <p className="mb-3 text-sm font-semibold text-ink">
                      Log in to manage your saved routes
                    </p>

                    <AuthPanel compact />
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAuthPanel(true)}
                    className="w-full text-center text-sm font-semibold text-pine underline-offset-4 hover:underline"
                  >
                    Log in to save this to your account
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {identifier && (
        <p className="mt-3 truncate text-center text-xs text-ink/40">
          viewgpx.com/route/{identifier}
        </p>
      )}
    </div>
  );
};

export default Dashboard;
