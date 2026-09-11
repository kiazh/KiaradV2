import Link from 'next/link'
import { currently, recently } from '@/lib/content'
import { getDestinyStatus } from '@/lib/destiny'
import { DestinyStatus } from '@/components/DestinyStatus'
import { Intro } from '@/components/Intro'
import { SectionHead } from '@/components/SectionHead'

export async function HomeContent() {
  // Fetched on the server (cached, shared across all visitors) so the raid name
  // and clear count ship in the initial HTML instead of popping in after mount.
  const destiny = await getDestinyStatus()

  return (
    <>
      <Intro />

      <section className="reveal reveal-1 section">
        <SectionHead en="currently" ja="現在" />
        <ul className="rows">
          {currently.map((item) => (
            <Row key={item.label + item.value} label={item.label} value={item.value} href={item.href} emphasize={item.emphasize} />
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
    </>
  )
}

function Row({ label, value, href, emphasize }: { label: string; value: string; href?: string; emphasize?: boolean }) {
  return (
    <li className="row">
      <span className="row-label">{label}</span>
      <span className="row-value">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={emphasize ? 'link-underline link-glow' : 'link-underline'}
          >
            {value}
            <span className="ext" aria-hidden="true">↗</span>
          </a>
        ) : value}
      </span>
    </li>
  )
}
