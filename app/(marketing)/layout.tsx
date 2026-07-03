import type { Metadata } from "next";
import { headers } from "next/headers";
import { GeoDetectBanner } from "@/components/country/geo-detect-banner";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { CountryProvider } from "@/contexts/country-context";
import { CrimeDataProvider } from "@/contexts/crime-data-context";
import { marketingSite } from "@/lib/config";
import { getMarketingSeoForHost } from "@/lib/config/country-domain";

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const seo = getMarketingSeoForHost(host);
  const ogImageUrl = new URL("/opengraph-image", seo.metadataBase).toString();

  return {
    title: seo.title,
    description: seo.description,
    icons: {
      icon: [
        { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: seo.canonical,
      siteName: marketingSite.name,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: seo.title,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: seo.canonical,
    },
    metadataBase: new URL(seo.metadataBase),
  };
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CountryProvider>
      <div className="min-h-screen bg-background text-foreground relative w-full max-w-full overflow-x-hidden">
        <GeoDetectBanner />
        <MarketingNavbar />
        <CrimeDataProvider>
          <main className="flex-1 relative z-0 w-full max-w-full overflow-x-hidden">
            {children}
          </main>
        </CrimeDataProvider>
        <MarketingFooter />
      </div>
    </CountryProvider>
  );
}
