'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState, startTransition } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    startTransition(() => setMounted(true))
  }, [])

  if (!mounted) return <span style={{ color: 'var(--muted)', fontSize: '14px', width: '32px', display: 'inline-block' }} />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
      style={{
        color: 'var(--muted)',
        fontSize: '14px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        fontFamily: 'inherit',
        transition: 'color 0.15s ease',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--fg)')}
      onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)')}
    >
      {theme === 'dark' ? 'light' : 'dark'}
    </button>
  )
}
