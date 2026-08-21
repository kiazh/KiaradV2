import { NextResponse } from 'next/server'
import { getDestinyStatus } from '@/lib/destiny'

// Match the Bungie player-data TTL so the route itself is cached too.
export const revalidate = 600

export async function GET() {
  const data = await getDestinyStatus()

  return NextResponse.json(data, {
    headers: {
      // Let the browser/CDN reuse this briefly, and keep serving it while
      // revalidating so a client refresh never blocks on Bungie.
      'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  })
}
