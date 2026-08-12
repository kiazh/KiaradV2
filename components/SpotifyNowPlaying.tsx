'use client'

import { useEffect, useState, useRef } from 'react'

interface SpotifyData {
  track: string
  artist: string
  url: string
  timestamps: { start: number; end: number } | null
}

interface LanyardData {
  success: boolean
  data?: {
    spotify?: {
      song: string
      artist: string
      track_id: string
      timestamps?: { start: number; end: number }
    }
    discord_user?: {
      username: string
    }
  }
}

const LANYARD_API = 'https://api.lanyard.rest/v1/users/431549003449237505'
const FETCH_TIMEOUT = 10000
const POLL_INTERVAL = 30000
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
  const [progress, setProgress] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const [currentTime, setCurrentTime] = useState(formatCurrentTime())
  const [isLoading, setIsLoading] = useState(true)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchWithTimeout = async (url: string, externalSignal?: AbortSignal): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT)
    externalSignal?.addEventListener('abort', () => controller.abort())

    try {
      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      return response
    } catch (err) {
      clearTimeout(timeoutId)
      throw err
    }
  }

  const fetchSpotify = async () => {
    if (abortControllerRef.current?.signal.aborted) return

    try {
      const res = await fetchWithTimeout(LANYARD_API, abortControllerRef.current?.signal)
      const data: LanyardData = await res.json()

      if (data.success) {
        if (data.data?.discord_user?.username) {
          setDiscordUsername(data.data.discord_user.username)
        }
        if (data.data?.spotify) {
          const s = data.data.spotify
          setSpotify({
            track: s.song,
            artist: s.artist,
            url: `https://open.spotify.com/track/${s.track_id}`,
            timestamps: s.timestamps ?? null,
          })
        } else {
          setSpotify(null)
        }
      } else {
        setSpotify(null)
      }
      setIsLoading(false)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setIsLoading(false)
    }
  }

  useEffect(() => {
    abortControllerRef.current = new AbortController()
    fetchSpotify()
    pollRef.current = setInterval(fetchSpotify, POLL_INTERVAL)

    return () => {
      abortControllerRef.current?.abort()
      if (pollRef.current) clearInterval(pollRef.current)
      if (tickRef.current) clearInterval(tickRef.current)
      if (timeRef.current) clearInterval(timeRef.current)
    }
  }, [])

  // Update current time every second
  useEffect(() => {
    const timeTick = () => setCurrentTime(formatCurrentTime())
    timeTick()
    timeRef.current = setInterval(timeTick, 1000)
    return () => {
      if (timeRef.current) clearInterval(timeRef.current)
    }
  }, [])

  // tick progress every second using timestamps from API
  useEffect(() => {
    if (tickRef.current) clearInterval(tickRef.current)
    if (!spotify?.timestamps) return

    const tick = () => {
      const { start, end } = spotify.timestamps!
      const duration = end - start
      const current = Math.min(Date.now() - start, duration)
      setElapsed(current)
      setProgress(current / duration)
    }

    tick()
    tickRef.current = setInterval(tick, 1000)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
    }
  }, [spotify])

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
          offline · {currentTime}
        </span>
      </div>
    )
  }

  const duration = spotify.timestamps ? spotify.timestamps.end - spotify.timestamps.start : 0

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
