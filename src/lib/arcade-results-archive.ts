import { formatSongLabel } from '@/content/arcade-songs'

const REGION_DEFINITIONS = [
  {
    key: 'seoul',
    label: '1차 서울',
    shortLabel: '서울',
    arcade: 'TAIKO LABS',
    image: '/branding/venue-seoul.webp',
  },
  {
    key: 'daejeon',
    label: '2차 대전',
    shortLabel: '대전',
    arcade: '대전 싸이뮤직 게임월드',
    image: '/branding/venue-daejeon.webp',
  },
  {
    key: 'gwangju',
    label: '3차 광주',
    shortLabel: '광주',
    arcade: '광주 게임플라자',
    image: '/branding/venue-gwangju.webp',
  },
  {
    key: 'busan',
    label: '4차 부산',
    shortLabel: '부산',
    arcade: '게임D',
    image: '/branding/venue-busan.webp',
  },
] as const

export type ArcadeRegionKey = (typeof REGION_DEFINITIONS)[number]['key']

type RegionDefinition = {
  key: ArcadeRegionKey
  label: string
  shortLabel: string
  arcade: string
  image: string
}

export type ArcadeParticipant = {
  entryId: string
  nickname: string
  seed?: number
}

export type ArcadeOnlineRow = {
  rank: number
  entryId: string
  nickname: string
  score1: number
  score2: number
  total: number
  submittedAt?: string
  advanced?: boolean
}

export type ArcadeSwissGame = {
  song: string
  level?: string
  p1Score: number
  p2Score: number
}

export type ArcadeSwissMatch = {
  round: number
  table?: number
  highSeedEntryId?: string
  player1: ArcadeParticipant
  player2?: ArcadeParticipant
  games: ArcadeSwissGame[]
  winnerEntryId?: string
  tieBreakerSong?: string
  bye?: boolean
  note?: string
}

export type ArcadeStandingRow = {
  entryId: string
  nickname: string
  seed: number
  wins: number
  losses: number
  status: 'alive' | 'qualified' | 'decider' | 'eliminated'
}

export type ArcadeScoreAttackRow = {
  rank: number
  entryId: string
  nickname: string
  score: number
  note?: string
}

export type ArcadeRegistrationMap = Record<
  string,
  { offlineSongs?: string[] }
>

export type ArcadeRegionArchive = {
  key: ArcadeRegionKey
  label: string
  shortLabel: string
  arcade: string
  image: string
  updatedAt?: string
  onlineRows: ArcadeOnlineRow[]
  swissMatches: ArcadeSwissMatch[]
  swissStandings: ArcadeStandingRow[]
  deciderRows: ArcadeScoreAttackRow[]
  deciderWinnerEntryId?: string
  seedingRows: ArcadeScoreAttackRow[]
  qualifiers: {
    groupA?: ArcadeParticipant
    groupB?: ArcadeParticipant
  }
  registrations?: ArcadeRegistrationMap
}

export type ArcadeFinalSeedRow = {
  seed: number
  regionKey: ArcadeRegionKey
  regionLabel: string
  entryId: string
  nickname: string
  score?: number
}

export type ArcadeFinalCrossMatch = {
  matchNo: number
  left: ArcadeFinalSeedRow
  right: ArcadeFinalSeedRow
  winnerEntryId?: string
  note?: string
}

export type ArcadeFinalsArchive = {
  updatedAt?: string
  groupASeeds: ArcadeFinalSeedRow[]
  groupBSeeds: ArcadeFinalSeedRow[]
  crossMatches: ArcadeFinalCrossMatch[]
}

export type ArcadeSeasonArchive = {
  season: string
  title: string
  updatedAt?: string
  songs: {
    online1: string
    online2: string
    decider31: string
    seeding: string
  }
  regions: ArcadeRegionArchive[]
  finals: ArcadeFinalsArchive
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const normalized = value.trim()
    return normalized.length ? normalized : undefined
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return undefined
}

function toNumberValue(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined
  }
  if (typeof value === 'string') {
    const normalized = Number(value.replace(/,/g, '').trim())
    return Number.isFinite(normalized) ? normalized : undefined
  }
  return undefined
}

function normalizeRegionKey(value: unknown): ArcadeRegionKey | null {
  const text = toStringValue(value)?.toLowerCase()
  if (!text) return null
  if (text.includes('seoul') || text.includes('서울')) return 'seoul'
  if (text.includes('daejeon') || text.includes('대전')) return 'daejeon'
  if (text.includes('gwangju') || text.includes('광주')) return 'gwangju'
  if (text.includes('busan') || text.includes('부산')) return 'busan'
  return null
}

function getRegionDefinition(key: ArcadeRegionKey): RegionDefinition {
  return REGION_DEFINITIONS.find((region) => region.key === key)!
}

function buildEmptyRegion(key: ArcadeRegionKey): ArcadeRegionArchive {
  const def = getRegionDefinition(key)
  return {
    key,
    label: def.label,
    shortLabel: def.shortLabel,
    arcade: def.arcade,
    image: def.image,
    onlineRows: [],
    swissMatches: [],
    swissStandings: [],
    deciderRows: [],
    seedingRows: [],
    qualifiers: {},
  }
}

function normalizeParticipant(
  value: unknown,
  fallbackIndex = 0
): ArcadeParticipant | undefined {
  const record = toRecord(value)
  if (!record) return undefined
  const entryId =
    toStringValue(record.entryId) ??
    toStringValue(record.id) ??
    toStringValue(record.code)
  const nickname =
    toStringValue(record.nickname) ??
    toStringValue(record.name) ??
    toStringValue(record.player)

  if (!entryId && !nickname) return undefined

  return {
    entryId: entryId ?? `E-UNK-${fallbackIndex + 1}`,
    nickname: nickname ?? entryId ?? `선수 ${fallbackIndex + 1}`,
    seed: toNumberValue(record.seed),
  }
}

function normalizeOnlineRow(
  value: unknown,
  fallbackRank: number
): ArcadeOnlineRow | undefined {
  const record = toRecord(value)
  if (!record) return undefined
  const rank = toNumberValue(record.rank) ?? fallbackRank
  const entryId =
    toStringValue(record.entryId) ??
    toStringValue(record.id) ??
    toStringValue(record.code) ??
    `E-UNK-${rank}`
  const nickname =
    toStringValue(record.nickname) ??
    toStringValue(record.name) ??
    toStringValue(record.player) ??
    entryId
  const score1 = toNumberValue(record.score1) ?? 0
  const score2 = toNumberValue(record.score2) ?? 0
  const total = toNumberValue(record.total) ?? score1 + score2

  return {
    rank,
    entryId,
    nickname,
    score1,
    score2,
    total,
    submittedAt:
      toStringValue(record.submittedAt) ?? toStringValue(record.entryAt),
    advanced: Boolean(record.advanced),
  }
}

function normalizeSwissGame(value: unknown): ArcadeSwissGame | undefined {
  const record = toRecord(value)
  if (!record) return undefined
  const song = toStringValue(record.song)
  if (!song) return undefined
  return {
    song,
    level: toStringValue(record.level),
    p1Score: toNumberValue(record.p1Score) ?? 0,
    p2Score: toNumberValue(record.p2Score) ?? 0,
  }
}

function normalizeSwissMatch(
  value: unknown,
  fallbackIndex: number
): ArcadeSwissMatch | undefined {
  const record = toRecord(value)
  if (!record) return undefined

  const player1 = normalizeParticipant(
    record.player1 ?? record.left,
    fallbackIndex
  )
  if (!player1) return undefined

  const player2 = normalizeParticipant(
    record.player2 ?? record.right,
    fallbackIndex + 1
  )

  const games = toArray(record.games)
    .map((game) => normalizeSwissGame(game))
    .filter((game): game is ArcadeSwissGame => Boolean(game))

  return {
    round: toNumberValue(record.round) ?? 1,
    table: toNumberValue(record.table),
    highSeedEntryId:
      toStringValue(record.highSeedEntryId) ??
      toStringValue(record.sideSelector),
    player1,
    player2,
    games,
    winnerEntryId: toStringValue(record.winnerEntryId),
    tieBreakerSong: toStringValue(record.tieBreakerSong),
    bye: Boolean(record.bye),
    note: toStringValue(record.note),
  }
}

function normalizeStandingRow(
  value: unknown,
  fallbackIndex: number
): ArcadeStandingRow | undefined {
  const record = toRecord(value)
  if (!record) return undefined

  const entryId =
    toStringValue(record.entryId) ??
    toStringValue(record.id) ??
    `E-UNK-${fallbackIndex + 1}`
  const nickname =
    toStringValue(record.nickname) ?? toStringValue(record.name) ?? entryId
  const statusText = toStringValue(record.status)?.toLowerCase()

  const status: ArcadeStandingRow['status'] =
    statusText === 'qualified' ||
    statusText === 'decider' ||
    statusText === 'eliminated'
      ? statusText
      : 'alive'

  return {
    entryId,
    nickname,
    seed: toNumberValue(record.seed) ?? fallbackIndex + 1,
    wins: toNumberValue(record.wins) ?? 0,
    losses: toNumberValue(record.losses) ?? 0,
    status,
  }
}

function normalizeScoreAttackRow(
  value: unknown,
  fallbackRank: number
): ArcadeScoreAttackRow | undefined {
  const record = toRecord(value)
  if (!record) return undefined
  const rank = toNumberValue(record.rank) ?? fallbackRank
  const entryId =
    toStringValue(record.entryId) ?? toStringValue(record.id) ?? `E-UNK-${rank}`
  const nickname =
    toStringValue(record.nickname) ?? toStringValue(record.name) ?? entryId

  return {
    rank,
    entryId,
    nickname,
    score: toNumberValue(record.score) ?? 0,
    note: toStringValue(record.note),
  }
}

function normalizeRegistrations(
  value: unknown
): ArcadeRegistrationMap | undefined {
  const record = toRecord(value)
  if (!record) return undefined

  const result: ArcadeRegistrationMap = {}
  for (const [key, raw] of Object.entries(record)) {
    const entry = toRecord(raw)
    if (!entry) continue
    // Handle both array and comma-separated string from GAS
    let songs: string[]
    if (Array.isArray(entry.offlineSongs)) {
      songs = entry.offlineSongs
        .map((s: unknown) => (typeof s === 'string' ? s.trim() : ''))
        .filter((s: string) => s.length > 0)
    } else if (typeof entry.offlineSongs === 'string') {
      const songsRaw = entry.offlineSongs
      songs = (songsRaw.includes(' || ')
        ? songsRaw.split(' || ')
        : songsRaw.split(','))
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0)
    } else {
      continue
    }
    if (songs.length > 0) {
      result[key] = { offlineSongs: songs }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

function normalizeRegionArchive(
  key: ArcadeRegionKey,
  value: unknown
): ArcadeRegionArchive {
  const base = buildEmptyRegion(key)
  const record = toRecord(value)
  if (!record) return base

  const onlineSource =
    toArray(record.onlineRows).length > 0
      ? toArray(record.onlineRows)
      : toArray(toRecord(record.online)?.rows)

  const swissSource =
    toArray(record.swissMatches).length > 0
      ? toArray(record.swissMatches)
      : toArray(toRecord(record.swiss)?.matches)

  const standingsSource =
    toArray(record.swissStandings).length > 0
      ? toArray(record.swissStandings)
      : toArray(toRecord(record.swiss)?.standings)

  const deciderSource =
    toArray(record.deciderRows).length > 0
      ? toArray(record.deciderRows)
      : toArray(toRecord(record.decider31)?.rows)

  const seedingSource =
    toArray(record.seedingRows).length > 0
      ? toArray(record.seedingRows)
      : toArray(toRecord(record.seeding)?.rows)

  const qualifiersRecord =
    toRecord(record.qualifiers) ??
    toRecord(toRecord(record.seeding)?.qualifiers) ??
    {}

  return {
    ...base,
    label: toStringValue(record.label) ?? base.label,
    shortLabel: toStringValue(record.shortLabel) ?? base.shortLabel,
    updatedAt: toStringValue(record.updatedAt),
    onlineRows: onlineSource
      .map((row, index) => normalizeOnlineRow(row, index + 1))
      .filter((row): row is ArcadeOnlineRow => Boolean(row)),
    swissMatches: swissSource
      .map((row, index) => normalizeSwissMatch(row, index + 1))
      .filter((row): row is ArcadeSwissMatch => Boolean(row)),
    swissStandings: standingsSource
      .map((row, index) => normalizeStandingRow(row, index))
      .filter((row): row is ArcadeStandingRow => Boolean(row)),
    deciderRows: deciderSource
      .map((row, index) => normalizeScoreAttackRow(row, index + 1))
      .filter((row): row is ArcadeScoreAttackRow => Boolean(row)),
    deciderWinnerEntryId:
      toStringValue(record.deciderWinnerEntryId) ??
      toStringValue(toRecord(record.decider31)?.winnerEntryId),
    seedingRows: seedingSource
      .map((row, index) => normalizeScoreAttackRow(row, index + 1))
      .filter((row): row is ArcadeScoreAttackRow => Boolean(row)),
    qualifiers: {
      groupA: normalizeParticipant(qualifiersRecord.groupA, 0),
      groupB: normalizeParticipant(qualifiersRecord.groupB, 1),
    },
    registrations: normalizeRegistrations(record.registrations),
  }
}

function normalizeFinalSeedRow(
  value: unknown,
  fallbackSeed: number,
  fallbackRegionKey: ArcadeRegionKey
): ArcadeFinalSeedRow | undefined {
  const record = toRecord(value)
  if (!record) return undefined

  const regionKey =
    normalizeRegionKey(record.regionKey ?? record.region) ?? fallbackRegionKey
  const regionDef = getRegionDefinition(regionKey)

  return {
    seed: toNumberValue(record.seed) ?? fallbackSeed,
    regionKey,
    regionLabel: toStringValue(record.regionLabel) ?? regionDef.shortLabel,
    entryId:
      toStringValue(record.entryId) ??
      toStringValue(record.id) ??
      `E-UNK-${fallbackSeed}`,
    nickname:
      toStringValue(record.nickname) ??
      toStringValue(record.name) ??
      toStringValue(record.entryId) ??
      `선수 ${fallbackSeed}`,
    score: toNumberValue(record.score),
  }
}

function normalizeCrossMatch(
  value: unknown,
  fallbackMatchNo: number
): ArcadeFinalCrossMatch | undefined {
  const record = toRecord(value)
  if (!record) return undefined

  const left = normalizeFinalSeedRow(
    record.left,
    toNumberValue(toRecord(record.left)?.seed) ?? 1,
    'seoul'
  )
  const right = normalizeFinalSeedRow(
    record.right,
    toNumberValue(toRecord(record.right)?.seed) ?? 1,
    'busan'
  )

  if (!left || !right) return undefined

  return {
    matchNo: toNumberValue(record.matchNo) ?? fallbackMatchNo,
    left,
    right,
    winnerEntryId: toStringValue(record.winnerEntryId),
    note: toStringValue(record.note),
  }
}

function deriveSeedsFromRegions(
  regions: ArcadeRegionArchive[],
  group: 'groupA' | 'groupB'
): ArcadeFinalSeedRow[] {
  const rows: ArcadeFinalSeedRow[] = []

  regions.forEach((region, index) => {
    const qualifier = region.qualifiers[group]
    if (!qualifier) return

    const fromSeeding = region.seedingRows.find(
      (row) => row.entryId === qualifier.entryId
    )
    const seed = fromSeeding?.rank ?? index + 1

    rows.push({
      seed,
      regionKey: region.key,
      regionLabel: region.shortLabel,
      entryId: qualifier.entryId,
      nickname: qualifier.nickname,
      score: fromSeeding?.score,
    })
  })

  return rows.sort((a, b) => a.seed - b.seed)
}

function buildEmptyArchive(): ArcadeSeasonArchive {
  return {
    season: '2026',
    title: '아케이드 예선 아카이브',
    songs: {
      online1: formatSongLabel('online1'),
      online2: formatSongLabel('online2'),
      decider31: formatSongLabel('decider31'),
      seeding: formatSongLabel('seeding'),
    },
    regions: REGION_DEFINITIONS.map((region) => buildEmptyRegion(region.key)),
    finals: {
      groupASeeds: [],
      groupBSeeds: [],
      crossMatches: [],
    },
  }
}

function pickArchivePayload(source: unknown): Record<string, unknown> | null {
  const root = toRecord(source)
  if (!root) return null

  const directCandidates = [
    root.arcadeArchive2026,
    root.arcadeArchive,
    root.arcade_archive_2026,
    root.arcade_archive,
    root.archive,
  ]

  for (const candidate of directCandidates) {
    const record = toRecord(candidate)
    if (record) return record
  }

  const nested = toRecord(root.results)
  if (nested) {
    const nestedCandidates = [
      nested.arcadeArchive2026,
      nested.arcadeArchive,
      nested.arcade_archive_2026,
      nested.arcade_archive,
      nested.archive,
    ]

    for (const candidate of nestedCandidates) {
      const record = toRecord(candidate)
      if (record) return record
    }
  }

  return null
}

export function resolveArcadeSeasonArchive(
  source: unknown
): ArcadeSeasonArchive {
  const fallback = buildEmptyArchive()
  const payload = pickArchivePayload(source)
  if (!payload) return fallback

  const rawRegions = toArray(payload.regions)
  const regionMap = new Map<ArcadeRegionKey, ArcadeRegionArchive>()

  for (const rawRegion of rawRegions) {
    const key = normalizeRegionKey(
      toRecord(rawRegion)?.key ?? toRecord(rawRegion)?.region
    )
    if (!key) continue
    regionMap.set(key, normalizeRegionArchive(key, rawRegion))
  }

  const normalizedRegions = REGION_DEFINITIONS.map((def) => {
    return (
      regionMap.get(def.key) ?? fallback.regions.find((r) => r.key === def.key)!
    )
  })

  const finalsRecord =
    toRecord(payload.finals) ??
    toRecord(payload.top8) ??
    toRecord(payload.finalsTop8) ??
    {}

  const groupASource =
    toArray(finalsRecord.groupASeeds).length > 0
      ? toArray(finalsRecord.groupASeeds)
      : toArray(toRecord(finalsRecord.groupA)?.seeds)

  const groupBSource =
    toArray(finalsRecord.groupBSeeds).length > 0
      ? toArray(finalsRecord.groupBSeeds)
      : toArray(toRecord(finalsRecord.groupB)?.seeds)

  const crossSource =
    toArray(finalsRecord.crossMatches).length > 0
      ? toArray(finalsRecord.crossMatches)
      : toArray(finalsRecord.matches)

  const parsedGroupASeeds = groupASource
    .map((row, index) =>
      normalizeFinalSeedRow(
        row,
        index + 1,
        REGION_DEFINITIONS[index]?.key ?? 'seoul'
      )
    )
    .filter((row): row is ArcadeFinalSeedRow => Boolean(row))

  const parsedGroupBSeeds = groupBSource
    .map((row, index) =>
      normalizeFinalSeedRow(
        row,
        index + 1,
        REGION_DEFINITIONS[index]?.key ?? 'seoul'
      )
    )
    .filter((row): row is ArcadeFinalSeedRow => Boolean(row))

  const groupASeeds =
    parsedGroupASeeds.length > 0
      ? parsedGroupASeeds
      : deriveSeedsFromRegions(normalizedRegions, 'groupA')

  const groupBSeeds =
    parsedGroupBSeeds.length > 0
      ? parsedGroupBSeeds
      : deriveSeedsFromRegions(normalizedRegions, 'groupB')

  return {
    ...fallback,
    season: toStringValue(payload.season) ?? fallback.season,
    title: toStringValue(payload.title) ?? fallback.title,
    updatedAt: toStringValue(payload.updatedAt),
    songs: {
      online1:
        toStringValue(toRecord(payload.songs)?.online1) ??
        fallback.songs.online1,
      online2:
        toStringValue(toRecord(payload.songs)?.online2) ??
        fallback.songs.online2,
      decider31:
        toStringValue(toRecord(payload.songs)?.decider31) ??
        fallback.songs.decider31,
      seeding:
        toStringValue(toRecord(payload.songs)?.seeding) ??
        fallback.songs.seeding,
    },
    regions: normalizedRegions,
    finals: {
      updatedAt: toStringValue(finalsRecord.updatedAt),
      groupASeeds,
      groupBSeeds,
      crossMatches: crossSource
        .map((row, index) => normalizeCrossMatch(row, index + 1))
        .filter((row): row is ArcadeFinalCrossMatch => Boolean(row)),
    },
  }
}

export function getRegionByKey(
  archive: ArcadeSeasonArchive,
  key: ArcadeRegionKey
): ArcadeRegionArchive | undefined {
  return archive.regions.find((region) => region.key === key)
}

export function isArcadeRegionKey(value: string): value is ArcadeRegionKey {
  return REGION_DEFINITIONS.some((region) => region.key === value)
}

export function getRegionDefinitions() {
  return REGION_DEFINITIONS
}
