'use client'

import { useEffect, useState } from 'react'

interface SpotifyData {
  track: string
  artist: string
  url: string
  timestamps: { start: number; end: number } | null
}

interface LanyardPresence {
  listening_to_spotify?: boolean
  discord_status?: string
  spotify?: {
    song: string
    artist: string
    track_id: string
    timestamps?: { start: number; end: number }
  } | null
  discord_user?: { username: string }
}

const USER_ID = '431549003449237505'
const LANYARD_REST = `https://api.lanyard.rest/v1/users/${USER_ID}`
const LANYARD_WS = 'wss://api.lanyard.rest/socket'

// Lanyard opcodes
const OP_EVENT = 0
const OP_HELLO = 1
const OP_INITIALIZE = 2
const OP_HEARTBEAT = 3

/** Only used while the socket is unavailable. */
const FALLBACK_POLL_MS = 20000
/** focus and visibilitychange both fire on one refocus — collapse them. */
const WAKE_THROTTLE_MS = 5000
const MAX_CHARS = 30

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function formatCurrentTime(): string {
  const now = new Date()
  const hours = now.getHours()
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength - 1) + '…'
}

export function SpotifyNowPlaying() {
  const [spotify, setSpotify] = useState<SpotifyData | null>(null)
  const [discordUsername, setDiscordUsername] = useState<string>('')
  const [discordStatus, setDiscordStatus] = useState<string>('offline')
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [currentTime, setCurrentTime] = useState(formatCurrentTime())
  const [isLoading, setIsLoading] = useState(true)

  // Derived primitives so the progress ticker only restarts when the actual
  // track window changes — not on every presence message.
  const start = spotify?.timestamps?.start ?? null
  const end = spotify?.timestamps?.end ?? null

  // Live presence over Lanyard's WebSocket.
  //
  // Polling alone could not keep this current: browsers throttle or freeze
  // setInterval in hidden/background tabs, so changing songs in Spotify (which
  // backgrounds the tab) left the widget stale until a manual reload. A socket
  // is pushed to, and we additionally resync whenever the tab is refocused.
  useEffect(() => {
    let ws: WebSocket | null = null
    let heartbeat: ReturnType<typeof setInterval> | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null
    let attempts = 0
    let unmounted = false
    let lastSync = 0

    const apply = (d: LanyardPresence | undefined) => {
      if (unmounted || !d) return

      if (d.discord_user?.username) setDiscordUsername(d.discord_user.username)
      setDiscordStatus(d.discord_status ?? 'offline')

      if (d.listening_to_spotify && d.spotify) {
        const s = d.spotify
        setSpotify({
          track: s.song,
          artist: s.artist,
          url: `https://open.spotify.com/track/${s.track_id}`,
          timestamps: s.timestamps ?? null,
        })
      } else {
        setSpotify(null)
      }
      setIsLoading(false)
    }

    const pollOnce = async () => {
      lastSync = Date.now()
      try {
        const res = await fetch(LANYARD_REST, { cache: 'no-store' })
        if (!res.ok) return
        const json = await res.json()
        if (json?.success) apply(json.data as LanyardPresence)
      } catch {
        // Offline or blocked — keep showing the last known state.
      }
    }

    const startPolling = () => {
      if (pollTimer || unmounted) return
      void pollOnce()
      pollTimer = setInterval(pollOnce, FALLBACK_POLL_MS)
    }

    const stopPolling = () => {
      if (pollTimer) clearInterval(pollTimer)
      pollTimer = null
    }

    const clearHeartbeat = () => {
      if (heartbeat) clearInterval(heartbeat)
      heartbeat = null
    }

    const connect = () => {
      if (unmounted) return

      try {
        ws = new WebSocket(LANYARD_WS)
      } catch {
        // WebSocket blocked entirely (some proxies) — degrade to polling.
        startPolling()
        return
      }

      ws.onmessage = (event) => {
        let msg: { op: number; d?: unknown; t?: string }
        try {
          msg = JSON.parse(event.data as string)
        } catch {
          return
        }

        if (msg.op === OP_HELLO) {
          // Socket is healthy: drop the fallback poller and subscribe.
          attempts = 0
          stopPolling()
          const interval = (msg.d as { heartbeat_interval?: number })?.heartbeat_interval ?? 30000
          ws?.send(JSON.stringify({ op: OP_INITIALIZE, d: { subscribe_to_id: USER_ID } }))
          clearHeartbeat()
          heartbeat = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: OP_HEARTBEAT }))
          }, interval)
          return
        }

        // Covers both INIT_STATE and PRESENCE_UPDATE.
        if (msg.op === OP_EVENT) apply(msg.d as LanyardPresence)
      }

      ws.onerror = () => {
        try {
          ws?.close()
        } catch {
          // onclose handles retry
        }
      }

      ws.onclose = () => {
        clearHeartbeat()
        if (unmounted) return

        attempts += 1
        // Keep the widget moving while the socket is down.
        if (attempts >= 2) startPolling()

        const backoff = Math.min(30000, 1000 * 2 ** Math.min(attempts, 5))
        reconnectTimer = setTimeout(connect, backoff + Math.random() * 500)
      }
    }

    connect()

    // Returning to the tab must not wait on a backoff timer or a throttled poll.
    const onWake = () => {
      if (unmounted || document.visibilityState !== 'visible') return

      const dead =
        !ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING

      if (dead) {
        if (reconnectTimer) clearTimeout(reconnectTimer)
        reconnectTimer = null
        attempts = 0
        connect()
      } else {
        // Socket looks alive but may have missed events while hidden.
        // focus and visibilitychange both fire on a single refocus, so throttle.
        if (Date.now() - lastSync > WAKE_THROTTLE_MS) void pollOnce()
      }
    }

    document.addEventListener('visibilitychange', onWake)
    window.addEventListener('focus', onWake)

    return () => {
      unmounted = true
      document.removeEventListener('visibilitychange', onWake)
      window.removeEventListener('focus', onWake)
      clearHeartbeat()
      if (reconnectTimer) clearTimeout(reconnectTimer)
      stopPolling()
      if (ws) {
        // Detach first so teardown doesn't schedule a reconnect.
        ws.onclose = null
        ws.onerror = null
        ws.onmessage = null
        try {
          ws.close()
        } catch {
          // already closing
        }
      }
    }
  }, [])

  // Update current time every second
  useEffect(() => {
    const timeTick = () => setCurrentTime(formatCurrentTime())
    timeTick()
    const id = setInterval(timeTick, 1000)
    return () => clearInterval(id)
  }, [])

  // Tick progress every second using timestamps from the API
  useEffect(() => {
    if (start == null || end == null) {
      setElapsed(0)
      setProgress(0)
      return
    }

    const tick = () => {
      const total = end - start
      if (total <= 0) return
      const current = Math.min(Date.now() - start, total)
      setElapsed(current)
      setProgress(current / total)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [start, end])

  const widgetStyle = {
    position: 'fixed' as const,
    bottom: '32px',
    left: '32px',
    fontFamily: 'var(--font-mono)',
    lineHeight: 1.4,
    zIndex: 50,
  }

  if (isLoading) {
    return (
      <div className="spotify-widget" style={widgetStyle}>
        <span style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '4px' }}>status</span>
        <div style={{ color: 'var(--muted)', fontSize: '18px', fontWeight: 400 }}>
          loading…
        </div>
      </div>
    )
  }

  if (!spotify) {
    return (
      <div className="spotify-widget" style={widgetStyle}>
        <span style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '4px' }}>status</span>
        <div style={{
          color: 'var(--fg)',
          fontSize: '18px',
          fontWeight: 500,
        }}>
          {truncate(discordUsername || 'offline', 25)}
        </div>
        <span style={{
          color: 'var(--muted)',
          fontSize: '14px',
          marginTop: '2px',
        }}>
          {discordStatus} · {currentTime}
        </span>
      </div>
    )
  }

  const duration = start != null && end != null ? end - start : 0

  return (
    <div className="spotify-widget" style={widgetStyle}>
      <span style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '4px' }}>listening to</span>
      <a
        href={spotify.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: 'var(--fg)',
          fontSize: '18px',
          fontWeight: 500,
          textDecoration: 'none',
          maxWidth: '220px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)')}
        onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.color = 'var(--fg)')}
      >
        {truncate(spotify.track, MAX_CHARS)}
      </a>
      <span style={{
        color: 'var(--muted)',
        fontSize: '14px',
        marginTop: '2px',
        maxWidth: '220px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {truncate(spotify.artist, MAX_CHARS)}
      </span>

      {duration > 0 && (
        <>
          <div style={{
            marginTop: '10px',
            width: '220px',
            height: '2px',
            background: 'var(--border)',
            borderRadius: '1px',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: '100%',
              background: 'var(--muted)',
              transform: `scaleX(${Math.min(progress, 1)})`,
              transformOrigin: 'left',
              transition: 'transform 1s linear',
            }} />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '220px',
            marginTop: '5px',
            fontSize: '11px',
            color: 'var(--muted)',
            opacity: 0.7,
          }}>
            <span>{formatTime(elapsed)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </>
      )}
    </div>
  )
}
