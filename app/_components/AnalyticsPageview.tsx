"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { pageview } from "@/app/lib/gtag";

const AnalyticsPageview = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    pageview(query ? `${pathname}?${query}` : pathname);
  }, [pathname, searchParams]);

  return null;
};

export default AnalyticsPageview;
