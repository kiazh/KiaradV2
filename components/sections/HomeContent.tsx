import Link from 'next/link'
import { currently, recently } from '@/lib/content'
import { getDestinyStatus } from '@/lib/destiny'
import { DestinyStatus } from '@/components/DestinyStatus'
import { Intro } from '@/components/Intro'

export async function HomeContent() {
  // Fetched on the server (cached, shared across all visitors) so the raid name
  // and clear count ship in the initial HTML instead of popping in after mount.
  const destiny = await getDestinyStatus()

  return (
    <>
      <span
        aria-hidden="true"
        lang="ja"
        className="kanji-ghost"
        style={{
          position: 'absolute',
          top: '-24px',
          right: '4px',
          fontSize: 'clamp(4.5rem, 10vw, 7rem)',
          fontWeight: 400,
          lineHeight: 1,
          color: 'var(--muted)',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 0,
        }}
      >
        影
      </span>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Intro />

        <section className="reveal reveal-1 section">
          <SectionHead en="currently" ja="現在" />
          <ul className="rows">
            {currently.map((item) => (
              <Row key={item.label + item.value} label={item.label} value={item.value} href={item.href} />
            ))}
          </ul>
        </section>

        <section className="reveal reveal-2 section">
          <SectionHead en="recently" ja="最近" />
          <ul className="rows">
            <li className="row">
              <span className="row-label">raid</span>
              <span className="row-value"><DestinyStatus initial={destiny} /></span>
            </li>
            {recently.map((item) => (
              <Row key={item.value} label={item.label} value={item.value} href={item.href} />
            ))}
          </ul>
          <p style={{ marginTop: 'var(--s4)' }}>
            <Link href="/work" className="nav-link link-arrow" style={{ fontSize: '13px' }}>
              everything <span className="link-arrow-glyph">→</span>
            </Link>
          </p>
        </section>
      </div>
    </>
  )
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <li className="row">
      <span className="row-label">{label}</span>
      <span className="row-value">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="link-underline">
            {value}
            <span className="ext" aria-hidden="true">↗</span>
          </a>
        ) : value}
      </span>
    </li>
  )
}

function SectionHead({ en, ja }: { en: string; ja: string }) {
  return (
    <h2 className="section-head">
      <span className="section-head-en">{en}</span>
      <span lang="ja" aria-hidden="true" className="section-head-ja">{ja}</span>
    </h2>
  )
}
