"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdsenseAdUnitProps = {
  clientId: string;
  slotId: string;
};

/**
 * A responsive AdSense unit that requests a fresh ad for each client-side page
 * navigation. Auto Ads alone do not reliably rescan SPA route changes.
 */
const AdsenseAdUnit = ({ clientId, slotId }: AdsenseAdUnitProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const pageKey = `${pathname}?${searchParams.toString()}`;
  const lastRequestedPage = useRef<string | null>(null);

  useEffect(() => {
    if (lastRequestedPage.current === pageKey) {
      return;
    }

    lastRequestedPage.current = pageKey;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense may reject an ad request; keep navigation unaffected.
    }
  }, [pageKey]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <ins
        key={pageKey}
        className="adsbygoogle block min-h-22.5 w-full"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdsenseAdUnit;
