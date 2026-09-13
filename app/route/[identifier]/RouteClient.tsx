"use client";

import { useEffect, useMemo, useState } from "react";

import Dashboard from "../../_components/Dashboard";
import Toast from "../../_components/Toast";
import { convertGpxToJson } from "../../utils/gpxToJson";
import type { NearbyRoute } from "@/app/lib/nearbyRoutes";

type RouteClientProps = {
  identifier: string;
  title: string | null;
  description: string | null;
  type: string | null;
  gpxFile: string;
  viewCount: number;
  isOwner: boolean;
  isDuplicate: boolean;
  nearbyRoutes: NearbyRoute[];
};

const RouteClient = ({
  identifier,
  title,
  description,
  type,
  gpxFile,
  viewCount,
  isOwner,
  isDuplicate,
  nearbyRoutes,
}: RouteClientProps) => {
  const [showDuplicateToast, setShowDuplicateToast] = useState(isDuplicate);

  useEffect(() => {
    if (!isDuplicate) {
      return;
    }

    // Strip the query param without triggering a server re-fetch (which
    // would increment the view count again for what is really one visit).
    window.history.replaceState(null, "", `/route/${identifier}`);
  }, [isDuplicate, identifier]);

  useEffect(() => {
    if (!showDuplicateToast) {
      return;
    }

    const timeout = setTimeout(() => setShowDuplicateToast(false), 6000);
    return () => clearTimeout(timeout);
  }, [showDuplicateToast]);

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
    <>
      <Dashboard
        gpsJson={gpsJson}
        gpxFile={gpxFile}
        mode="saved"
        identifier={identifier}
        viewCount={viewCount}
        isOwner={isOwner}
        nearbyRoutes={nearbyRoutes}
      />

      {showDuplicateToast && (
        <Toast
          message="You've already uploaded this file."
          onDismiss={() => setShowDuplicateToast(false)}
        />
      )}
    </>
  );
};

export default RouteClient;
