'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { useTheme } from 'next-themes'

type Action = {
  id: string
  label: string
  hint?: string
  onSelect: () => void
}

const navTargets = [
  { id: 'home', label: 'home', href: '/' },
  { id: 'work', label: 'work', href: '/work' },
  { id: 'interests', label: 'interests', href: '/interests' },
]

const connectLinks = [
  { id: 'github', label: 'GitHub', hint: 'kiazh', href: 'https://github.com/kiazh' },
  { id: 'linkedin', label: 'LinkedIn', hint: 'kiazh', href: 'https://www.linkedin.com/in/kiazh' },
  { id: 'email', label: 'Email', hint: 'kia.zheidari@gmail.com', href: 'mailto:kia.zheidari@gmail.com' },
  { id: 'discord', label: 'Discord', hint: 'k1azh', href: 'https://discord.com/users/431549003449237505' },
  { id: 'mal', label: 'MyAnimeList', hint: 'ki_shadow', href: 'https://myanimelist.net/profile/ki_shadow' },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isTrigger = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)
      if (isTrigger) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    const onExternalOpen = () => setOpen((prev) => !prev)

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('kiarad:open-command-palette', onExternalOpen)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('kiarad:open-command-palette', onExternalOpen)
    }
  }, [])

  const goTo = useCallback((href: string) => {
    close()
    router.push(href)
  }, [close, router])

  const openLink = useCallback((href: string, external: boolean) => {
    if (external) {
      window.open(href, '_blank', 'noopener,noreferrer')
    } else {
      window.location.href = href
    }
    close()
  }, [close])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
    close()
  }, [theme, setTheme, close])

  const navActions: Action[] = navTargets.map((s) => ({
    id: s.id,
    label: s.label,
    onSelect: () => goTo(s.href),
  }))

  const connectActions: Action[] = connectLinks.map((c) => ({
    id: c.id,
    label: c.label,
    hint: c.hint,
    onSelect: () => openLink(c.href, !c.href.startsWith('mailto')),
  }))

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Command menu"
      shouldFilter
      style={{
        position: 'fixed',
        top: '18%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(480px, calc(100vw - 32px))',
        background: 'var(--bg)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        boxShadow: '0 20px 60px -20px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono), monospace',
        zIndex: 100,
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '14px 16px',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ color: 'var(--muted)', fontSize: '13px' }} aria-hidden="true">⌘K</span>
        <Command.Input
          placeholder="Where to?"
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: 'var(--fg)',
            fontSize: '15px',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <Command.List style={{ maxHeight: '340px', overflowY: 'auto', padding: '8px' }}>
        <Command.Empty style={{ color: 'var(--muted)', fontSize: '14px', padding: '16px', textAlign: 'center' }}>
          No results.
        </Command.Empty>

        <Command.Group
          heading={<CommandGroupLabel>go to</CommandGroupLabel>}
        >
          {navActions.map((a) => (
            <PaletteItem key={a.id} action={a} />
          ))}
        </Command.Group>

        <Command.Group heading={<CommandGroupLabel>connect</CommandGroupLabel>}>
          {connectActions.map((a) => (
            <PaletteItem key={a.id} action={a} />
          ))}
        </Command.Group>

        <Command.Group heading={<CommandGroupLabel>theme</CommandGroupLabel>}>
          <PaletteItem
            action={{
              id: 'theme',
              label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
              onSelect: toggleTheme,
            }}
          />
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  )
}

function CommandGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      color: 'var(--muted)',
      fontSize: '11px',
      fontWeight: 500,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      padding: '10px 10px 6px',
    }}>
      {children}
    </div>
  )
}

function PaletteItem({ action }: { action: Action }) {
  return (
    <Command.Item
      value={action.label}
      onSelect={action.onSelect}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '10px 10px',
        borderRadius: '6px',
        cursor: 'pointer',
        color: 'var(--fg)',
        fontSize: '15px',
      }}
      className="cmdk-item"
    >
      <span>{action.label}</span>
      {action.hint && (
        <span style={{ color: 'var(--muted)', fontSize: '13px' }}>{action.hint}</span>
      )}
    </Command.Item>
  )
}
