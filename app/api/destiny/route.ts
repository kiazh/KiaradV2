import { NextResponse } from 'next/server'
import { getDestinyStatus } from '@/lib/destiny'

// This route must NEVER be cached as a static/ISR response.
//
// Rate-limit protection belongs on the upstream Bungie calls inside
// getDestinyStatus (10 min Data Cache), not on our own response. Caching this
// handler as well is what pinned the numbers: the CDN kept serving a frozen
// payload, and ISR's serve-stale-then-regenerate meant any update was always
// one request behind.
//
// revalidate = 0 forces dynamic rendering while leaving the explicit
// `next: { revalidate }` on each Bungie fetch intact, so the handler re-runs
// on every request but Bungie is still only hit once per TTL.
export const revalidate = 0
export const dynamic = 'force-dynamic'
export const fetchCache = 'default-cache'

export async function GET() {
  const data = await getDestinyStatus()

  return NextResponse.json(data, {
    headers: {
      // Neither the browser nor the CDN may hold on to this.
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    },
  })
}
