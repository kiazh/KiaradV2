'use client'

import { useEffect, useState } from 'react'

const NAME = 'Kiarad'
const TAGLINE = 'Math-Phys @ UWaterloo'

// Reduced motion still reveals both lines — character-by-character text has no
// vestibular component — but it types once and stops. The delete/retype loop is
// indefinite motion, which is precisely what the setting should switch off.
const TIMING = {
  normal: {
    startMs: 120,
    nameMs: 130,
    beforeTagline: 320,
    taglineMs: 45,
    holdMs: 2600,
    deleteMs: 100,
    emptyMs: 500,
    loop: true,
  },
  reduced: {
    startMs: 0,
    nameMs: 60,
    beforeTagline: 120,
    taglineMs: 22,
    holdMs: 0,
    deleteMs: 0,
    emptyMs: 0,
    loop: false,
  },
}

// U+200B keeps a full-height line box in each line even at zero characters.
// Without it an empty span generates no line box, the line collapses to the
// caret's height, and the first character shoves the page down.
const ZWSP = '\u200B'

type CaretOn = 'name' | 'tagline'

export function Intro() {
  const [nameCount, setNameCount] = useState(0)
  const [tagCount, setTagCount] = useState(0)
  const [caretOn, setCaretOn] = useState<CaretOn>('name')
  const [active, setActive] = useState(true)

  useEffect(() => {
    let cancelled = false
    // Exactly one timer is ever pending, so an indefinite loop cannot accumulate.
    let timer: ReturnType<typeof setTimeout> | undefined

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => { timer = setTimeout(resolve, ms) })

    const run = async () => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const t = reduced ? TIMING.reduced : TIMING.normal

      const type = async (
        to: number,
        from: number,
        step: number,
        ms: number,
        set: (n: number) => void,
      ) => {
        for (let i = from; step > 0 ? i <= to : i >= to; i += step) {
          set(i)
          await sleep(ms)
          if (cancelled) return true
        }
        return false
      }

      await sleep(t.startMs)
      if (cancelled) return

      // 1. the name
      if (await type(NAME.length, 1, 1, t.nameMs, setNameCount)) return

      // 2. the tagline, once
      setActive(false)
      await sleep(t.beforeTagline)
      if (cancelled) return
      setCaretOn('tagline')
      setActive(true)
      if (await type(TAGLINE.length, 1, 1, t.taglineMs, setTagCount)) return
      setCaretOn('name')

      if (!t.loop) { setActive(false); return }

      // 3. hold, delete the name, retype it, forever
      for (;;) {
        setActive(false)
        await sleep(t.holdMs)
        if (cancelled) return

        setActive(true)
        if (await type(0, NAME.length - 1, -1, t.deleteMs, setNameCount)) return

        setActive(false)
        await sleep(t.emptyMs)
        if (cancelled) return

        setActive(true)
        if (await type(NAME.length, 1, 1, t.nameMs, setNameCount)) return
      }
    }

    run()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  // Both carets are always in the flow — only visibility changes. Adding or
  // removing one would resize its line (the tagline grew 4px when the caret
  // entered it) and shift everything below.
  const caretClass = (line: CaretOn, extra = '') => {
    const here = caretOn === line
    return [
      'caret',
      extra,
      here && active ? 'caret-solid' : '',
      here ? '' : 'caret-hidden',
    ].filter(Boolean).join(' ')
  }

  return (
    <>
      <h1 className="page-title" aria-label={NAME}>
        <span aria-hidden="true" style={{ whiteSpace: 'pre' }}>
          {ZWSP}
          {NAME.slice(0, nameCount)}
        </span>
        <span aria-hidden="true" className={caretClass('name')} />
      </h1>

      <p className="page-subtitle">
        {/* the animated copy is decorative; the real text is read from here */}
        <span className="sr-only">{TAGLINE}</span>
        <span aria-hidden="true" style={{ whiteSpace: 'pre' }}>
          {ZWSP}
          {TAGLINE.slice(0, tagCount)}
        </span>
        <span aria-hidden="true" className={caretClass('tagline', 'caret-sm')} />
      </p>
    </>
  )
}
