export type Coordinates = {
  latitude: number;
  longitude: number;
};

function findFirstPointTag(
  xml: string,
  tagName: "trkpt" | "rtept" | "wpt",
): Coordinates | null {
  const tagMatch = xml.match(
    new RegExp(`<(?:[\\w-]+:)?${tagName}\\b([^>]*)>`, "i"),
  );

  if (!tagMatch) {
    return null;
  }

  const attributes = tagMatch[1];

  const latitudeMatch = attributes.match(/\blat\s*=\s*["']([^"']+)["']/i);
  const longitudeMatch = attributes.match(/\blon\s*=\s*["']([^"']+)["']/i);

  if (!latitudeMatch || !longitudeMatch) {
    return null;
  }

  const latitude = Number(latitudeMatch[1]);
  const longitude = Number(longitudeMatch[1]);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
}

/**
 * Finds the coordinates of the first track point, route point, or
 * waypoint in a GPX file, in that order of preference.
 */
export function getStartCoordinates(xml: string): Coordinates | null {
  return (
    findFirstPointTag(xml, "trkpt") ??
    findFirstPointTag(xml, "rtept") ??
    findFirstPointTag(xml, "wpt")
  );
}
