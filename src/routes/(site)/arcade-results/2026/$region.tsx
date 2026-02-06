import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import {
  getRegionByKey,
  isArcadeRegionKey,
  resolveArcadeSeasonArchive,
  type ArcadeRegionArchive,
  type ArcadeSwissMatch,
} from '@/lib/arcade-results-archive'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/arcade-results/2026/$region')({
  component: ArcadeRegionDetailPage,
})

const formatScore = (value: number) => value.toLocaleString('en-US')

function EmptyMessage({ children }: { children: string }) {
  return (
    <div className='rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/60'>
      {children}
    </div>
  )
}

function StageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className='space-y-1.5'>
      <h2 className='flex items-center gap-2.5 text-lg font-bold text-white'>
        <span className='inline-block h-4 w-1 rounded-full bg-[#ff2a00]' />
        {title}
      </h2>
      {subtitle ? <p className='pl-3.5 text-sm text-white/60'>{subtitle}</p> : null}
    </div>
  )
}

function renderParticipant(
  region: ArcadeRegionArchive,
  entryId?: string,
  fallback = '-'
) {
  if (!entryId) return fallback

  const fromOnline = region.onlineRows.find((row) => row.entryId === entryId)
  if (fromOnline) return `${fromOnline.nickname} (${entryId})`

  const fromSwiss = region.swissStandings.find((row) => row.entryId === entryId)
  if (fromSwiss) return `${fromSwiss.nickname} (${entryId})`

  if (region.qualifiers.groupA?.entryId === entryId) {
    return `${region.qualifiers.groupA.nickname} (${entryId})`
  }
  if (region.qualifiers.groupB?.entryId === entryId) {
    return `${region.qualifiers.groupB.nickname} (${entryId})`
  }

  return entryId
}

function SwissRoundCard({
  matches,
  round,
  region,
}: {
  matches: ArcadeSwissMatch[]
  round: number
  region: ArcadeRegionArchive
}) {
  return (
    <div className='rounded-xl border border-white/10 bg-white/[0.03] p-5'>
      <div className='mb-4 text-sm font-bold text-[#ff2a00]'>Round {round}</div>

      <div className='space-y-2.5'>
        {matches.map((match, index) => {
          const left = `${match.player1.nickname} (${match.player1.entryId})`
          const right = match.player2
            ? `${match.player2.nickname} (${match.player2.entryId})`
            : 'BYE'
          const gameLine = match.games
            .map((game) => {
              const level = game.level ? ` ${game.level}` : ''
              return `${game.song}${level} ${formatScore(game.p1Score)}:${formatScore(game.p2Score)}`
            })
            .join(' | ')

          return (
            <div
              key={`${match.round}-${match.table ?? index}`}
              className='rounded-lg border border-white/10 bg-black/20 p-3.5'
            >
              <div className='flex flex-wrap items-center justify-between gap-2 text-xs'>
                <div className='text-white/60'>
                  Table {match.table ?? index + 1}
                  {match.highSeedEntryId ? ` · 진영 선택 ${match.highSeedEntryId}` : ''}
                </div>
                <div className='text-white/70'>
                  <span className='text-white/45'>승자:</span>{' '}
                  <span className='font-medium'>{renderParticipant(region, match.winnerEntryId, '기록 대기')}</span>
                </div>
              </div>

              <div className='mt-2.5 text-sm font-bold text-white'>
                {left} <span className='font-normal text-white/40'>vs</span> {right}
              </div>

              {match.bye ? (
                <div className='mt-1.5 text-xs font-medium text-emerald-200'>부전승 (1승 처리)</div>
              ) : null}

              {gameLine ? (
                <div className='mt-2 text-xs leading-relaxed text-white/65'>{gameLine}</div>
              ) : null}

              {match.tieBreakerSong ? (
                <div className='mt-1.5 text-xs font-medium text-[#ffb36d]'>
                  타이브레이커: {match.tieBreakerSong}
                </div>
              ) : null}

              {match.note ? (
                <div className='mt-1.5 text-xs text-white/55'>{match.note}</div>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ArcadeRegionDetailPage() {
  const { region } = Route.useParams()
  const { data } = useResults<unknown>()
  const archive = useMemo(() => resolveArcadeSeasonArchive(data), [data])

  const regionData = useMemo(() => {
    if (!isArcadeRegionKey(region)) return undefined
    return getRegionByKey(archive, region)
  }, [archive, region])

  const swissByRound = useMemo(() => {
    if (!regionData) return []

    const map = new Map<number, ArcadeSwissMatch[]>()
    for (const match of regionData.swissMatches) {
      const rows = map.get(match.round) ?? []
      rows.push(match)
      map.set(match.round, rows)
    }

    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([round, matches]) => ({
        round,
        matches: [...matches].sort((a, b) => (a.table ?? 0) - (b.table ?? 0)),
      }))
  }, [regionData])

  useEffect(() => {
    const title = regionData
      ? `${regionData.label} 결과 아카이브`
      : '지역 결과 아카이브'
    document.title = `${t('meta.siteName')} | ${title}`
  }, [regionData])

  if (!regionData) {
    return (
      <TkcSection className='space-y-8'>
        <a href='/arcade-results/2026' className='text-sm text-white/60 hover:text-[#ff2a00] transition-colors'>
          ← 아케이드 시즌 페이지로 돌아가기
        </a>
        <TkcPageHeader title='지역을 찾을 수 없습니다' subtitle='유효한 지역 키: seoul, daejeon, gwangju, busan' />
      </TkcSection>
    )
  }

  const sortedOnlineRows = [...regionData.onlineRows].sort(
    (a, b) => a.rank - b.rank
  )
  const sortedDeciderRows = [...regionData.deciderRows].sort(
    (a, b) => a.rank - b.rank
  )
  const sortedSeedingRows = [...regionData.seedingRows].sort(
    (a, b) => a.rank - b.rank
  )

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      <div className='space-y-3'>
        <a href='/arcade-results/2026' className='text-sm text-white/60 hover:text-[#ff2a00] transition-colors'>
          ← 아케이드 시즌 페이지로 돌아가기
        </a>
        <TkcPageHeader
          title={`${regionData.label} 결과 아카이브`}
          subtitle='온라인 예선 → Swiss → 3-1 선발전 → 시드전까지 전체 경기 로그'
        />
      </div>

      <section className='space-y-3'>
        <StageTitle
          title='온라인 예선'
          subtitle='과제곡 2곡 합산 스코어 기준. 동점은 접수 순서 우선.'
        />

        {sortedOnlineRows.length === 0 ? (
          <EmptyMessage>온라인 예선 결과가 아직 입력되지 않았습니다.</EmptyMessage>
        ) : (
          <div className='overflow-x-auto rounded-xl border border-white/10'>
            <table className='min-w-full text-left text-sm'>
              <thead className='bg-white/[0.07] text-xs font-semibold text-white/70'>
                <tr>
                  <th className='px-4 py-2.5'>순위</th>
                  <th className='px-4 py-2.5'>엔트리</th>
                  <th className='px-4 py-2.5'>닉네임</th>
                  <th className='px-4 py-2.5 text-right'>과제곡 1</th>
                  <th className='px-4 py-2.5 text-right'>과제곡 2</th>
                  <th className='px-4 py-2.5 text-right'>합산</th>
                  <th className='px-4 py-2.5'>접수시각</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-white/[0.07]'>
                {sortedOnlineRows.map((row) => (
                  <tr
                    key={`${row.entryId}-${row.rank}`}
                    className={`transition-colors hover:bg-white/[0.03] ${row.advanced ? 'bg-emerald-500/5' : ''}`}
                  >
                    <td className='px-4 py-3 font-bold text-[#ff2a00]'>{row.rank}</td>
                    <td className='px-4 py-3 font-mono text-xs text-white/60'>{row.entryId}</td>
                    <td className='px-4 py-3 font-semibold text-white'>{row.nickname}</td>
                    <td className='px-4 py-3 text-right tabular-nums text-white/75'>
                      {formatScore(row.score1)}
                    </td>
                    <td className='px-4 py-3 text-right tabular-nums text-white/75'>
                      {formatScore(row.score2)}
                    </td>
                    <td className='px-4 py-3 text-right font-bold tabular-nums text-white'>
                      {formatScore(row.total)}
                    </td>
                    <td className='px-4 py-3 text-xs text-white/55'>
                      {row.submittedAt ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className='space-y-3'>
        <StageTitle
          title='Swiss Stage'
          subtitle='1:1 · 2곡 합산 · 2패 누적 탈락 · 동점 시 타이브레이커 반복'
        />

        {swissByRound.length === 0 ? (
          <EmptyMessage>Swiss 경기 로그가 아직 입력되지 않았습니다.</EmptyMessage>
        ) : (
          <div className='space-y-3'>
            {swissByRound.map((block) => (
              <SwissRoundCard
                key={block.round}
                round={block.round}
                matches={block.matches}
                region={regionData}
              />
            ))}
          </div>
        )}

        {regionData.swissStandings.length > 0 ? (
          <div className='overflow-x-auto rounded-xl border border-white/10'>
            <table className='min-w-full text-left text-sm'>
              <thead className='bg-white/[0.07] text-xs font-semibold text-white/70'>
                <tr>
                  <th className='px-4 py-2.5'>엔트리</th>
                  <th className='px-4 py-2.5'>닉네임</th>
                  <th className='px-4 py-2.5 text-right'>시드</th>
                  <th className='px-4 py-2.5 text-right'>승</th>
                  <th className='px-4 py-2.5 text-right'>패</th>
                  <th className='px-4 py-2.5'>상태</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-white/[0.07]'>
                {regionData.swissStandings.map((row) => {
                  const statusColor = row.status === 'qualified'
                    ? 'text-emerald-300'
                    : row.status === 'eliminated'
                      ? 'text-red-300/70'
                      : row.status === 'decider'
                        ? 'text-[#ffb36d]'
                        : 'text-white/60'
                  return (
                    <tr key={row.entryId} className='transition-colors hover:bg-white/[0.03]'>
                      <td className='px-4 py-3 font-mono text-xs text-white/60'>{row.entryId}</td>
                      <td className='px-4 py-3 font-semibold text-white'>{row.nickname}</td>
                      <td className='px-4 py-3 text-right tabular-nums text-white/75'>{row.seed}</td>
                      <td className='px-4 py-3 text-right font-bold tabular-nums text-white'>{row.wins}</td>
                      <td className='px-4 py-3 text-right tabular-nums text-white/75'>{row.losses}</td>
                      <td className={`px-4 py-3 text-xs font-medium ${statusColor}`}>{row.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className='grid gap-6 md:grid-cols-2'>
        <div className='space-y-4'>
          <StageTitle
            title='3-1 추가 진출자 선발전'
            subtitle='과제곡: 大空と太鼓の踊り (Lv.9)'
          />

          {sortedDeciderRows.length === 0 ? (
            <EmptyMessage>3-1 선발전 결과가 아직 없습니다.</EmptyMessage>
          ) : (
            <div className='overflow-x-auto rounded-xl border border-white/10'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-white/[0.07] text-xs font-semibold text-white/70'>
                  <tr>
                    <th className='px-4 py-2.5'>순위</th>
                    <th className='px-4 py-2.5'>엔트리</th>
                    <th className='px-4 py-2.5'>닉네임</th>
                    <th className='px-4 py-2.5 text-right'>점수</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-white/[0.07]'>
                  {sortedDeciderRows.map((row) => (
                    <tr key={`${row.entryId}-${row.rank}`} className='transition-colors hover:bg-white/[0.03]'>
                      <td className='px-4 py-3 font-bold text-[#ff2a00]'>{row.rank}</td>
                      <td className='px-4 py-3 font-mono text-xs text-white/60'>{row.entryId}</td>
                      <td className='px-4 py-3 font-semibold text-white'>{row.nickname}</td>
                      <td className='px-4 py-3 text-right font-bold tabular-nums text-white'>
                        {formatScore(row.score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {regionData.deciderWinnerEntryId ? (
            <div className='rounded-lg border border-emerald-300/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-200'>
              선발전 통과: {renderParticipant(regionData, regionData.deciderWinnerEntryId)}
            </div>
          ) : null}
        </div>

        <div className='space-y-4'>
          <StageTitle
            title='결선 시드 배정전'
            subtitle='과제곡: タイコロール (Lv.10)'
          />

          {sortedSeedingRows.length === 0 ? (
            <EmptyMessage>시드 배정전 결과가 아직 없습니다.</EmptyMessage>
          ) : (
            <div className='overflow-x-auto rounded-xl border border-white/10'>
              <table className='min-w-full text-left text-sm'>
                <thead className='bg-white/[0.07] text-xs font-semibold text-white/70'>
                  <tr>
                    <th className='px-4 py-2.5'>순위</th>
                    <th className='px-4 py-2.5'>엔트리</th>
                    <th className='px-4 py-2.5'>닉네임</th>
                    <th className='px-4 py-2.5 text-right'>점수</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-white/[0.07]'>
                  {sortedSeedingRows.map((row) => (
                    <tr key={`${row.entryId}-${row.rank}`} className='transition-colors hover:bg-white/[0.03]'>
                      <td className='px-4 py-3 font-bold text-[#ff2a00]'>{row.rank}</td>
                      <td className='px-4 py-3 font-mono text-xs text-white/60'>{row.entryId}</td>
                      <td className='px-4 py-3 font-semibold text-white'>{row.nickname}</td>
                      <td className='px-4 py-3 text-right font-bold tabular-nums text-white'>
                        {formatScore(row.score)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className='grid gap-2.5 text-sm'>
            <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/5 px-4 py-3'>
              <span className='text-white/55'>지역 1위(A):</span>{' '}
              <span className='font-semibold text-white'>
                {regionData.qualifiers.groupA
                  ? `${regionData.qualifiers.groupA.nickname} (${regionData.qualifiers.groupA.entryId})`
                  : '미확정'}
              </span>
            </div>
            <div className='rounded-lg border border-[#ff2a00]/20 bg-[#ff2a00]/5 px-4 py-3'>
              <span className='text-white/55'>지역 2위(B):</span>{' '}
              <span className='font-semibold text-white'>
                {regionData.qualifiers.groupB
                  ? `${regionData.qualifiers.groupB.nickname} (${regionData.qualifiers.groupB.entryId})`
                  : '미확정'}
              </span>
            </div>
          </div>
        </div>
      </section>
    </TkcSection>
  )
}
