'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
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
 *
 * Mobile (<=860px): the rail collapses to a sticky top bar showing only the
 * prompt + command button + hamburger. Nav links live in a right-side
 * drawer so prompt + links + ⌘K never crowd a 320px viewport.
 */
export function Sidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const prevFocus = useRef<HTMLElement | null>(null)

  const close = useCallback(() => setOpen(false), [])

  // Route change must never leave the drawer open (this component persists
  // across client-side navigation by design). Async reset like ScrambleText:
  // never a synchronous setState inside the effect body.
  useEffect(() => {
    const t = setTimeout(() => setOpen(false), 0)
    return () => clearTimeout(t)
  }, [pathname])

  // Scroll-lock + focus management while the drawer is open.
  useEffect(() => {
    if (!open) return
    prevFocus.current = document.activeElement as HTMLElement | null
    const trigger = triggerRef.current
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Move focus into the drawer on open.
    const t = setTimeout(() => drawerRef.current?.querySelector<HTMLElement>('a, button')?.focus(), 0)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }
      // Minimal focus trap: cycle Tab within the drawer.
      if (e.key === 'Tab' && drawerRef.current) {
        const items = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
        ).filter((el) => el.offsetParent !== null)
        if (!items.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      // Return focus to the trigger that opened the drawer.
      if (prevFocus.current) prevFocus.current.focus?.()
      else trigger?.focus?.()
    }
  }, [open, close])

  const openPalette = useCallback(() => {
    close()
    document.dispatchEvent(new CustomEvent('kiarad:open-command-palette'))
  }, [close])

  return (
    <>
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

        <nav className="sidebar-nav sidebar-nav-inline" aria-label="Primary">
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
            onClick={openPalette}
          >
            <span aria-hidden="true" className="sidebar-cmdk-full">⌘ + K</span>
            <span aria-hidden="true" className="sidebar-cmdk-short">⌘K</span>
          </button>
          <button
            ref={triggerRef}
            type="button"
            className="sidebar-menu-btn"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className="sidebar-menu-icon">
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>
    </aside>

    <div
      className="sidebar-scrim"
      data-open={open}
      aria-hidden="true"
      onClick={close}
    />
    <div
      ref={drawerRef}
      id="mobile-nav"
      className="sidebar-drawer"
      data-open={open}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      aria-hidden={!open}
      inert={!open}
    >
      <div className="sidebar-drawer-head">
        <span className="sidebar-prompt" aria-hidden="true">
          <span className="sidebar-prompt-user">kiarad@site</span>
          <span className="sidebar-prompt-sep">:</span>
          <span className="sidebar-prompt-path">~/menu</span>
          <span className="sidebar-prompt-sep">$</span>
        </span>
        <button
          type="button"
          className="sidebar-drawer-close"
          aria-label="Close navigation menu"
          onClick={close}
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <nav className="sidebar-drawer-nav" aria-label="Mobile">
        {navLinks.map((link) => {
          const current = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className="sidebar-drawer-link"
              data-current={current}
              aria-current={current ? 'page' : undefined}
              onClick={close}
              tabIndex={open ? 0 : -1}
            >
              <ScrambleText text={link.label} className="sidebar-link-label" />
              <span aria-hidden="true" className="sidebar-link-kanji">{link.kanji}</span>
            </Link>
          )
        })}
      </nav>
      <div className="sidebar-drawer-foot">
        <button
          type="button"
          className="sidebar-drawer-cmdk"
          onClick={openPalette}
          tabIndex={open ? 0 : -1}
        >
          command menu <span aria-hidden="true">⌘K</span>
        </button>
      </div>
    </div>
    </>
  )
}
