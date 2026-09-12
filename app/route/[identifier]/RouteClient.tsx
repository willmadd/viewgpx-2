"use client";

import { useMemo } from "react";

import Dashboard from "../../_components/Dashboard";
import { convertGpxToJson } from "../../utils/gpxToJson";

type RouteClientProps = {
  identifier: string;
  title: string | null;
  description: string | null;
  type: string | null;
  gpxFile: string;
  viewCount: number;
  isOwner: boolean;
};

const RouteClient = ({
  identifier,
  title,
  description,
  type,
  gpxFile,
  viewCount,
  isOwner,
}: RouteClientProps) => {
  const gpsJson = useMemo(() => {
    const converted = convertGpxToJson(gpxFile);

    if (!converted) {
      return null;
    }

    return {
      name: converted.name ?? undefined,
      title: title ?? undefined,
      description: description ?? undefined,
      type: type ?? undefined,
      route: converted.route,
    };
  }, [gpxFile, title, description, type]);

  return (
    <Dashboard
      gpsJson={gpsJson}
      gpxFile={gpxFile}
      mode="saved"
      identifier={identifier}
      viewCount={viewCount}
      isOwner={isOwner}
    />
  );
};

export default RouteClient;
