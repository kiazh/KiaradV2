import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SpotifyNowPlaying } from "@/components/SpotifyNowPlaying";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandPalette } from "@/components/CommandPalette";
import { CursorFollower } from "@/components/CursorFollower";

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
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
        <ErrorBoundary>
          <Providers>
            {children}
            <CommandPalette />
          </Providers>
        </ErrorBoundary>
        <SpotifyNowPlaying />
        <CursorFollower />
      </body>
    </html>
  );
}
