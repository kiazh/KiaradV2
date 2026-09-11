'use client'

import { useEffect, useState } from 'react'
import { ScrambleText } from '@/components/ScrambleText'

const NAME = 'Kiarad'
const TAGLINE = 'Math-Phys @ UWaterloo'

// The name resolves via ScrambleText's own mount trigger (no timing owned
// here). Only the tagline's typewriter is timed from this component,
// starting once the name's scramble-in has had a moment to read.
const TIMING = {
  normal: { nameDelayMs: 120, beforeTagline: 700, taglineMs: 45 },
  reduced: { nameDelayMs: 0, beforeTagline: 200, taglineMs: 22 },
}

// U+200B keeps a full-height line box in the tagline even at zero characters.
// Without it an empty span generates no line box, the line collapses to the
// caret's height, and the first character shoves the page down.
const ZWSP = '\u200B'

export function Intro() {
  const [tagCount, setTagCount] = useState(0)
  const [tagActive, setTagActive] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => { timer = setTimeout(resolve, ms) })

    const run = async () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const t = reduced ? TIMING.reduced : TIMING.normal

      // Give the name's own scramble-in a moment to read before the
      // tagline starts typing underneath it.
      await sleep(t.nameDelayMs + t.beforeTagline)
      if (cancelled) return

      setTagActive(true)
      for (let i = 1; i <= TAGLINE.length; i++) {
        setTagCount(i)
        await sleep(t.taglineMs)
        if (cancelled) return
      }
      setTagActive(false)
    }

    run()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  return (
    <>
      <h1 className="page-title">
        {/* Scrambles in once on mount, then re-scrambles on hover/click —
            the site's signature interaction, in place of the old typewriter. */}
        <ScrambleText text={NAME} trigger="mount-then-hover" delayMs={120} as="span" className="intro-name" />
      </h1>

      <p className="page-subtitle">
        {/* the animated copy is decorative; the real text is read from here */}
        <span className="sr-only">{TAGLINE}</span>
        <span aria-hidden="true" style={{ whiteSpace: 'pre' }}>
          {ZWSP}
          {TAGLINE.slice(0, tagCount)}
        </span>
        <span
          aria-hidden="true"
          className={['caret', 'caret-sm', tagActive ? 'caret-solid' : (tagCount === 0 ? 'caret-hidden' : '')].join(' ').trim()}
        />
      </p>
    </>
  )
}
