'use client'

import { useEffect, useRef, useState } from 'react'

// Glyph pool the scramble draws from mid-resolve. Kept mono-width and
// terminal-flavored (no accented/wide characters) so a scrambling word never
// changes line length or jitters its own line height.
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*-_/\\'

/** How long the whole resolve takes, end to end. */
const DURATION_MS = 500
/** How often glyphs re-randomize while unresolved. */
const FRAME_MS = 40

function prefersReducedMotion() {
  // SSR-safe: matchMedia doesn't exist on the server, and the real text is
  // exactly what a static/no-JS render should show anyway.
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Renders `word` with everything past `lockedCount` replaced by a random glyph. */
function scramble(word: string, lockedCount: number) {
  let next = ''
  for (let i = 0; i < word.length; i++) {
    const ch = word[i]
    if (ch === ' ') {
      next += ' '
    } else if (i < lockedCount) {
      next += ch
    } else {
      next += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
    }
  }
  return next
}

type Props = {
  text: string
  className?: string
  /**
   * `hover` (default): resolves on mouse/focus.
   * `manual`: resolves when `active` becomes true, controlled externally.
   * `mount`: resolves once automatically shortly after mount, then stays at rest.
   * `mount-then-hover`: same scramble-in on mount, then re-triggerable by
   * hover/click afterward — used where a click should replay the effect.
   */
  trigger?: 'hover' | 'manual' | 'mount' | 'mount-then-hover'
  /** When trigger="manual", set true to start a resolve pass. */
  active?: boolean
  /** When trigger="mount" or "mount-then-hover", delay before the first resolve. */
  delayMs?: number
  as?: 'span' | 'h1' | 'h2'
}

/**
 * Renders text that scrambles through random glyphs and resolves left-to-right
 * back into the real word, mirroring the decode/pulse effect on rodney.lol.
 *
 * The real string is always what's in the DOM at rest and on unmount, so
 * screen readers and copy/paste never see scrambled glyphs — only the
 * mid-animation frames are randomized, and those are the same length as the
 * source word so nothing reflows.
 *
 * `text` is assumed stable for the component's lifetime (every call site in
 * this project passes a fixed label). If a call site ever needs to swap the
 * word after mount, remount with a `key={text}` rather than reactively
 * resetting internal state — that keeps this component free of prop-sync
 * effects entirely.
 */
export function ScrambleText({ text, className, trigger = 'hover', active, delayMs = 0, as = 'span' }: Props) {
  // Lazy initializer reads matchMedia once at mount instead of setting state
  // from inside an effect body; the effect below only handles the ongoing
  // subscription, which is what effects are for.
  const [reduced, setReduced] = useState(prefersReducedMotion)
  // Always initialize to the real text so server and client render
  // identically — a Math.random()-based scramble here would run once
  // during SSR and again independently on the client, producing two
  // different strings and failing hydration. The mount trigger below is
  // what kicks off the scramble animation, and it only runs client-side
  // after hydration completes.
  const [display, setDisplay] = useState(text)
  const frame = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Redefined each render, so it always closes over the current `text` and
  // `reduced` without stashing either in a ref written during render.
  const resolve = () => {
    clearInterval(frame.current)
    clearTimeout(timeout.current)

    if (reduced) {
      // Deferred like the manual-trigger reset below: an async callback
      // rather than a setState call reachable synchronously from whatever
      // effect invoked resolve().
      timeout.current = setTimeout(() => setDisplay(text), 0)
      return
    }

    const word = text
    const len = word.length
    const start = performance.now()

    frame.current = setInterval(() => {
      const elapsed = performance.now() - start
      const progress = Math.min(elapsed / DURATION_MS, 1)
      // Left-to-right resolve: characters lock in order as progress advances.
      const lockedCount = Math.floor(progress * len)
      setDisplay(scramble(word, lockedCount))

      if (progress >= 1) {
        clearInterval(frame.current)
        setDisplay(word)
      }
    }, FRAME_MS)
  }

  // Mount trigger: resolves once automatically, after an optional delay —
  // the scramble-in reveal used in place of a typewriter effect. Runs once;
  // `text`/`delayMs` are treated as fixed for this component's lifetime.
  useEffect(() => {
    if (trigger !== 'mount' && trigger !== 'mount-then-hover') return
    timeout.current = setTimeout(resolve, delayMs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])

  // Manual trigger: an external `active` flag starts or stops a resolve
  // pass — a genuine "synchronize with an external signal" effect. The
  // effect itself only starts/stops timers; the state updates those timers
  // make happen later, on their own ticks, never synchronously in this
  // effect's call stack.
  useEffect(() => {
    if (trigger !== 'manual') return

    if (active) {
      resolve()
    } else {
      clearInterval(frame.current)
      clearTimeout(timeout.current)
      // setTimeout(0) rather than calling setDisplay directly: this makes
      // the reset an async callback rather than a synchronous call inside
      // the effect body, consistent with how `resolve`'s own setInterval
      // ticks update state — never synchronously from the effect itself.
      timeout.current = setTimeout(() => setDisplay(text), 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, trigger])

  useEffect(() => () => {
    clearInterval(frame.current)
    clearTimeout(timeout.current)
  }, [])

  const Tag = as
  const handlers = (trigger === 'hover' || trigger === 'mount-then-hover')
    ? { onMouseEnter: resolve, onFocus: resolve }
    : {}

  return (
    <Tag className={className} {...handlers}>
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{text}</span>
    </Tag>
  )
}
