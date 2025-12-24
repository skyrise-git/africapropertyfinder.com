import type { Metadata } from "next";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingNavbar } from "@/components/layout/marketing-navbar";
import { marketingSite } from "@/lib/config";

const ogImageUrl = new URL(
  "/opengraph-image",
  marketingSite.url.endsWith("/") ? marketingSite.url : `${marketingSite.url}/`,
).toString();

export const metadata: Metadata = {
  title: marketingSite.title,
  description: marketingSite.description,
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
    title: marketingSite.title,
    description: marketingSite.description,
    url: marketingSite.url,
    siteName: marketingSite.name,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: marketingSite.title,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: marketingSite.title,
    description: marketingSite.description,
    images: [ogImageUrl],
  },
  metadataBase: new URL(marketingSite.url),
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground relative w-full max-w-full overflow-x-hidden">
      <MarketingNavbar />
      <main className="flex-1 relative z-0 w-full max-w-full overflow-x-hidden">{children}</main>
      <MarketingFooter />
    </div>
  );
}
