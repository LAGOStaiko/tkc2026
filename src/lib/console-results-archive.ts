import { extractEntryId, extractController } from './results-console'

/* ═══════════════════════════════════════════════════════════════════ */
/*  Types                                                             */
/* ═══════════════════════════════════════════════════════════════════ */

export type ConsoleStageRow = {
  rank: number
  nickname: string
  score: number | null
  detail: string
  entryId?: string
  controller?: string
}

export type ConsoleStage = {
  stageKey: string
  stageLabel: string
  order: number
  status: string
  note: string
  updatedAt?: string
  rows: ConsoleStageRow[]
}

export type ConsoleSeasonArchive = {
  season: string
  stages: ConsoleStage[]
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Parse helpers                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function toArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function toStr(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function toNum(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const n = Number(value.replace(/,/g, '').trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Normalizers                                                       */
/* ═══════════════════════════════════════════════════════════════════ */

function normalizeRow(value: unknown): ConsoleStageRow | null {
  const rec = toRecord(value)
  if (!rec) return null

  const nickname = toStr(rec.nickname) || toStr(rec.name)
  if (!nickname) return null

  const detail = toStr(rec.detail)

  return {
    rank: toNum(rec.rank) ?? 0,
    nickname,
    score: toNum(rec.score),
    detail,
    entryId: extractEntryId(nickname, detail),
    controller: extractController(detail) || undefined,
  }
}

function normalizeStage(value: unknown): ConsoleStage | null {
  const rec = toRecord(value)
  if (!rec) return null

  const stageKey = toStr(rec.stageKey)
  if (!stageKey) return null

  const rows = toArray(rec.rows)
    .map(normalizeRow)
    .filter((r): r is ConsoleStageRow => r !== null)
    .sort((a, b) => a.rank - b.rank)

  return {
    stageKey,
    stageLabel: toStr(rec.stageLabel) || stageKey,
    order: toNum(rec.order) ?? 0,
    status: toStr(rec.status),
    note: toStr(rec.note),
    updatedAt: toStr(rec.updatedAt) || undefined,
    rows,
  }
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Stage finders                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

export function findStage(
  archive: ConsoleSeasonArchive,
  ...patterns: string[]
): ConsoleStage | undefined {
  for (const pattern of patterns) {
    const p = pattern.toLowerCase()
    const found = archive.stages.find((s) => {
      const k = s.stageKey.toLowerCase()
      return k === p || k.includes(p)
    })
    if (found) return found
  }
  return undefined
}

export function getQualifierStage(archive: ConsoleSeasonArchive) {
  return findStage(archive, 'qualifier', 'online', 'qual')
}

export function getSF1(archive: ConsoleSeasonArchive) {
  return findStage(archive, 'sf1', 'sf-1', 'semifinal1')
}

export function getSF2(archive: ConsoleSeasonArchive) {
  return findStage(archive, 'sf2', 'sf-2', 'semifinal2')
}

export function getThirdPlace(archive: ConsoleSeasonArchive) {
  return findStage(archive, '3rd', 'third', '3rdplace', 'thirdplace')
}

export function getFinal(archive: ConsoleSeasonArchive) {
  return findStage(archive, 'final', 'grand_final', 'grandfinal', 'championship')
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Derived data                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

export type ConsoleStanding = { rank: number; nickname: string }

export function buildStandings(
  archive: ConsoleSeasonArchive
): ConsoleStanding[] {
  // Try dedicated standings stage first
  const standingsStage = findStage(
    archive,
    'standings',
    'ranking',
    'result',
    'podium'
  )
  if (standingsStage && standingsStage.rows.length > 0) {
    return standingsStage.rows.map((r) => ({
      rank: r.rank,
      nickname: r.nickname,
    }))
  }

  // Derive from bracket
  const standings: ConsoleStanding[] = []
  const final = getFinal(archive)
  const third = getThirdPlace(archive)

  if (final && final.rows.length >= 2) {
    const sorted = [...final.rows].sort((a, b) => a.rank - b.rank)
    standings.push({ rank: 1, nickname: sorted[0].nickname })
    standings.push({ rank: 2, nickname: sorted[1].nickname })
  }

  if (third && third.rows.length >= 2) {
    const sorted = [...third.rows].sort((a, b) => a.rank - b.rank)
    standings.push({ rank: 3, nickname: sorted[0].nickname })
    standings.push({ rank: 4, nickname: sorted[1].nickname })
  }

  return standings.sort((a, b) => a.rank - b.rank)
}

export type ConsoleQualifierRow = {
  rank: number
  nickname: string
  score: number | null
  detail: string
  entryId?: string
  controller?: string
  passed: boolean
  seed?: string
}

export function buildQualifierRows(
  archive: ConsoleSeasonArchive,
  cutoff = 4
): ConsoleQualifierRow[] {
  const stage = getQualifierStage(archive)
  if (!stage || stage.rows.length === 0) return []

  return stage.rows.map((row) => ({
    rank: row.rank,
    nickname: row.nickname,
    score: row.score,
    detail: row.detail,
    entryId: row.entryId,
    controller: row.controller,
    passed: row.rank <= cutoff,
    seed: row.rank <= cutoff ? `#${row.rank}` : undefined,
  }))
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main resolver                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

export function resolveConsoleSeasonArchive(
  source: unknown
): ConsoleSeasonArchive {
  const fallback: ConsoleSeasonArchive = { season: '2026', stages: [] }

  const root = toRecord(source)
  if (!root) return fallback

  const consoleData =
    root.console ?? toRecord(root.results)?.console ?? root.consoleArchive

  const stages = toArray(consoleData)
    .map(normalizeStage)
    .filter((s): s is ConsoleStage => s !== null)
    .sort((a, b) => a.order - b.order)

  return { season: '2026', stages }
}
