'use client'

import { ScrambleText } from '@/components/ScrambleText'
import type { Project } from '@/lib/content'

export function ProjectList({ projects }: { projects: Project[] }) {
  return (
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
              <ScrambleText text={p.name} />
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
  )
}
