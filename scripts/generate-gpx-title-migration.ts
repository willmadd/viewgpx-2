import path from "node:path";
import { appendFile, readdir, readFile } from "node:fs/promises";
import { XMLParser } from "fast-xml-parser";

const GPX_DIRECTORY = path.resolve(process.cwd(), "gpx");

/*
 * IMPORTANT:
 * Change this to the migration directory created by:
 *
 * npx prisma migrate dev --create-only --name backfill_route_titles
 */
const MIGRATION_FILE = path.resolve(
  process.cwd(),
  "prisma/migrations/20260913122733_backfill_route_titles/migration.sql",
);

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  trimValues: true,
  parseTagValue: false,
});

type GpxText = {
  title: string;
  description: string | null;
};

function firstItem<T>(value: T | T[] | undefined): T | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normaliseText(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function extractGpxText(xml: string): GpxText | null {
  const parsed = parser.parse(xml);
  const gpx = parsed?.gpx;

  if (!gpx || typeof gpx !== "object") {
    return null;
  }

  const metadata = firstItem(gpx.metadata);
  const track = firstItem(gpx.trk);
  const route = firstItem(gpx.rte);

  /*
   * Prefer the general GPX metadata title.
   * Fall back to the first track name, then the first route name.
   */
  const title =
    normaliseText(metadata?.name) ??
    normaliseText(track?.name) ??
    normaliseText(route?.name);

  if (!title) {
    return null;
  }

  /*
   * Use the same priority order for descriptions.
   */
  const description =
    normaliseText(metadata?.desc) ??
    normaliseText(track?.desc) ??
    normaliseText(route?.desc);

  return {
    title,
    description,
  };
}

function sqlString(value: string): string {
  /*
   * PostgreSQL escapes a single quote by doubling it.
   *
   * Example:
   *   Bob's Route
   *
   * Becomes:
   *   'Bob''s Route'
   */
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlNullableString(value: string | null): string {
  return value === null ? "NULL" : sqlString(value);
}

async function main() {
  console.log(`Looking for GPX files in: ${GPX_DIRECTORY}`);

  const entries = await readdir(GPX_DIRECTORY, {
    withFileTypes: true,
  });

  const files = entries
    .filter(
      (entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".gpx"),
    )
    .map((entry) => entry.name)
    .sort();

  console.log(`Found ${files.length} GPX files`);

  if (files.length === 0) {
    throw new Error(`No GPX files were found in ${GPX_DIRECTORY}`);
  }

  const values: string[] = [];
  const skipped: string[] = [];

  for (const [index, filename] of files.entries()) {
    if (index === 0 || (index + 1) % 100 === 0) {
      console.log(`Processing ${index + 1}/${files.length}: ${filename}`);
    }

    const filePath = path.join(GPX_DIRECTORY, filename);

    /*
     * Local file:
     *   ./gpx/31038.gpx
     *
     * Database storage key:
     *   gpx/31038.gpx
     */
    const storageKey = path.posix.join("gpx", filename);

    try {
      const startedAt = Date.now();

      const xml = await readFile(filePath, "utf8");
      const gpxText = extractGpxText(xml);

      const duration = Date.now() - startedAt;

      if (duration > 2_000) {
        console.warn(`Slow file: ${storageKey} took ${duration}ms`);
      }

      if (!gpxText) {
        skipped.push(`${storageKey}: no GPX title found`);
        continue;
      }

      values.push(
        [
          "(",
          sqlString(storageKey),
          ", ",
          sqlString(gpxText.title),
          ", ",
          sqlNullableString(gpxText.description),
          ")",
        ].join(""),
      );
    } catch (error) {
      skipped.push(
        `${storageKey}: ${
          error instanceof Error ? error.message : "could not parse file"
        }`,
      );
    }
  }

  if (values.length === 0) {
    throw new Error("No GPX files containing titles were found");
  }

  const sql = `

-- Route titles and descriptions generated from the local GPX files.
-- Existing non-empty route titles are intentionally preserved.
WITH gpx_metadata(gpx_storage_key, title, description) AS (
  VALUES
    ${values.join(",\n    ")}
)
UPDATE public.routes AS route
SET
  title = gpx_metadata.title,
  description = CASE
    WHEN route.description IS NULL
      OR BTRIM(route.description) = ''
    THEN gpx_metadata.description
    ELSE route.description
  END
FROM gpx_metadata
WHERE route.gpx_storage_key = gpx_metadata.gpx_storage_key
  AND (
    route.title IS NULL
    OR BTRIM(route.title) = ''
  );
`;

  await appendFile(MIGRATION_FILE, sql, "utf8");

  console.log("");
  console.log("Migration generation complete");
  console.log(`GPX files scanned: ${files.length}`);
  console.log(`GPX titles generated: ${values.length}`);
  console.log(`Files skipped: ${skipped.length}`);
  console.log(`Migration file: ${MIGRATION_FILE}`);

  if (skipped.length > 0) {
    console.log("");
    console.warn("First skipped files:");

    for (const message of skipped.slice(0, 50)) {
      console.warn(`- ${message}`);
    }

    if (skipped.length > 50) {
      console.warn(`...and ${skipped.length - 50} additional skipped files`);
    }
  }
}

main().catch((error) => {
  console.error("");
  console.error("Migration generation failed:");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exitCode = 1;
});
