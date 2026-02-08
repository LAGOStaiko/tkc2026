import type {
  ArcadeRegionArchive,
  ArcadeStandingRow,
} from './arcade-results-archive'

export type RegionFinalRank = {
  rank: number
  entryId: string
  nickname: string
  seed?: number
  wins?: number
  losses?: number
  statusLabel: string
}

export function standingStatusLabel(status: ArcadeStandingRow['status']) {
  if (status === 'qualified') return '결선 진출'
  if (status === 'decider') return '3-1 선발전'
  if (status === 'eliminated') return '탈락'
  return '진행중'
}

export function buildRegionFinalRanking(
  region: ArcadeRegionArchive
): RegionFinalRank[] {
  const rows: RegionFinalRank[] = []
  const used = new Set<string>()

  const pushRow = (
    entryId: string | undefined,
    statusLabel: string,
    forcedRank?: number,
    nicknameOverride?: string
  ) => {
    if (!entryId || used.has(entryId)) return

    const standing = region.swissStandings.find(
      (row) => row.entryId === entryId
    )
    const online = region.onlineRows.find((row) => row.entryId === entryId)

    rows.push({
      rank: forcedRank ?? rows.length + 1,
      entryId,
      nickname:
        nicknameOverride ?? standing?.nickname ?? online?.nickname ?? entryId,
      seed: standing?.seed,
      wins: standing?.wins,
      losses: standing?.losses,
      statusLabel,
    })
    used.add(entryId)
  }

  const qualifierA =
    region.qualifiers.groupA ?? region.seedingRows.find((row) => row.rank === 1)
  const qualifierB =
    region.qualifiers.groupB ?? region.seedingRows.find((row) => row.rank === 2)

  pushRow(qualifierA?.entryId, '지역 1위 (A그룹)', 1, qualifierA?.nickname)
  pushRow(qualifierB?.entryId, '지역 2위 (B그룹)', 2, qualifierB?.nickname)

  const standings = [...region.swissStandings].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins
    if (a.losses !== b.losses) return a.losses - b.losses
    return a.seed - b.seed
  })

  standings.forEach((standing) => {
    pushRow(
      standing.entryId,
      standingStatusLabel(standing.status),
      undefined,
      standing.nickname
    )
  })

  if (rows.length === 0) {
    region.onlineRows
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .forEach((row) => {
        pushRow(row.entryId, '온라인 예선 순위', row.rank, row.nickname)
      })
  }

  return rows.sort((a, b) => a.rank - b.rank)
}
