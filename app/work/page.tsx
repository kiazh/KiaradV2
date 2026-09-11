import type { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import { ProjectList } from '@/components/sections/ProjectList'
import { ScrambleText } from '@/components/ScrambleText'
import { projects } from '@/lib/content'

export const metadata: Metadata = {
  title: 'work — kiarad',
  description: 'Projects by Kiarad: systems programming, machine learning, and embedded work built from scratch.',
}

export default function WorkPage() {
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
            <ScrambleText text="Work" trigger="mount-then-hover" delayMs={80} as="span" />
            <span lang="ja" aria-hidden="true" style={{ color: 'var(--muted)', fontSize: '14px', opacity: 0.45 }}>
              仕事
            </span>
          </h1>

          <p className="reveal reveal-1" style={{ color: 'var(--fg)', fontSize: '15px', lineHeight: 1.7, maxWidth: '56ch', marginBottom: 'var(--s6)' }}>
            Most of my interests revolve around understanding systems at a fundamental level, whether that&apos;s physics, embedded systems, philosophy, or machine learning. Well I can larp and say I hate abstractions...
          </p>

          <ProjectList projects={projects} />
        </div>

        <div style={{ marginTop: '64px' }}>
          <Footer />
        </div>
      </main>
    </div>
  )
}
