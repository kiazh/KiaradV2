import type { Metadata } from 'next'
import { Nav } from '@/components/Nav'
import { Footer } from '@/components/Footer'
import { projects } from '@/lib/content'

export const metadata: Metadata = {
  title: 'work — kiarad',
  description: 'Projects by Kiarad: systems programming, machine learning, and embedded work built from scratch.',
}

export default function WorkPage() {
  return (
    <main style={{ maxWidth: '640px', margin: '0 auto', padding: '0 24px', minHeight: '100vh' }}>
      <Nav />

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
          Work
          <span lang="ja" aria-hidden="true" style={{ color: 'var(--muted)', fontSize: '14px', opacity: 0.45 }}>
            仕事
          </span>
        </h1>

        <p className="reveal reveal-1" style={{ color: 'var(--fg)', fontSize: '15px', lineHeight: 1.7, maxWidth: '56ch', marginBottom: 'var(--s6)' }}>
          Most of my interests revolve around understanding systems at a fundamental level, whether that&apos;s physics, embedded systems, philosophy, or machine learning. Well I can larp and say I hate abstractions...
        </p>

        <ul className="reveal reveal-2" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--s5)' }}>
          {projects.map((p) => (
            <li key={p.name}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                <a
                  href={p.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-underline"
                  style={{ fontSize: '16px', fontWeight: 500 }}
                >
                  {p.name}
                </a>
                <span className="font-mono-accent" style={{ color: 'var(--muted)', fontSize: '12px' }}>
                  {p.year}
                </span>
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '15px', lineHeight: 1.7, margin: 0, maxWidth: '560px' }}>
                {p.description}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: '64px' }}>
        <Footer />
      </div>
    </main>
  )
}
