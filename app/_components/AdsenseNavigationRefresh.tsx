"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * AdSense auto ads only scan the page once, when adsbygoogle.js first loads.
 * Client-side navigations never trigger a fresh scan on their own, so ads
 * placed on the previous page stick around and no new ones appear. Google's
 * documented fix for single-page apps is to re-push an empty object on every
 * navigation: https://support.google.com/adsense/answer/9261307
 */
const AdsenseNavigationRefresh = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // ignore adsense errors
    }
  }, [pathname, searchParams]);

  return null;
};

export default AdsenseNavigationRefresh;
