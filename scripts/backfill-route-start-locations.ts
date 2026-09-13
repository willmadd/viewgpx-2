import path from "node:path";
import { readdir, readFile, appendFile } from "node:fs/promises";

const GPX_DIRECTORY = path.resolve(process.cwd(), "gpx");

/*
 * Replace this directory name with the migration Prisma created.
 */
const MIGRATION_FILE = path.resolve(
  process.cwd(),
  "prisma/migrations/20260913114600_add_route_start_locations/migration.sql",
);

type Coordinates = {
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

  return {
    latitude,
    longitude,
  };
}

function getStartCoordinates(xml: string): Coordinates | null {
  return (
    findFirstPointTag(xml, "trkpt") ??
    findFirstPointTag(xml, "rtept") ??
    findFirstPointTag(xml, "wpt")
  );
}

/**
 * Escape a string for inclusion in a generated PostgreSQL string literal.
 */
function sqlString(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

async function main() {
  const files = (await readdir(GPX_DIRECTORY, { withFileTypes: true }))
    .filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".gpx"),
    )
    .map((entry) => entry.name)
    .sort();

  const values: string[] = [];
  const skipped: string[] = [];

  for (const filename of files) {
    const filePath = path.join(GPX_DIRECTORY, filename);

    /*
     * Local file:
     *   ./gpx/31038.gpx
     *
     * Database storage key:
     *   gpx/31038.gpx
     *
     * path.posix is deliberately used so the database key always has
     * forward slashes, regardless of the operating system.
     */
    const storageKey = path.posix.join("gpx", filename);

    try {
      const xml = await readFile(filePath, "utf8");
      const coordinates = getStartCoordinates(xml);

      if (!coordinates) {
        skipped.push(`${storageKey}: no valid coordinate found`);
        continue;
      }

      values.push(
        `(${sqlString(storageKey)}, ${coordinates.longitude}, ${coordinates.latitude})`,
      );
    } catch (error) {
      skipped.push(
        `${storageKey}: ${
          error instanceof Error ? error.message : "could not read file"
        }`,
      );
    }
  }

  if (values.length === 0) {
    throw new Error("No valid GPX coordinates were found");
  }

  const sql = `

-- Route start coordinates generated from the local ./gpx directory.
-- PostGIS points use longitude first, followed by latitude.
WITH route_locations(gpx_storage_key, longitude, latitude) AS (
  VALUES
    ${values.join(",\n    ")}
)
UPDATE public.routes AS route
SET start_location =
  extensions.ST_SetSRID(
    extensions.ST_MakePoint(
      route_locations.longitude,
      route_locations.latitude
    ),
    4326
  )::extensions.geography
FROM route_locations
WHERE route.gpx_storage_key = route_locations.gpx_storage_key;
`;

  await appendFile(MIGRATION_FILE, sql, "utf8");

  console.log(`Found ${files.length} GPX files`);
  console.log(`Added ${values.length} coordinates to the migration`);

  if (skipped.length > 0) {
    console.warn(`Skipped ${skipped.length} files:`);

    for (const message of skipped) {
      console.warn(`- ${message}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
