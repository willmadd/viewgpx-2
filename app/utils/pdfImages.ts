// Client-only helpers that rasterize the route map and elevation chart into
// PNG data URLs so they can be embedded in the exported PDF. Must only be
// called in the browser (relies on canvas/Image/document APIs).

const TILE_SIZE = 256;
const TILE_URL = (zoom: number, x: number, y: number) =>
  `https://a.tile.openstreetmap.fr/hot/${zoom}/${x}/${y}.png`;

type LatLon = { lat: number; lon: number };

const lonToTileX = (lon: number, zoom: number) =>
  ((lon + 180) / 360) * 2 ** zoom;

const latToTileY = (lat: number, zoom: number) => {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    2 ** zoom
  );
};

export const renderStaticRouteMap = async (
  points: LatLon[],
  width: number,
  height: number,
): Promise<string | null> => {
  const validPoints = points.filter(
    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lon),
  );

  if (validPoints.length < 2 || typeof document === "undefined") {
    return null;
  }

  const lats = validPoints.map((point) => point.lat);
  const lons = validPoints.map((point) => point.lon);
  const bounds = {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
  };

  const padding = 40;
  let zoom = 17;

  for (; zoom > 1; zoom -= 1) {
    const pxWidth =
      (lonToTileX(bounds.maxLon, zoom) - lonToTileX(bounds.minLon, zoom)) *
      TILE_SIZE;
    const pxHeight =
      (latToTileY(bounds.minLat, zoom) - latToTileY(bounds.maxLat, zoom)) *
      TILE_SIZE;

    if (pxWidth <= width - padding * 2 && pxHeight <= height - padding * 2) {
      break;
    }
  }

  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const centerPxX = lonToTileX(centerLon, zoom) * TILE_SIZE;
  const centerPxY = latToTileY(centerLat, zoom) * TILE_SIZE;

  const originX = centerPxX - width / 2;
  const originY = centerPxY - height / 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  ctx.fillStyle = "#eef2ef";
  ctx.fillRect(0, 0, width, height);

  const startTileX = Math.floor(originX / TILE_SIZE);
  const endTileX = Math.floor((originX + width) / TILE_SIZE);
  const startTileY = Math.floor(originY / TILE_SIZE);
  const endTileY = Math.floor((originY + height) / TILE_SIZE);
  const tileCount = 2 ** zoom;

  const tileLoads: Promise<void>[] = [];

  for (let tileX = startTileX; tileX <= endTileX; tileX += 1) {
    for (let tileY = startTileY; tileY <= endTileY; tileY += 1) {
      if (tileY < 0 || tileY >= tileCount) {
        continue;
      }

      const wrappedX = ((tileX % tileCount) + tileCount) % tileCount;
      const drawX = tileX * TILE_SIZE - originX;
      const drawY = tileY * TILE_SIZE - originY;

      tileLoads.push(
        fetch(TILE_URL(zoom, wrappedX, tileY))
          .then((response) => (response.ok ? response.blob() : null))
          .then((blob) => (blob ? createImageBitmap(blob) : null))
          .then((bitmap) => {
            if (bitmap) {
              ctx.drawImage(bitmap, drawX, drawY, TILE_SIZE, TILE_SIZE);
            }
          })
          .catch(() => undefined),
      );
    }
  }

  await Promise.all(tileLoads);

  const project = (point: LatLon) => ({
    x: lonToTileX(point.lon, zoom) * TILE_SIZE - originX,
    y: latToTileY(point.lat, zoom) * TILE_SIZE - originY,
  });

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3C5A54";
  ctx.lineWidth = 5;
  ctx.beginPath();

  validPoints.forEach((point, index) => {
    const { x, y } = project(point);

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();

  const drawMarker = (point: LatLon, color: string) => {
    const { x, y } = project(point);
    ctx.beginPath();
    ctx.arc(x, y, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  };

  drawMarker(validPoints[0], "#2f7a4f");
  drawMarker(validPoints[validPoints.length - 1], "#b3492f");

  return canvas.toDataURL("image/png");
};

export const rasterizeElevationChart = async (
  svgElementId: string,
  targetWidth: number,
): Promise<string | null> => {
  if (typeof document === "undefined") {
    return null;
  }

  const svgElement = document.getElementById(svgElementId);

  if (!(svgElement instanceof SVGSVGElement)) {
    return null;
  }

  const viewBox = svgElement.viewBox.baseVal;
  const aspect =
    viewBox && viewBox.width > 0 ? viewBox.height / viewBox.width : 260 / 800;
  const pixelWidth = Math.round(targetWidth);
  const pixelHeight = Math.round(targetWidth * aspect);

  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(pixelWidth));
  clone.setAttribute("height", String(pixelHeight));

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return null;
    }

    ctx.fillStyle = "#fdfaf6";
    ctx.fillRect(0, 0, pixelWidth, pixelHeight);
    ctx.drawImage(image, 0, 0, pixelWidth, pixelHeight);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
};
