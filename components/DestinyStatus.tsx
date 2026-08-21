'use client'

import { useEffect, useState } from 'react'
import type { DestinyStatusData } from '@/lib/destiny'

const RAID_REPORT = 'https://raid.report/xb/4611686018497291008'

const STORAGE_KEY = 'destiny-status-v1'
/** Don't resurrect a cached value older than this (ms). */
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000

function duration(seconds: number) {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

function isUsable(d: DestinyStatusData | null): d is DestinyStatusData {
  return !!d && d.configured && d.found === true && !!d.raid
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

function writeCache(data: DestinyStatusData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), data }))
  } catch {
    // localStorage can be unavailable (private mode, quota) — non-fatal.
  }
}

export function DestinyStatus({ initial = null }: { initial?: DestinyStatusData | null }) {
  // Seed from the server-rendered value so the first paint already has real
  // data and the markup matches the SSR output exactly (no hydration mismatch).
  const [data, setData] = useState<DestinyStatusData | null>(initial)

  useEffect(() => {
    // If the server couldn't supply data (Bungie down at build/request time),
    // fall back to the last value this browser saw. Runs after hydration, so
    // it cannot cause a mismatch.
    if (!isUsable(initial)) {
      const cached = readCache()
      if (cached) setData(cached)
    } else {
      writeCache(initial)
    }

    const ctrl = new AbortController()

    fetch('/api/destiny', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((fresh: DestinyStatusData | null) => {
        // Never downgrade a good value into the bare fallback.
        if (isUsable(fresh)) {
          setData(fresh)
          writeCache(fresh)
        }
      })
      .catch(() => {})

    return () => ctrl.abort()
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
