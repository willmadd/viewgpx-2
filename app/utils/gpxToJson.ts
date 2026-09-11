import { useEffect, useState, type DependencyList } from "react";
import { gpx } from "@mapbox/togeojson";
import haversine from "haversine";
import { differenceInSeconds } from "date-fns";

export type RoutePoint = {
  lon: number;
  lat: number;
  elevation: number;
  time: string | null;
  distance: number;
  slope?: number;
};

export type ConvertedGpx = {
  route: RoutePoint[];
  totalDistance: number;
  totalPositiveElevation: number;
  totalNegativeElevation: number;
  totalTime: number | null;
  name: string | null;
};

type GpxFeature = {
  geometry: {
    coordinates: number[][];
  };
  properties: {
    name?: string | null;
    coordTimes?: Array<string | null>;
  } | null;
};

type GpxFeatureCollection = {
  features: GpxFeature[];
};

export const convertGpxToJson = (
  routeGpx: string,
): ConvertedGpx | false | undefined => {
  if (!routeGpx) {
    return undefined;
  }

  const parsed = new DOMParser().parseFromString(routeGpx, "application/xml");

  const converted = gpx(parsed) as unknown as GpxFeatureCollection;
  const feature = converted.features[0];

  if (!feature) {
    return false;
  }

  const name = feature.properties?.name ?? null;
  const coordinates = feature.geometry.coordinates;
  const coordinateTimes = feature.properties?.coordTimes ?? [];

  const route: RoutePoint[] = coordinates.map((coordinate, index) => ({
    lon: coordinate[0],
    lat: coordinate[1],
    elevation: coordinate[2] ?? 0,
    time: coordinateTimes[index] ?? null,
    distance: 0,
  }));

  if (route.length === 0) {
    return false;
  }

  const firstTime = route[0].time;
  const lastTime = route[route.length - 1].time;

  const totalTime =
    firstTime && lastTime
      ? differenceInSeconds(new Date(lastTime), new Date(firstTime))
      : null;

  let totalPositiveElevation = 0;
  let totalNegativeElevation = 0;
  let totalDistance = 0;

  for (let index = 0; index < route.length - 1; index += 1) {
    const currentPoint = route[index];
    const nextPoint = route[index + 1];

    const start = {
      latitude: currentPoint.lat,
      longitude: currentPoint.lon,
    };

    const end = {
      latitude: nextPoint.lat,
      longitude: nextPoint.lon,
    };

    const sectionDistance = haversine(start, end);

    totalDistance += sectionDistance;
    nextPoint.distance = totalDistance;

    const elevationChange = nextPoint.elevation - currentPoint.elevation;

    if (elevationChange > 0) {
      totalPositiveElevation += elevationChange;
    } else {
      totalNegativeElevation += elevationChange;
    }

    nextPoint.slope =
      sectionDistance > 0
        ? (elevationChange / (sectionDistance * 1000)) * 100
        : 0;
  }

  return {
    route,
    totalDistance,
    totalPositiveElevation,
    totalNegativeElevation,
    totalTime,
    name,
  };
};

export type FetcherResult<T> = readonly [
  data: T | undefined,
  isFetching: boolean,
];

export const useFetcher = <T>(
  fetchSomethingAPI: () => Promise<T>,
  inputs: DependencyList,
): FetcherResult<T> => {
  const [data, setData] = useState<T>();
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    let active = true;

    setIsFetching(true);

    fetchSomethingAPI()
      .then((response) => {
        if (active) {
          setData(response);
        }
      })
      .finally(() => {
        if (active) {
          setIsFetching(false);
        }
      });

    return () => {
      active = false;
    };
  }, inputs);

  return [data, isFetching] as const;
};

export const getSlopeColor = (slope: number): string => {
  let green = 180;
  const red = (slope * 255) / 8;

  if (slope > 8) {
    green -= ((slope - 3) * 100) / 12;
  }

  return `rgba(${red}, ${green}, 0, 1)`;
};

export const secondsToHm = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${hours}:${minutes.toString().padStart(2, "0")}`;
};
