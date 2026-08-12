'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/', label: 'home' },
  { href: '/work', label: 'work' },
  { href: '/interests', label: 'interests' },
]

export function Nav() {
  const pathname = usePathname()

  return (
    <header style={{
      paddingTop: '48px',
      paddingBottom: '0',
      display: 'flex',
      alignItems: 'center',
      gap: '24px',
      flexWrap: 'wrap',
    }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--s4)' }}>
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="nav-link"
            data-current={pathname === link.href}
            style={{ fontSize: '14px' }}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        className="nav-link"
        aria-label="Open command menu"
        onClick={() => document.dispatchEvent(new CustomEvent('kiarad:open-command-palette'))}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          paddingBottom: '3px',
          fontFamily: 'inherit',
          fontSize: '13px',
          cursor: 'pointer',
        }}
      >
        ctrl+K
      </button>
    </header>
  )
}
