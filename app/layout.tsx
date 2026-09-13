import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Providers from "./_components/Providers";
import Footer from "./_components/Footer";
import GoogleAnalytics from "./_components/GoogleAnalytics";
import AnalyticsPageview from "./_components/AnalyticsPageview";
import AdsenseNavigationRefresh from "./_components/AdsenseNavigationRefresh";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteDescription =
  "View, save and share your GPX adventures for free. Explore interactive maps, elevation profiles and route statistics — no account required to get started.";

export const metadata: Metadata = {
  metadataBase: new URL("https://viewgpx.com"),
  title: {
    default: "View GPX — Free Online GPX Viewer",
    template: "%s | View GPX",
  },
  description: siteDescription,
  openGraph: {
    siteName: "View GPX",
    title: "View GPX — Free Online GPX Viewer",
    description: siteDescription,
    images: ["/images/demo.webp"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "View GPX — Free Online GPX Viewer",
    description: siteDescription,
    images: ["/images/demo.webp"],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics />

        <Suspense fallback={null}>
          <AnalyticsPageview />
          {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
            <AdsenseNavigationRefresh />
          )}
        </Suspense>

        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

        <Providers>{children}</Providers>
        <Footer />
      </body>
    </html>
  );
}
