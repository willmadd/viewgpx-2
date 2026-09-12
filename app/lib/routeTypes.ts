export const ROUTE_TYPES = [
  { value: "hiking", label: "Hiking" },
  { value: "running", label: "Running" },
  { value: "road_cycling", label: "Road cycling" },
  { value: "mountain_biking", label: "Mountain biking" },
  { value: "walking", label: "Walking" },
  { value: "trail_running", label: "Trail running" },
  { value: "gravel_cycling", label: "Gravel cycling" },
  { value: "e_bike", label: "E-bike" },
  { value: "bikepacking", label: "Bikepacking" },
  { value: "motorcycling", label: "Motorcycling" },
  { value: "horse_riding", label: "Horse riding" },
  { value: "ski_touring", label: "Ski touring" },
  { value: "cross_country_skiing", label: "Cross-country skiing" },
  { value: "snowshoeing", label: "Snowshoeing" },
  { value: "kayaking_canoeing", label: "Kayaking / canoeing" },
  { value: "climbing", label: "Climbing" },
  { value: "road_trip", label: "Road trip / drive" },
  { value: "other", label: "Other" },
] as const;

export type RouteType = (typeof ROUTE_TYPES)[number]["value"];

const ROUTE_TYPE_VALUES = new Set<string>(
  ROUTE_TYPES.map((routeType) => routeType.value),
);

export const isRouteType = (value: string): value is RouteType =>
  ROUTE_TYPE_VALUES.has(value);

export const getRouteTypeLabel = (value: string | null | undefined) =>
  ROUTE_TYPES.find((routeType) => routeType.value === value)?.label ?? null;
