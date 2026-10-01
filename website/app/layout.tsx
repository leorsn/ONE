import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NEVER — Your memory, organized",
  description:
    "NEVER captures what matters, understands it, and brings it back when you need it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head><link rel="preload" as="image" href="/worlds/aurora.png" fetchPriority="high" /></head>
      <body><a className="skip-link" href="#main-content">Skip to content</a>{children}</body>
    </html>
  );
}
