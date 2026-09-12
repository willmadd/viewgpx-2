import "server-only";

const BUNNY_STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE;
const BUNNY_STORAGE_PASSWORD = process.env.BUNNY_STORAGE_PASSWORD;
const BUNNY_STORAGE_HOST = process.env.BUNNY_STORAGE_HOST ?? "storage.bunnycdn.com";

export const uploadToBunny = async (
  storageKey: string,
  contents: Buffer,
  contentType: string,
): Promise<void> => {
  if (!BUNNY_STORAGE_ZONE || !BUNNY_STORAGE_PASSWORD) {
    throw new Error("Bunny storage is not configured");
  }

  const encodedPath = storageKey.split("/").map(encodeURIComponent).join("/");
  const uploadUrl = `https://${BUNNY_STORAGE_HOST}/${encodeURIComponent(
    BUNNY_STORAGE_ZONE,
  )}/${encodedPath}`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: BUNNY_STORAGE_PASSWORD,
      "Content-Type": contentType,
    },
    body: new Uint8Array(contents),
  });

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(`Bunny upload failed (${response.status}): ${responseBody}`);
  }
};

export const uploadGpxToBunny = (storageKey: string, contents: Buffer) =>
  uploadToBunny(storageKey, contents, "application/gpx+xml");

export const uploadThumbnailToBunny = (storageKey: string, contents: Buffer) =>
  uploadToBunny(storageKey, contents, "image/png");
