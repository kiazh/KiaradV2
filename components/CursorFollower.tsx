'use client'

import { useEffect, useRef, useState } from 'react'

const SIZE = 30
const HALF = SIZE / 2
const IDLE_MS = 900
const PRESS_SCALE = 0.65

// Exponential smoothing rate constants, per SECOND (not per frame).
// A per-frame lerp makes the ring's speed depend on refresh rate: the old
// 0.1/frame caught up in ~730ms at 60Hz but ~300ms at 144Hz, so the trail
// vanished on high-refresh displays. These reproduce the 60Hz feel everywhere.
//   0.9^60  = 0.0018 remaining after 1s -> lambda = -ln(0.0018) ~= 6.3
//   0.96^60 = 0.0865 remaining after 1s -> lambda = -ln(0.0865) ~= 2.4
const POS_LAMBDA = 6.3
const SCALE_LAMBDA = 2.4

// Guard against huge dt after a tab switch or dropped frames, which would
// otherwise teleport the ring.
const MAX_DT = 0.1

export function CursorFollower() {
  const [visible, setVisible] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [reduced, setReduced] = useState(false)

  const elRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: -SIZE, y: -SIZE })
  const target = useRef({ x: -SIZE, y: -SIZE })
  const scale = useRef(1)
  const targetScale = useRef(1)
  const seenMove = useRef(false)
  const raf = useRef<number>(0)
  const idleTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Capability check. (hover: none) means touch-only — no cursor to follow.
  useEffect(() => {
    const hoverMq = window.matchMedia('(hover: none)')
    const motionMq = window.matchMedia('(prefers-reduced-motion: reduce)')

    const sync = () => {
      setEnabled(!hoverMq.matches)
      setReduced(motionMq.matches)
    }
    sync()

    hoverMq.addEventListener('change', sync)
    motionMq.addEventListener('change', sync)
    return () => {
      hoverMq.removeEventListener('change', sync)
      motionMq.removeEventListener('change', sync)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_DT)
      last = now

      // Frame-rate independent: the fraction closed depends on elapsed time,
      // so the ring moves at the same real-world speed at 60Hz and 144Hz.
      // Under reduced motion the factor is 1 — snap, no trail.
      const kPos = reduced ? 1 : 1 - Math.exp(-POS_LAMBDA * dt)
      const kScale = reduced ? 1 : 1 - Math.exp(-SCALE_LAMBDA * dt)

      pos.current.x += (target.current.x - pos.current.x) * kPos
      pos.current.y += (target.current.y - pos.current.y) * kPos
      scale.current += (targetScale.current - scale.current) * kScale

      if (elRef.current) {
        elRef.current.style.transform =
          `translate(${pos.current.x - HALF}px, ${pos.current.y - HALF}px) ` +
          `scale(${scale.current.toFixed(3)})`
      }
      raf.current = requestAnimationFrame(tick)
    }

    const goIdle = () => {
      clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => setVisible(false), IDLE_MS)
    }

    const onMove = (e: MouseEvent) => {
      if (!seenMove.current) {
        // Snap on first sighting so it doesn't fly in from the corner
        pos.current = { x: e.clientX, y: e.clientY }
        seenMove.current = true
      }
      target.current = { x: e.clientX, y: e.clientY }
      setVisible(true)
      goIdle()
    }

    const onDown = () => { targetScale.current = PRESS_SCALE }
    const onUp = () => {
      targetScale.current = 1
      setVisible(true)
      goIdle()
    }
    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.documentElement.addEventListener('mouseleave', onLeave)
    document.documentElement.addEventListener('mouseenter', onEnter)
    raf.current = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.documentElement.removeEventListener('mouseleave', onLeave)
      document.documentElement.removeEventListener('mouseenter', onEnter)
      cancelAnimationFrame(raf.current)
      clearTimeout(idleTimer.current)
    }
  }, [enabled, reduced])

  if (!enabled) return null

  return (
    <div
      ref={elRef}
      aria-hidden="true"
      data-cursor-follower=""
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: SIZE,
        height: SIZE,
        borderRadius: '50%',
        border: '1.5px solid var(--fg)',
        pointerEvents: 'none',
        opacity: visible ? 0.28 : 0,
        transition: 'opacity 0.3s ease-out',
        zIndex: 200,
      }}
    />
  )
}
