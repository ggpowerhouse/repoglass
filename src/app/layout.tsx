import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { GlassLightTracker } from "@/components/glass-light-tracker";
import { SearchPalette } from "@/components/search-palette";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoGlass · Drop a repo. Get judged like a founder.",
  description:
    "AI-judged GitHub repository leaderboard. 4 pillars · 16 parameters · evidence-cited reasoning. Built for BUILD-A-THON.",
  openGraph: {
    title: "RepoGlass",
    description:
      "Drop a repo. Get judged like a founder — across 16 evidence-cited parameters.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body
        className="antialiased min-h-screen"
        style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
      >
        <GlassLightTracker />
        <SearchPalette />
        {children}
        <Toaster
          theme="dark"
          position="top-center"
          richColors
          toastOptions={{
            style: {
              background: "rgba(14,14,14,0.9)",
              backdropFilter: "blur(24px) saturate(160%)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
            },
          }}
        />
      </body>
    </html>
  );
}
