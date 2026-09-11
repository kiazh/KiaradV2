import type { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import { InterestsFull } from '@/components/sections/InterestsFull'
import { ScrambleText } from '@/components/ScrambleText'

export const metadata: Metadata = {
  title: 'interests — kiarad',
  description: "What Kiarad is into outside of coursework: anime/manga, physics, games, and long-term goals.",
}

export default function InterestsPage() {
  return (
    <div className="page-with-sidebar">
      <main style={{ maxWidth: '640px', width: '100%', padding: '0 24px', minHeight: '100vh' }}>
        <div style={{ paddingTop: 'var(--s7)' }}>
          <h1 className="reveal" style={{
            fontSize: '26px',
            fontWeight: 500,
            color: 'var(--fg)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'baseline',
            gap: '10px',
          }}>
            {/* Scrambles in on mount, same as the homepage name — every fresh
                route mount replays it, and it stays re-triggerable via hover/click. */}
            <ScrambleText text="Interests" trigger="mount-then-hover" delayMs={80} as="span" />
            <span lang="ja" aria-hidden="true" style={{ color: 'var(--muted)', fontSize: '14px', opacity: 0.45 }}>
              興味
            </span>
          </h1>

          <p className="reveal reveal-1" style={{ color: 'var(--fg)', fontSize: '15px', lineHeight: 1.7, maxWidth: '56ch', marginBottom: 'var(--s6)' }}>
            The stuff I actually spend my time thinking about when I&apos;m not doing coursework.
          </p>

          <div className="reveal reveal-2">
            <InterestsFull />
          </div>
        </div>

        <div style={{ marginTop: '64px' }}>
          <Footer />
        </div>
      </main>
    </div>
  )
}
