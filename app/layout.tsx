import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { SpotifyNowPlaying } from "@/components/SpotifyNowPlaying";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/CommandPalette";
import { CursorFollower } from "@/components/CursorFollower";
import { Sidebar } from "@/components/Sidebar";
import { BonsaiGhost } from "@/components/BonsaiGhost";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "Kiarad",
  description: "Math-Phys student at Waterloo. I build things from scratch to figure out how they work.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={plexMono.variable}>
      {/* suppressHydrationWarning: browser extensions (Grammarly, password
          managers) stamp attributes onto <body> before React hydrates. Scoped
          to this element's own attributes only — it does not cascade to children. */}
      <body className="min-h-screen" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <BonsaiGhost />
        <ErrorBoundary>
          <div className="app-shell">
            <Sidebar />
            <div id="main-content" className="app-content" tabIndex={-1}>
              {children}
            </div>
          </div>
          <CommandPalette />
        </ErrorBoundary>
        <SpotifyNowPlaying />
        <CursorFollower />
      </body>
    </html>
  );
}
