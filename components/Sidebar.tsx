'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ScrambleText } from '@/components/ScrambleText'

const navLinks = [
  { href: '/', label: 'home', kanji: '家' },
  { href: '/work', label: 'work', kanji: '仕事' },
  { href: '/interests', label: 'interests', kanji: '興味' },
]

const PAGE_TITLES: Record<string, string> = {
  '/': 'home',
  '/work': 'work',
  '/interests': 'interests',
}

/**
 * Terminal-rail sidebar nav. Rendered once from app/layout.tsx (not per
 * page) so it persists across client-side navigation — the rule's fill-in
 * is a mount animation, and remounting this component on every route
 * change replayed it on every tab switch.
 */
export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="sidebar-header">
          <span className="sidebar-prompt">
            <span className="sidebar-prompt-user">kiarad@site</span>
            <span className="sidebar-prompt-sep">:</span>
            <span className="sidebar-prompt-path">~{PAGE_TITLES[pathname] === 'home' ? '' : `/${PAGE_TITLES[pathname] ?? ''}`}</span>
            <span className="sidebar-prompt-sep">$</span>
          </span>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {navLinks.map((link) => {
            const current = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                className="sidebar-link"
                data-current={current}
              >
                <ScrambleText text={link.label} className="sidebar-link-label" />
                <span aria-hidden="true" className="sidebar-link-kanji">{link.kanji}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-rule" aria-hidden="true" />

        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-cmdk"
            aria-label="Open command menu"
            onClick={() => document.dispatchEvent(new CustomEvent('kiarad:open-command-palette'))}
          >
            ⌘ + K
          </button>
        </div>
      </div>
    </aside>
  )
}
