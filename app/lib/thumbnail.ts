import "server-only";

export const THUMBNAIL_SIZE = 256;

export const getThumbnailUrl = (
  thumbnailKey: string | null | undefined,
): string | null => {
  if (!thumbnailKey) {
    return null;
  }

  const cdnHost = process.env.NEXT_PUBLIC_GPX_CDN_URL;

  if (!cdnHost) {
    return null;
  }

  return `https://${cdnHost}/${thumbnailKey}`;
};
