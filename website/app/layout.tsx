import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://never-ruddy.vercel.app"),
  title: "NEVER — A second memory for your life",
  description:
    "A personal memory for your links, screenshots, documents and ideas. Explore the iPhone app, six Material Worlds and NEVER AI. Coming soon.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "NEVER",
    title: "NEVER — A second memory for your life",
    description: "Capture what matters. Keep the context. Find it when you need it. Coming to iPhone.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "NEVER — Your memory, without the maintenance" }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head><link rel="preload" as="image" href="/worlds/aurora.png" fetchPriority="high" /></head>
      <body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body>
    </html>
  );
}
