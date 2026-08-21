// Shared Bungie/Destiny data layer.
//
// Used by BOTH the API route (`app/api/destiny/route.ts`) and the server render
// (`components/sections/HomeContent.tsx`). Keeping it in one place means the
// initial HTML and the client refresh go through identical logic and share the
// same Next.js fetch cache — no internal self-HTTP call during SSR.

// raid.report/xb/4611686018497291008 → Xbox (membershipType 1)
const MEMBERSHIP_ID = '4611686018497291008'
const FALLBACK_TYPE = 1

const BUNGIE = 'https://www.bungie.net/Platform'
const RAID_MODE = 4 // DestinyActivityModeType.Raid

// Live player data: refresh every 10 min to respect Bungie rate limits.
const PLAYER_TTL = 600
// Manifest definitions (raid names) effectively never change between releases.
const MANIFEST_TTL = 86_400

export type DestinyStatusData = {
  configured: boolean
  found: boolean
  raid?: string | null
  completed?: boolean
  period?: string | null
  durationSeconds?: number | null
  totalClears?: number | null
  /** epoch ms when this payload was successfully built from Bungie */
  cachedAt?: number
  /** true when Bungie failed and we are serving the last known good payload */
  stale?: boolean
}

type Activity = {
  period: string
  activityDetails: { referenceId: number; mode: number }
  values: Record<string, { basic: { value: number; displayValue: string } }>
}

/**
 * Last known good payload, held in module scope.
 *
 * This is per-serverless-instance and intentionally best effort: it is a
 * resilience layer, not a database. Its job is to stop a single transient
 * Bungie failure (rate limit, 5xx, timeout) from blanking the widget and
 * forcing the visitor to reload several times before data appears.
 */
let lastGood: DestinyStatusData | null = null

function headers(key: string) {
  return { 'X-API-Key': key, Accept: 'application/json' }
}

async function bungie<T>(path: string, key: string, revalidate = PLAYER_TTL): Promise<T | null> {
  try {
    const res = await fetch(`${BUNGIE}${path}`, {
      headers: headers(key),
      next: { revalidate },
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
    MANIFEST_TTL,
  )
  return def?.displayProperties?.name ?? null
}

/** Serve the previous good payload if we have one, otherwise a safe empty result. */
function degraded(): DestinyStatusData {
  if (lastGood) return { ...lastGood, stale: true }
  return { configured: true, found: false }
}

export async function getDestinyStatus(): Promise<DestinyStatusData> {
  const key = process.env.BUNGIE_API_KEY
  if (!key) {
    // No key configured — the UI falls back to a plain label.
    return { configured: false, found: false }
  }

  try {
    const { id, type } = await resolveMembership(key)

    // Profile and account-wide raid stats are independent → run them together.
    const [profile, stats] = await Promise.all([
      bungie<{ characters?: { data?: Record<string, { dateLastPlayed: string }> } }>(
        `/Destiny2/${type}/Profile/${id}/?components=200`,
        key,
      ),
      bungie<Record<string, { allTime?: Record<string, { basic: { value: number } }> }>>(
        // characterId 0 = account-wide aggregate
        `/Destiny2/${type}/Account/${id}/Character/0/Stats/?groups=1&modes=${RAID_MODE}`,
        key,
      ),
    ])

    const characters = Object.entries(profile?.characters?.data ?? {}).sort(
      (a, b) => +new Date(b[1].dateLastPlayed) - +new Date(a[1].dateLastPlayed),
    )

    if (!characters.length) return degraded()

    // Most recent raid across characters — fetch every character concurrently
    // instead of sequentially, which was the main source of cold-load latency.
    const histories = await Promise.all(
      characters.map(([characterId]) =>
        bungie<{ activities?: Activity[] }>(
          `/Destiny2/${type}/Account/${id}/Character/${characterId}/Stats/Activities/?count=1&mode=${RAID_MODE}`,
          key,
        ),
      ),
    )

    let latest: Activity | null = null
    for (const history of histories) {
      const act = history?.activities?.[0]
      if (!act) continue
      if (!latest || +new Date(act.period) > +new Date(latest.period)) latest = act
    }

    if (!latest) return degraded()

    const totalClears = stats?.raid?.allTime?.activitiesCleared?.basic?.value ?? null
    const name = await activityName(latest.activityDetails.referenceId, key)

    // A raid with no resolvable name would render as an empty link — treat as failure.
    if (!name) return degraded()

    const fresh: DestinyStatusData = {
      configured: true,
      found: true,
      raid: name,
      completed: latest.values?.completed?.basic?.value === 1,
      period: latest.period,
      durationSeconds: latest.values?.activityDurationSeconds?.basic?.value ?? null,
      totalClears,
      cachedAt: Date.now(),
      stale: false,
    }

    lastGood = fresh
    return fresh
  } catch {
    return degraded()
  }
}
