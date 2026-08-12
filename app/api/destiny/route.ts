import { NextResponse } from 'next/server'

// raid.report/xb/4611686018497291008 → Xbox (membershipType 1)
const MEMBERSHIP_ID = '4611686018497291008'
const FALLBACK_TYPE = 1

const BUNGIE = 'https://www.bungie.net/Platform'
const RAID_MODE = 4 // DestinyActivityModeType.Raid

type Activity = {
  period: string
  activityDetails: { referenceId: number; mode: number }
  values: Record<string, { basic: { value: number; displayValue: string } }>
}

function headers(key: string) {
  return { 'X-API-Key': key, Accept: 'application/json' }
}

async function bungie<T>(path: string, key: string): Promise<T | null> {
  try {
    const res = await fetch(`${BUNGIE}${path}`, {
      headers: headers(key),
      next: { revalidate: 600 }, // 10 min — respect Bungie rate limits
    })
    if (!res.ok) return null
    const json = await res.json()
    if (json.ErrorCode !== 1) return null
    return json.Response as T
  } catch {
    return null
  }
}

/** Resolve the real membershipType in case of cross-save. */
async function resolveMembership(key: string) {
  const linked = await bungie<{
    profiles?: { membershipId: string; membershipType: number; dateLastPlayed: string }[]
  }>(`/Destiny2/${FALLBACK_TYPE}/Profile/${MEMBERSHIP_ID}/LinkedProfiles/?getAllMemberships=true`, key)

  const best = linked?.profiles
    ?.slice()
    .sort((a, b) => +new Date(b.dateLastPlayed) - +new Date(a.dateLastPlayed))[0]

  return best
    ? { id: best.membershipId, type: best.membershipType }
    : { id: MEMBERSHIP_ID, type: FALLBACK_TYPE }
}

async function activityName(hash: number, key: string) {
  const def = await bungie<{ displayProperties?: { name?: string } }>(
    `/Destiny2/Manifest/DestinyActivityDefinition/${hash}/`,
    key,
  )
  return def?.displayProperties?.name ?? null
}

export async function GET() {
  const key = process.env.BUNGIE_API_KEY
  if (!key) {
    // No key configured — the UI falls back to a plain label.
    return NextResponse.json({ configured: false }, { status: 200 })
  }

  const { id, type } = await resolveMembership(key)

  const profile = await bungie<{
    characters?: { data?: Record<string, { dateLastPlayed: string }> }
  }>(`/Destiny2/${type}/Profile/${id}/?components=200`, key)

  const characters = Object.entries(profile?.characters?.data ?? {})
    .sort((a, b) => +new Date(b[1].dateLastPlayed) - +new Date(a[1].dateLastPlayed))

  if (!characters.length) return NextResponse.json({ configured: true, found: false })

  // Most recent raid across characters
  let latest: { activity: Activity; name: string | null } | null = null

  for (const [characterId] of characters) {
    const history = await bungie<{ activities?: Activity[] }>(
      `/Destiny2/${type}/Account/${id}/Character/${characterId}/Stats/Activities/?count=1&mode=${RAID_MODE}`,
      key,
    )
    const act = history?.activities?.[0]
    if (!act) continue
    if (!latest || +new Date(act.period) > +new Date(latest.activity.period)) {
      latest = { activity: act, name: null }
    }
  }

  if (!latest) return NextResponse.json({ configured: true, found: false })

  // Fetch aggregate raid stats to get total clears
  const stats = await bungie<{
    allPvE?: { allTime?: Record<string, { basic: { value: number } }> }
    raid?: { allTime?: Record<string, { basic: { value: number } }> }
  }>(`/Destiny2/${type}/Account/${id}/Stats/?groups=1&modes=${RAID_MODE}`, key)

  const totalClears = stats?.raid?.allTime?.activitiesCleared?.basic?.value ?? null

  const name = await activityName(latest.activity.activityDetails.referenceId, key)
  const completed = latest.activity.values?.completed?.basic?.value === 1
  const durationSeconds = latest.activity.values?.activityDurationSeconds?.basic?.value ?? null

  return NextResponse.json({
    configured: true,
    found: true,
    raid: name,
    completed,
    period: latest.activity.period,
    durationSeconds,
    totalClears,
  })
}
