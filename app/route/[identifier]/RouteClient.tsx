"use client";

import { useMemo } from "react";

import Dashboard from "../../_components/Dashboard";
import { convertGpxToJson } from "../../utils/gpxToJson";

type RouteClientProps = {
  identifier: string;
  title: string | null;
  description: string | null;
  gpxFile: string;
  viewCount: number;
};

const RouteClient = ({
  identifier,
  title,
  description,
  gpxFile,
  viewCount,
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
      route: converted.route,
    };
  }, [gpxFile, title, description]);

  return (
    <Dashboard
      gpsJson={gpsJson}
      gpxFile={gpxFile}
      mode="saved"
      identifier={identifier}
      viewCount={viewCount}
    />
  );
};

export default RouteClient;
