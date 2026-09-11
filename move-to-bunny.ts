import crypto from "node:crypto";
import mysql, { type RowDataPacket } from "mysql2/promise";

const DATABASE_URL = "mysql://root:@127.0.0.1:3306/viewgpx";
const BUNNY_STORAGE_ZONE = "viewgpx";
const BUNNY_STORAGE_PASSWORD = "05a310ae-f30c-4d38-9b32e65bb892-5211-4a90";
const BUNNY_STORAGE_HOST = "ny.storage.bunnycdn.com";

const NEXT_PUBLIC_GPX_CDN_URL = "viewgpx.b-cdn.net";

// const DATABASE_URL = process.env.DATABASE_URL;
// const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
// const BUNNY_STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD;
// const BUNNY_STORAGE_HOST =
//   process.env.BUNNY_STORAGE_HOST ?? "storage.bunnycdn.com";

const TABLE_NAME = "routes";
const BATCH_SIZE = 10;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

if (!BUNNY_STORAGE_ZONE) {
  throw new Error("BUNNY_STORAGE_ZONE is missing");
}

if (!BUNNY_STORAGE_PASSWORD) {
  throw new Error("BUNNY_STORAGE_PASSWORD is missing");
}

interface GpxRow extends RowDataPacket {
  id: number;
  identifier: string | null;
  gpx: string;
}

const uploadToBunny = async (
  storageKey: string,
  contents: Buffer,
): Promise<void> => {
  const encodedPath = storageKey.split("/").map(encodeURIComponent).join("/");

  const uploadUrl =
    `https://${BUNNY_STORAGE_HOST}/` +
    `${encodeURIComponent(BUNNY_STORAGE_ZONE)}/${encodedPath}`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_STORAGE_PASSWORD,
      "Content-Type": "application/gpx+xml",
    },
    body: new Uint8Array(contents),
  });

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      `Bunny upload failed (${response.status}): ${responseBody}`,
    );
  }
};

const migrate = async (): Promise<void> => {
  const connection = await mysql.createConnection(DATABASE_URL);

  let processed = 0;

  try {
    while (true) {
      const [rows] = await connection.execute<GpxRow[]>(
        `
    SELECT id, identifier, gpx
    FROM \`${TABLE_NAME}\`
    WHERE gpx IS NOT NULL
      AND gpx <> ''
      AND gpx_storage_key IS NULL
    ORDER BY id ASC
    LIMIT ${BATCH_SIZE}
  `,
      );

      if (rows.length === 0) {
        break;
      }

      for (const row of rows) {
        const storageKey = `gpx/${row.id}.gpx`;
        const contents = Buffer.from(row.gpx, "utf8");
        const sha256 = crypto
          .createHash("sha256")
          .update(contents)
          .digest("hex");

        try {
          console.log(
            `Uploading row ${row.id}: ${storageKey} ` +
              `(${contents.length.toLocaleString()} bytes)`,
          );

          await uploadToBunny(storageKey, contents);

          await connection.execute(
            `
              UPDATE ${TABLE_NAME}
              SET
                gpx_storage_key = ?,
                gpx_size_bytes = ?,
                gpx_sha256 = ?
              WHERE id = ?
                AND gpx_storage_key IS NULL
            `,
            [storageKey, contents.length, sha256, row.id],
          );

          processed += 1;
          console.log(`Completed row ${row.id}`);
        } catch (error) {
          console.error(`Failed row ${row.id}`, error);
          throw error;
        }
      }
    }
  } finally {
    await connection.end();
  }

  console.log(`Migration complete: ${processed} rows processed`);
};

migrate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
