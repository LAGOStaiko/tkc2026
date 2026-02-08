import type {
  ArcadeFinalCrossMatch,
  ArcadeParticipant,
  ArcadeRegionArchive,
  ArcadeSeasonArchive,
  ArcadeStandingRow,
  ArcadeSwissMatch,
} from './arcade-results-archive'

export {
  buildRegionFinalRanking,
  standingStatusLabel,
} from './arcade-results-ranking'
export type { RegionFinalRank } from './arcade-results-ranking'
/** @deprecated Use `RegionFinalRank` from `arcade-results-ranking` instead */
export type { RegionFinalRank as OpsRegionFinalRank } from './arcade-results-ranking'

export type OpsRegionKey = 'seoul' | 'daejeon' | 'gwangju' | 'busan'

export const OPS_REGION_OPTIONS: Array<{ value: OpsRegionKey; label: string }> =
  [
    { value: 'seoul', label: '1차 서울' },
    { value: 'daejeon', label: '2차 대전' },
    { value: 'gwangju', label: '3차 광주' },
    { value: 'busan', label: '4차 부산' },
  ]

export type OpsStageKey =
  | 'online'
  | 'swissMatch'
  | 'swissStanding'
  | 'decider'
  | 'seeding'
  | 'qualifier'
  | 'finalA'
  | 'finalB'
  | 'finalMatch'

type OpsFieldType = 'text' | 'number' | 'boolean' | 'select'

type OpsFieldOption = {
  value: string
  label: string
}

export type OpsFieldDefinition = {
  name: string
  label: string
  required?: boolean
  type?: OpsFieldType
  placeholder?: string
  defaultValue?: string
  options?: OpsFieldOption[]
}

export type OpsStageDefinition = {
  key: OpsStageKey
  label: string
  description: string
  regionScoped: boolean
  keyFields: string[]
  fields: OpsFieldDefinition[]
}

const REGION_SELECT_OPTIONS = OPS_REGION_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}))

const YES_NO_OPTIONS = [
  { value: 'false', label: '아니오' },
  { value: 'true', label: '예' },
]

const STANDING_STATUS_OPTIONS = [
  { value: 'alive', label: '진행중' },
  { value: 'qualified', label: '결선 진출 확정' },
  { value: 'decider', label: '결선 진출자 선발전 대상' },
  { value: 'eliminated', label: '탈락' },
]

export const OPS_STAGE_DEFINITIONS: Record<OpsStageKey, OpsStageDefinition> = {
  online: {
    key: 'online',
    label: '온라인 예선 입력',
    description: '온라인 과제곡 2곡 합산 점수를 기록합니다.',
    regionScoped: true,
    keyFields: ['season', 'region', 'entryId'],
    fields: [
      {
        name: 'rank',
        label: '순위',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'entryId',
        label: '엔트리 ID',
        required: true,
        placeholder: 'SEO-01',
      },
      {
        name: 'nickname',
        label: '닉네임',
        required: true,
        placeholder: '서울선수01',
      },
      {
        name: 'score1',
        label: '과제곡1 점수',
        type: 'number',
        required: true,
        placeholder: '995800',
      },
      {
        name: 'score2',
        label: '과제곡2 점수',
        type: 'number',
        required: true,
        placeholder: '994200',
      },
      {
        name: 'total',
        label: '합산 점수',
        type: 'number',
        placeholder: '비우면 자동 합산',
      },
      {
        name: 'submittedAt',
        label: '제출 시각',
        placeholder: '2026-03-21 10:25:00',
      },
      {
        name: 'advanced',
        label: '오프라인 진출',
        type: 'boolean',
        defaultValue: 'true',
        options: YES_NO_OPTIONS,
      },
    ],
  },
  swissMatch: {
    key: 'swissMatch',
    label: 'Swiss 경기 입력',
    description: '라운드별 1:1 매치와 곡별 점수를 기록합니다.',
    regionScoped: true,
    keyFields: ['season', 'region', 'round', 'table'],
    fields: [
      {
        name: 'round',
        label: '라운드',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'table',
        label: '테이블',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'highSeedEntryId',
        label: '상위 시드 엔트리',
        placeholder: 'SEO-01',
      },
      {
        name: 'p1EntryId',
        label: 'P1 엔트리',
        required: true,
        placeholder: 'SEO-01',
      },
      {
        name: 'p1Nickname',
        label: 'P1 닉네임',
        required: true,
        placeholder: '서울선수01',
      },
      { name: 'p1Seed', label: 'P1 시드', type: 'number', placeholder: '1' },
      { name: 'p2EntryId', label: 'P2 엔트리', placeholder: 'SEO-16' },
      { name: 'p2Nickname', label: 'P2 닉네임', placeholder: '서울선수16' },
      { name: 'p2Seed', label: 'P2 시드', type: 'number', placeholder: '16' },
      {
        name: 'song1',
        label: '곡1',
        required: true,
        placeholder: '自由選曲 A',
      },
      { name: 'level1', label: '곡1 레벨', placeholder: '★9' },
      {
        name: 'p1Score1',
        label: 'P1 곡1 점수',
        type: 'number',
        required: true,
        placeholder: '982000',
      },
      {
        name: 'p2Score1',
        label: 'P2 곡1 점수',
        type: 'number',
        required: true,
        placeholder: '981200',
      },
      {
        name: 'song2',
        label: '곡2',
        required: true,
        placeholder: '自由選曲 B',
      },
      { name: 'level2', label: '곡2 레벨', placeholder: '★9' },
      {
        name: 'p1Score2',
        label: 'P1 곡2 점수',
        type: 'number',
        required: true,
        placeholder: '980500',
      },
      {
        name: 'p2Score2',
        label: 'P2 곡2 점수',
        type: 'number',
        required: true,
        placeholder: '979900',
      },
      {
        name: 'song3',
        label: '타이브레이커 곡',
        placeholder: 'Random Draw Song',
      },
      { name: 'level3', label: '타이브레이커 레벨', placeholder: '★10' },
      {
        name: 'p1Score3',
        label: 'P1 타이브레이커 점수',
        type: 'number',
        placeholder: '980800',
      },
      {
        name: 'p2Score3',
        label: 'P2 타이브레이커 점수',
        type: 'number',
        placeholder: '979900',
      },
      {
        name: 'winnerEntryId',
        label: '승자 엔트리',
        required: true,
        placeholder: 'SEO-01',
      },
      {
        name: 'tieBreakerSong',
        label: '타이브레이커 곡명',
        placeholder: '동점 아니면 비움',
      },
      {
        name: 'bye',
        label: '부전승',
        type: 'boolean',
        defaultValue: 'false',
        options: YES_NO_OPTIONS,
      },
      { name: 'note', label: '비고', placeholder: '동점 재경기 1회' },
    ],
  },
  swissStanding: {
    key: 'swissStanding',
    label: 'Swiss 전적 입력',
    description: '선수별 누적 승/패 및 상태를 업데이트합니다.',
    regionScoped: true,
    keyFields: ['season', 'region', 'entryId'],
    fields: [
      {
        name: 'entryId',
        label: '엔트리 ID',
        required: true,
        placeholder: 'SEO-01',
      },
      {
        name: 'nickname',
        label: '닉네임',
        required: true,
        placeholder: '서울선수01',
      },
      {
        name: 'seed',
        label: '초기 시드',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'wins',
        label: '승',
        type: 'number',
        required: true,
        placeholder: '3',
      },
      {
        name: 'losses',
        label: '패',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'status',
        label: '상태',
        type: 'select',
        required: true,
        defaultValue: 'alive',
        options: STANDING_STATUS_OPTIONS,
      },
    ],
  },
  decider: {
    key: 'decider',
    label: '결선 진출자 선발전 입력',
    description: '결선 진출자 선발전 점수 및 통과자를 기록합니다.',
    regionScoped: true,
    keyFields: ['season', 'region', 'entryId'],
    fields: [
      {
        name: 'rank',
        label: '순위',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'entryId',
        label: '엔트리 ID',
        required: true,
        placeholder: 'SEO-02',
      },
      {
        name: 'nickname',
        label: '닉네임',
        required: true,
        placeholder: '서울선수02',
      },
      {
        name: 'score',
        label: '점수',
        type: 'number',
        required: true,
        placeholder: '994500',
      },
      {
        name: 'winner',
        label: '선발 통과',
        type: 'boolean',
        defaultValue: 'false',
        options: YES_NO_OPTIONS,
      },
      { name: 'winnerEntryId', label: '통과 엔트리ID', placeholder: 'SEO-02' },
      { name: 'note', label: '비고', placeholder: 'Top 8 진출 확정' },
    ],
  },
  seeding: {
    key: 'seeding',
    label: '시드 배정전 입력',
    description: '지역 통과자 2명의 시드 배정전 점수를 기록합니다.',
    regionScoped: true,
    keyFields: ['season', 'region', 'entryId'],
    fields: [
      {
        name: 'rank',
        label: '순위',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'entryId',
        label: '엔트리 ID',
        required: true,
        placeholder: 'SEO-01',
      },
      {
        name: 'nickname',
        label: '닉네임',
        required: true,
        placeholder: '서울선수01',
      },
      {
        name: 'score',
        label: '점수',
        type: 'number',
        required: true,
        placeholder: '997500',
      },
      { name: 'note', label: '비고', placeholder: '지역 1위(A그룹)' },
    ],
  },
  qualifier: {
    key: 'qualifier',
    label: '지역 최종 진출자 입력',
    description: '지역 1위(A) / 2위(B) 진출자를 확정합니다.',
    regionScoped: true,
    keyFields: ['season', 'region', 'group'],
    fields: [
      {
        name: 'group',
        label: '그룹',
        type: 'select',
        required: true,
        defaultValue: 'A',
        options: [
          { value: 'A', label: 'A그룹 (지역 1위)' },
          { value: 'B', label: 'B그룹 (지역 2위)' },
        ],
      },
      {
        name: 'entryId',
        label: '엔트리 ID',
        required: true,
        placeholder: 'SEO-01',
      },
      {
        name: 'nickname',
        label: '닉네임',
        required: true,
        placeholder: '서울선수01',
      },
      {
        name: 'seed',
        label: '지역 순위',
        type: 'number',
        required: true,
        placeholder: '1',
      },
    ],
  },
  finalA: {
    key: 'finalA',
    label: '결선 A그룹 시드 입력',
    description: '각 지역 1위의 결선 A그룹 시드를 기록합니다.',
    regionScoped: false,
    keyFields: ['season', 'seed'],
    fields: [
      {
        name: 'seed',
        label: 'A그룹 시드',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'region',
        label: '지역 키',
        type: 'select',
        required: true,
        options: REGION_SELECT_OPTIONS,
      },
      { name: 'regionLabel', label: '지역 표기', placeholder: '서울' },
      {
        name: 'entryId',
        label: '엔트리 ID',
        required: true,
        placeholder: 'SEO-01',
      },
      {
        name: 'nickname',
        label: '닉네임',
        required: true,
        placeholder: '서울선수01',
      },
      {
        name: 'score',
        label: '시드전 점수',
        type: 'number',
        placeholder: '998200',
      },
    ],
  },
  finalB: {
    key: 'finalB',
    label: '결선 B그룹 시드 입력',
    description: '각 지역 2위의 결선 B그룹 시드를 기록합니다.',
    regionScoped: false,
    keyFields: ['season', 'seed'],
    fields: [
      {
        name: 'seed',
        label: 'B그룹 시드',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'region',
        label: '지역 키',
        type: 'select',
        required: true,
        options: REGION_SELECT_OPTIONS,
      },
      { name: 'regionLabel', label: '지역 표기', placeholder: '대전' },
      {
        name: 'entryId',
        label: '엔트리 ID',
        required: true,
        placeholder: 'DAE-02',
      },
      {
        name: 'nickname',
        label: '닉네임',
        required: true,
        placeholder: '대전선수02',
      },
      {
        name: 'score',
        label: '시드전 점수',
        type: 'number',
        placeholder: '996300',
      },
    ],
  },
  finalMatch: {
    key: 'finalMatch',
    label: 'Top 8 매치 결과 입력',
    description: 'A/B 크로스 매칭 결과와 승자를 기록합니다.',
    regionScoped: false,
    keyFields: ['season', 'matchNo'],
    fields: [
      {
        name: 'matchNo',
        label: '매치 번호',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'leftSeed',
        label: '좌측 시드',
        type: 'number',
        required: true,
        placeholder: '1',
      },
      {
        name: 'leftRegion',
        label: '좌측 지역 키',
        type: 'select',
        required: true,
        options: REGION_SELECT_OPTIONS,
      },
      { name: 'leftRegionLabel', label: '좌측 지역 표기', placeholder: '서울' },
      {
        name: 'leftEntryId',
        label: '좌측 엔트리',
        required: true,
        placeholder: 'SEO-01',
      },
      {
        name: 'leftNickname',
        label: '좌측 닉네임',
        required: true,
        placeholder: '서울선수01',
      },
      {
        name: 'rightSeed',
        label: '우측 시드',
        type: 'number',
        required: true,
        placeholder: '4',
      },
      {
        name: 'rightRegion',
        label: '우측 지역 키',
        type: 'select',
        required: true,
        options: REGION_SELECT_OPTIONS,
      },
      {
        name: 'rightRegionLabel',
        label: '우측 지역 표기',
        placeholder: '부산',
      },
      {
        name: 'rightEntryId',
        label: '우측 엔트리',
        required: true,
        placeholder: 'BUS-02',
      },
      {
        name: 'rightNickname',
        label: '우측 닉네임',
        required: true,
        placeholder: '부산선수02',
      },
      {
        name: 'winnerEntryId',
        label: '승자 엔트리',
        required: true,
        placeholder: 'SEO-01',
      },
      { name: 'note', label: '비고', placeholder: '8강 결과 반영' },
    ],
  },
}

const STAGE_DEFAULTS: Record<OpsStageKey, Record<string, string>> = {
  online: { advanced: 'true' },
  swissMatch: { bye: 'false' },
  swissStanding: { status: 'alive' },
  decider: { winner: 'false' },
  seeding: {},
  qualifier: { group: 'A' },
  finalA: {},
  finalB: {},
  finalMatch: {},
}

function coerceValue(type: OpsFieldType | undefined, value: string): unknown {
  if (type === 'number') {
    const n = Number(value)
    return Number.isFinite(n) ? n : value
  }
  if (type === 'boolean') {
    return ['true', '1', 'yes', 'y'].includes(value.trim().toLowerCase())
  }
  return value
}

export function buildInitialDraft(stage: OpsStageKey) {
  return { ...(STAGE_DEFAULTS[stage] || {}) }
}

function hasValue(v: unknown) {
  if (v === null || v === undefined) return false
  if (typeof v === 'string') return v.trim().length > 0
  return true
}

export function buildOpsUpsertPayload(args: {
  stage: OpsStageKey
  season: string
  region: OpsRegionKey
  draft: Record<string, string>
}) {
  const def = OPS_STAGE_DEFINITIONS[args.stage]
  const row: Record<string, unknown> = {
    season: args.season.trim() || '2026',
  }

  if (def.regionScoped) row.region = args.region

  def.fields.forEach((field) => {
    const raw = args.draft[field.name]
    if (!hasValue(raw)) return
    row[field.name] = coerceValue(field.type, String(raw))
  })

  return {
    stage: args.stage,
    season: row.season,
    region: def.regionScoped ? args.region : undefined,
    keyFields: def.keyFields,
    row,
  }
}

export type OpsRegionWeekStatus = {
  key: OpsRegionKey
  label: string
  weekNo: number
  onlineEntries: number
  swissTotal: number
  swissCompleted: number
  qualifierCount: number
  status: 'pending' | 'live' | 'done'
}

export type OpsProgressMatch = {
  id: string
  stage: 'swiss' | 'finals'
  label: string
  leftName: string
  leftEntryId: string
  rightName: string
  rightEntryId: string
  winnerEntryId?: string
  note?: string
}

export type OpsProgressSummary = {
  total: number
  completed: number
  current?: OpsProgressMatch
  next?: OpsProgressMatch
  previous?: OpsProgressMatch
}

export type OpsRegionParticipant = {
  entryId: string
  nickname: string
  seed?: number
  status?: ArcadeStandingRow['status']
}

function numToDraft(value?: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? String(value)
    : ''
}

function countQualifiers(region: ArcadeRegionArchive) {
  let count = 0
  if (region.qualifiers.groupA?.entryId) count += 1
  if (region.qualifiers.groupB?.entryId) count += 1
  return count
}

function regionHasStarted(region: ArcadeRegionArchive) {
  return (
    region.onlineRows.length > 0 ||
    region.swissMatches.length > 0 ||
    region.swissStandings.length > 0 ||
    region.deciderRows.length > 0 ||
    region.seedingRows.length > 0 ||
    countQualifiers(region) > 0
  )
}

function sortSwissMatches(rows: ArcadeSwissMatch[]) {
  return rows
    .slice()
    .sort((a, b) => a.round - b.round || (a.table ?? 0) - (b.table ?? 0))
}

function sortFinalMatches(rows: ArcadeFinalCrossMatch[]) {
  return rows.slice().sort((a, b) => a.matchNo - b.matchNo)
}

function mergeParticipant(
  map: Map<string, OpsRegionParticipant>,
  participant: ArcadeParticipant | undefined,
  patch: Partial<OpsRegionParticipant> = {}
) {
  if (!participant?.entryId) return

  const current = map.get(participant.entryId)
  if (!current) {
    map.set(participant.entryId, {
      entryId: participant.entryId,
      nickname: participant.nickname || participant.entryId,
      seed: participant.seed,
      ...patch,
    })
    return
  }

  map.set(participant.entryId, {
    ...current,
    nickname: current.nickname || participant.nickname || participant.entryId,
    seed: current.seed ?? participant.seed,
    ...patch,
  })
}

function toSwissProgressMatch(match: ArcadeSwissMatch): OpsProgressMatch {
  return {
    id: `swiss-${match.round}-${match.table ?? 0}`,
    stage: 'swiss',
    label: `R${match.round} T${match.table ?? '-'}`,
    leftName: match.player1.nickname || match.player1.entryId || 'P1',
    leftEntryId: match.player1.entryId || '',
    rightName: match.player2?.nickname || (match.bye ? 'BYE' : 'P2'),
    rightEntryId: match.player2?.entryId || '',
    winnerEntryId: match.winnerEntryId,
    note: match.note,
  }
}

function toFinalProgressMatch(match: ArcadeFinalCrossMatch): OpsProgressMatch {
  return {
    id: `final-${match.matchNo}`,
    stage: 'finals',
    label: `Top8 M${match.matchNo}`,
    leftName: match.left.nickname || match.left.entryId || 'LEFT',
    leftEntryId: match.left.entryId || '',
    rightName: match.right.nickname || match.right.entryId || 'RIGHT',
    rightEntryId: match.right.entryId || '',
    winnerEntryId: match.winnerEntryId,
    note: match.note,
  }
}

function buildProgressSummary(items: OpsProgressMatch[]): OpsProgressSummary {
  const total = items.length
  const completed = items.filter((item) => Boolean(item.winnerEntryId)).length
  const currentIndex = items.findIndex((item) => !item.winnerEntryId)

  if (currentIndex < 0) {
    return {
      total,
      completed,
      previous: items.length > 0 ? items[items.length - 1] : undefined,
    }
  }

  let previous: OpsProgressMatch | undefined
  for (let i = currentIndex - 1; i >= 0; i -= 1) {
    if (items[i].winnerEntryId) {
      previous = items[i]
      break
    }
  }

  return {
    total,
    completed,
    current: items[currentIndex],
    next: items[currentIndex + 1],
    previous,
  }
}

export function buildRegionWeekStatuses(
  archive: ArcadeSeasonArchive
): OpsRegionWeekStatus[] {
  const regionByKey = new Map(
    archive.regions.map((region) => [region.key, region])
  )

  return OPS_REGION_OPTIONS.map((option, index) => {
    const region = regionByKey.get(option.value)
    if (!region) {
      return {
        key: option.value,
        label: option.label,
        weekNo: index + 1,
        onlineEntries: 0,
        swissTotal: 0,
        swissCompleted: 0,
        qualifierCount: 0,
        status: 'pending' as const,
      }
    }

    const qualifierCount = countQualifiers(region)
    const swissTotal = region.swissMatches.length
    const swissCompleted = region.swissMatches.filter((row) =>
      Boolean(row.winnerEntryId)
    ).length
    const status =
      qualifierCount >= 2
        ? 'done'
        : regionHasStarted(region)
          ? 'live'
          : 'pending'

    return {
      key: option.value,
      label: option.label,
      weekNo: index + 1,
      onlineEntries: region.onlineRows.length,
      swissTotal,
      swissCompleted,
      qualifierCount,
      status,
    }
  })
}

export function buildSwissProgress(
  region?: ArcadeRegionArchive
): OpsProgressSummary {
  if (!region) return { total: 0, completed: 0 }
  const items = sortSwissMatches(region.swissMatches).map(toSwissProgressMatch)
  return buildProgressSummary(items)
}

export function buildFinalsProgress(
  archive: ArcadeSeasonArchive
): OpsProgressSummary {
  const items = sortFinalMatches(archive.finals.crossMatches).map(
    toFinalProgressMatch
  )
  return buildProgressSummary(items)
}

export function listSwissPendingMatches(
  region?: ArcadeRegionArchive
): OpsProgressMatch[] {
  if (!region) return []
  return sortSwissMatches(region.swissMatches)
    .filter((match) => !match.winnerEntryId)
    .map(toSwissProgressMatch)
}

export function listFinalPendingMatches(
  archive: ArcadeSeasonArchive
): OpsProgressMatch[] {
  return sortFinalMatches(archive.finals.crossMatches)
    .filter((match) => !match.winnerEntryId)
    .map(toFinalProgressMatch)
}

export function buildRegionParticipants(
  region?: ArcadeRegionArchive
): OpsRegionParticipant[] {
  if (!region) return []

  const map = new Map<string, OpsRegionParticipant>()

  region.swissStandings.forEach((standing) => {
    mergeParticipant(
      map,
      {
        entryId: standing.entryId,
        nickname: standing.nickname,
        seed: standing.seed,
      },
      { status: standing.status }
    )
  })

  region.onlineRows.forEach((online) => {
    mergeParticipant(map, {
      entryId: online.entryId,
      nickname: online.nickname,
    })
  })

  region.seedingRows.forEach((seedRow) => {
    mergeParticipant(map, {
      entryId: seedRow.entryId,
      nickname: seedRow.nickname,
      seed: seedRow.rank,
    })
  })

  mergeParticipant(map, region.qualifiers.groupA)
  mergeParticipant(map, region.qualifiers.groupB)

  return [...map.values()].sort((a, b) => {
    const aSeed = typeof a.seed === 'number' ? a.seed : Number.MAX_SAFE_INTEGER
    const bSeed = typeof b.seed === 'number' ? b.seed : Number.MAX_SAFE_INTEGER
    if (aSeed !== bSeed) return aSeed - bSeed
    return a.entryId.localeCompare(b.entryId)
  })
}

export function buildSwissDraftFromMatch(
  match: ArcadeSwissMatch
): Record<string, string> {
  const game1 = match.games[0]
  const game2 = match.games[1]
  const game3 = match.games[2]

  return {
    round: numToDraft(match.round),
    table: numToDraft(match.table),
    highSeedEntryId: match.highSeedEntryId ?? '',
    p1EntryId: match.player1.entryId ?? '',
    p1Nickname: match.player1.nickname ?? '',
    p1Seed: numToDraft(match.player1.seed),
    p2EntryId: match.player2?.entryId ?? '',
    p2Nickname: match.player2?.nickname ?? '',
    p2Seed: numToDraft(match.player2?.seed),
    song1: game1?.song ?? '',
    level1: game1?.level ?? '',
    p1Score1: numToDraft(game1?.p1Score),
    p2Score1: numToDraft(game1?.p2Score),
    song2: game2?.song ?? '',
    level2: game2?.level ?? '',
    p1Score2: numToDraft(game2?.p1Score),
    p2Score2: numToDraft(game2?.p2Score),
    song3: game3?.song ?? '',
    level3: game3?.level ?? '',
    p1Score3: numToDraft(game3?.p1Score),
    p2Score3: numToDraft(game3?.p2Score),
    winnerEntryId: match.winnerEntryId ?? '',
    tieBreakerSong: match.tieBreakerSong ?? '',
    bye: match.bye ? 'true' : 'false',
    note: match.note ?? '',
  }
}

export function buildCurrentSwissMatchDraft(
  region?: ArcadeRegionArchive
): Record<string, string> | null {
  if (!region) return null
  const current = sortSwissMatches(region.swissMatches).find(
    (row) => !row.winnerEntryId
  )
  return current ? buildSwissDraftFromMatch(current) : null
}

export function buildNextSwissMatchDraft(
  region?: ArcadeRegionArchive
): Record<string, string> {
  if (!region || region.swissMatches.length === 0) {
    return {
      round: '1',
      table: '1',
      bye: 'false',
    }
  }

  const sorted = sortSwissMatches(region.swissMatches)
  const current = sorted.find((row) => !row.winnerEntryId)
  if (current) return buildSwissDraftFromMatch(current)

  const last = sorted[sorted.length - 1]
  const nextTable = (last.table ?? sorted.length) + 1

  return {
    round: String(last.round),
    table: String(nextTable),
    bye: 'false',
  }
}

export function buildFinalMatchDraftFromMatch(
  match: ArcadeFinalCrossMatch
): Record<string, string> {
  return {
    matchNo: numToDraft(match.matchNo),
    leftSeed: numToDraft(match.left.seed),
    leftRegion: match.left.regionKey,
    leftRegionLabel: match.left.regionLabel ?? '',
    leftEntryId: match.left.entryId ?? '',
    leftNickname: match.left.nickname ?? '',
    rightSeed: numToDraft(match.right.seed),
    rightRegion: match.right.regionKey,
    rightRegionLabel: match.right.regionLabel ?? '',
    rightEntryId: match.right.entryId ?? '',
    rightNickname: match.right.nickname ?? '',
    winnerEntryId: match.winnerEntryId ?? '',
    note: match.note ?? '',
  }
}

export function buildCurrentFinalMatchDraft(
  archive: ArcadeSeasonArchive
): Record<string, string> | null {
  const current = sortFinalMatches(archive.finals.crossMatches).find(
    (row) => !row.winnerEntryId
  )
  return current ? buildFinalMatchDraftFromMatch(current) : null
}

export function buildNextFinalMatchDraft(
  archive: ArcadeSeasonArchive
): Record<string, string> {
  const sorted = sortFinalMatches(archive.finals.crossMatches)
  const current = sorted.find((row) => !row.winnerEntryId)
  if (current) return buildFinalMatchDraftFromMatch(current)

  const nextNo =
    sorted.length > 0 ? Math.max(...sorted.map((row) => row.matchNo)) + 1 : 1

  return {
    matchNo: String(nextNo),
  }
}
