"use client";

import { useState } from "react";

import Dashboard from "../_components/Dashboard";
import { convertGpxToJson } from "../utils/gpxToJson";

type GpxPoint = {
  lat: number;
  lon: number;
  distance: number;
  elevation?: number | null;
  time?: string | number | Date | null;
};

type GpxData = {
  name?: string;
  title?: string;
  description?: string;
  route: GpxPoint[];
};

type LoadState = {
  gpsJson: GpxData | null;
  gpxFile: string;
};

const loadGpxFromSession = (): LoadState => {
  const storedGpxFile = sessionStorage.getItem("currentGpxFile");

  if (!storedGpxFile) {
    return { gpsJson: null, gpxFile: "" };
  }

  const converted = convertGpxToJson(storedGpxFile);

  if (!converted) {
    return { gpsJson: null, gpxFile: storedGpxFile };
  }

  return {
    gpxFile: storedGpxFile,
    gpsJson: {
      name: converted.name ?? undefined,
      route: converted.route,
    },
  };
};

const MapClient = () => {
  const [state] = useState<LoadState>(loadGpxFromSession);

  return (
    <Dashboard gpsJson={state.gpsJson} gpxFile={state.gpxFile} mode="draft" />
  );
};

export default MapClient;
