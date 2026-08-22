'use client'

import { useEffect, useState } from 'react'
import type { DestinyStatusData } from '@/lib/destiny'

const RAID_REPORT = 'https://raid.report/xb/4611686018497291008'

const STORAGE_KEY = 'destiny-status-v2'
/**
 * How long a stored value may still be shown on first paint. This only covers
 * the instant before the live refresh lands, so it stays short — a value that
 * should refresh every 10 min must never be presented as current a week later.
 */
const MAX_CACHE_AGE = 24 * 60 * 60 * 1000
/** Matches the server-side Bungie TTL so an open tab keeps up on its own. */
const REFRESH_MS = 10 * 60 * 1000
/** Don't re-hit the endpoint on every tab focus. */
const FOCUS_THROTTLE_MS = 60 * 1000

function duration(seconds: number) {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

function isUsable(d: DestinyStatusData | null | undefined): d is DestinyStatusData {
  return !!d && d.configured && d.found === true && !!d.raid
}

/** Newest wins, so a value can never move backward in time. */
function pickNewer(
  a: DestinyStatusData | null | undefined,
  b: DestinyStatusData | null | undefined,
): DestinyStatusData | null {
  const ua = isUsable(a) ? a : null
  const ub = isUsable(b) ? b : null
  if (!ua) return ub
  if (!ub) return ua
  return (ua.cachedAt ?? 0) >= (ub.cachedAt ?? 0) ? ua : ub
}

function readCache(): DestinyStatusData | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { savedAt: number; data: DestinyStatusData }
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_CACHE_AGE) return null
    return isUsable(parsed.data) ? parsed.data : null
  } catch {
    return null
  }
}

/** Only persist genuinely newer data, so a stale SSR seed can't clobber it. */
function writeCacheIfNewer(data: DestinyStatusData) {
  try {
    if (!isUsable(data)) return
    const stored = readCache()
    if (stored && (stored.cachedAt ?? 0) > (data.cachedAt ?? 0)) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    // localStorage can be unavailable (private mode, quota) — non-fatal.
  }
}

export function DestinyStatus({ initial = null }: { initial?: DestinyStatusData | null }) {
  // Seed with exactly the server-rendered value so the first paint has real
  // data and the markup matches the SSR output (no hydration mismatch).
  const [data, setData] = useState<DestinyStatusData | null>(initial)

  useEffect(() => {
    let cancelled = false
    let lastFetch = 0
    const ctrl = new AbortController()

    // The SSR seed comes from a page that may have been generated up to a TTL
    // ago, so reconcile it against whatever this browser already had and keep
    // whichever is newer. Runs post-hydration, so it can't cause a mismatch.
    const stored = readCache()
    const best = pickNewer(initial, stored)
    if (best && best !== initial) setData(best)
    if (isUsable(initial)) writeCacheIfNewer(initial)

    const load = async () => {
      if (Date.now() - lastFetch < 5000) return
      lastFetch = Date.now()

      try {
        // no-store: the browser must not replay an earlier response, which was
        // part of why reloads kept showing the same frozen numbers.
        const res = await fetch('/api/destiny', { cache: 'no-store', signal: ctrl.signal })
        if (!res.ok) return
        const fresh = (await res.json()) as DestinyStatusData
        if (cancelled || !isUsable(fresh)) return

        setData((prev) => pickNewer(fresh, prev) ?? fresh)
        writeCacheIfNewer(fresh)
      } catch {
        // Offline / aborted / bad JSON — keep showing what we have.
      }
    }

    load()

    // Keep a long-lived tab current without a reload.
    const interval = setInterval(load, REFRESH_MS)

    const onWake = () => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastFetch < FOCUS_THROTTLE_MS) return
      load()
    }
    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)

    return () => {
      cancelled = true
      ctrl.abort()
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
    }
  }, [initial])

  // No key / nothing cached anywhere → plain link, no broken UI
  if (!isUsable(data)) {
    return (
      <a href={RAID_REPORT} target="_blank" rel="noopener noreferrer" className="link-underline">
        Destiny 2
        <span className="ext" aria-hidden="true">↗</span>
      </a>
    )
  }

  return (
    <>
      <a href={RAID_REPORT} target="_blank" rel="noopener noreferrer" className="link-underline">
        {data.raid}
        <span className="ext" aria-hidden="true">↗</span>
      </a>
      {data.durationSeconds ? (
        <span className="dim">
          {' — '}
          {data.completed ? '' : 'wiped at '}
          {duration(data.durationSeconds)}
        </span>
      ) : null}
      {data.totalClears != null ? (
        <span className="dim">
          {' · '}
          {data.totalClears} total clears
        </span>
      ) : null}
    </>
  )
}
