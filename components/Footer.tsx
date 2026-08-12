'use client'

import { useState } from 'react'

const socialLinks = [
  { href: 'https://github.com/kiazh', label: 'github' },
  { href: 'https://www.linkedin.com/in/kiazh', label: 'linkedin' },
  { href: 'https://discord.com/users/431549003449237505', label: 'discord' },
  { href: 'https://myanimelist.net/profile/ki_shadow', label: 'mal' },
]

const EMAIL = 'kia.zheidari@gmail.com'

export function Footer() {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — email is still readable as text
    }
  }

  return (
    <footer style={{ paddingTop: '48px', paddingBottom: '64px' }}>
      <div style={{ display: 'flex', gap: 'var(--s4)', alignItems: 'center', marginBottom: 'var(--s4)', flexWrap: 'wrap' }}>
        {socialLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
            style={{ fontSize: '13px' }}
          >
            {link.label}
          </a>
        ))}
      </div>
      <button
        type="button"
        onClick={copyEmail}
        className="nav-link"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          paddingBottom: '3px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: '13px',
        }}
      >
        {copied ? 'copied :)' : `${EMAIL} — click to copy`}
      </button>
      <p lang="ja" style={{
        color: 'var(--muted)',
        fontSize: '12px',
        opacity: 0.5,
        marginTop: 'var(--s5)',
      }}>
        またね
      </p>
    </footer>
  )
}
