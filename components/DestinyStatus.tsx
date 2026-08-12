'use client'

import { useEffect, useState } from 'react'

type Data = {
  configured: boolean
  found?: boolean
  raid?: string | null
  completed?: boolean
  durationSeconds?: number | null
}

function duration(seconds: number) {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem ? `${h}h ${rem}m` : `${h}h`
}

const RAID_REPORT = 'https://raid.report/xb/4611686018497291008'

export function DestinyStatus() {
  const [data, setData] = useState<Data | null>(null)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/destiny', { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
    return () => ctrl.abort()
  }, [])

  // No key / no data yet → plain link, no broken UI
  if (!data?.configured || !data.found || !data.raid) {
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
    </>
  )
}
