import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useResults } from '@/lib/api'
import {
  resolveArcadeSeasonArchive,
  type ArcadeFinalCrossMatch,
  type ArcadeFinalSeedRow,
} from '@/lib/arcade-results-archive'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/arcade-results/2026/finals')({
  component: ArcadeFinals2026Page,
})

const formatScore = (value?: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  return value.toLocaleString('en-US')
}

function deriveCrossMatches(
  groupA: ArcadeFinalSeedRow[],
  groupB: ArcadeFinalSeedRow[]
): ArcadeFinalCrossMatch[] {
  const aSorted = [...groupA].sort((a, b) => a.seed - b.seed)
  const bSorted = [...groupB].sort((a, b) => a.seed - b.seed)

  if (aSorted.length < 4 || bSorted.length < 4) return []

  return [
    { matchNo: 1, left: aSorted[0], right: bSorted[3] },
    { matchNo: 2, left: aSorted[1], right: bSorted[2] },
    { matchNo: 3, left: aSorted[2], right: bSorted[1] },
    { matchNo: 4, left: aSorted[3], right: bSorted[0] },
  ]
}

function GroupSeedTable({
  title,
  rows,
}: {
  title: string
  rows: ArcadeFinalSeedRow[]
}) {
  return (
    <div className='rounded-xl border border-white/10 bg-white/[0.03] p-5'>
      <div className='mb-4 text-sm font-bold text-[#ff2a00]'>{title}</div>

      {rows.length === 0 ? (
        <div className='text-sm text-white/55'>시드 데이터 입력 대기</div>
      ) : (
        <div className='overflow-x-auto rounded-lg border border-white/10'>
          <table className='w-full min-w-[480px] text-left text-sm'>
            <thead className='bg-white/[0.07] text-xs font-semibold text-white/70'>
              <tr>
                <th className='whitespace-nowrap px-4 py-2.5'>시드</th>
                <th className='whitespace-nowrap px-4 py-2.5'>지역</th>
                <th className='whitespace-nowrap px-4 py-2.5'>엔트리</th>
                <th className='whitespace-nowrap px-4 py-2.5'>닉네임</th>
                <th className='whitespace-nowrap px-4 py-2.5 text-right'>배정전 점수</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-white/[0.07]'>
              {[...rows]
                .sort((a, b) => a.seed - b.seed)
                .map((row) => (
                  <tr key={`${row.regionKey}-${row.entryId}-${row.seed}`} className='transition-colors hover:bg-white/[0.03]'>
                    <td className='whitespace-nowrap px-4 py-3 font-bold text-[#ff2a00]'>{row.seed}</td>
                    <td className='whitespace-nowrap px-4 py-3 text-white/75'>{row.regionLabel}</td>
                    <td className='whitespace-nowrap px-4 py-3 font-mono text-xs text-white/60'>{row.entryId}</td>
                    <td className='whitespace-nowrap px-4 py-3 font-semibold text-white'>{row.nickname}</td>
                    <td className='whitespace-nowrap px-4 py-3 text-right font-bold tabular-nums text-white'>
                      {formatScore(row.score)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ArcadeFinals2026Page() {
  const { data, isError } = useResults<unknown>()
  const archive = useMemo(() => resolveArcadeSeasonArchive(data), [data])

  const crossMatches = useMemo(() => {
    if (archive.finals.crossMatches.length > 0) return archive.finals.crossMatches
    return deriveCrossMatches(archive.finals.groupASeeds, archive.finals.groupBSeeds)
  }, [archive.finals.crossMatches, archive.finals.groupASeeds, archive.finals.groupBSeeds])

  useEffect(() => {
    document.title = `${t('meta.siteName')} | 아케이드 ${archive.season} Top 8 결선`
  }, [archive.season])

  return (
    <TkcSection className='space-y-8 md:space-y-10'>
      <div className='space-y-3'>
        <a href='/arcade-results/2026' className='text-sm text-white/60 hover:text-[#ff2a00] transition-colors'>
          ← 아케이드 시즌 페이지로 돌아가기
        </a>
        <TkcPageHeader
          title={`아케이드 ${archive.season} Top 8 결선`}
          subtitle='A그룹(지역 1위)과 B그룹(지역 2위) 크로스 매칭 기록'
        />
      </div>

      {isError ? (
        <div className='rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-100'>
          결선 아카이브 API가 비어 있어 현재 입력된 데이터만 표시합니다.
        </div>
      ) : null}

      <section className='grid gap-4 md:grid-cols-2'>
        <GroupSeedTable title='A그룹 시드 (지역 1위)' rows={archive.finals.groupASeeds} />
        <GroupSeedTable title='B그룹 시드 (지역 2위)' rows={archive.finals.groupBSeeds} />
      </section>

      <section className='space-y-4'>
        <h2 className='text-lg font-bold text-white'>Top 8 크로스 대진</h2>

        {crossMatches.length === 0 ? (
          <div className='rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white/60'>
            결선 대진 데이터 입력 대기
          </div>
        ) : (
          <div className='grid gap-3 md:grid-cols-2'>
            {crossMatches
              .slice()
              .sort((a, b) => a.matchNo - b.matchNo)
              .map((match) => {
                const leftName = `${match.left.regionLabel} ${match.left.nickname}`
                const leftId = match.left.entryId
                const rightName = `${match.right.regionLabel} ${match.right.nickname}`
                const rightId = match.right.entryId
                const isLeftWinner = match.winnerEntryId === match.left.entryId
                const isRightWinner = match.winnerEntryId === match.right.entryId
                const winnerLabel = isLeftWinner
                  ? `${leftName} (${leftId})`
                  : isRightWinner
                    ? `${rightName} (${rightId})`
                    : match.winnerEntryId || null

                return (
                  <div
                    key={`final-${match.matchNo}`}
                    className='rounded-xl border border-white/10 bg-white/[0.03] p-5'
                  >
                    <div className='text-xs font-bold tracking-wide text-[#ff2a00]'>MATCH {match.matchNo}</div>

                    <div className='mt-3 space-y-2'>
                      <div className={`flex items-baseline gap-2 text-sm ${isLeftWinner ? 'text-[#ff2a00] font-bold' : 'text-white'}`}>
                        <span>{leftName}</span>
                        <span className='font-mono text-[11px] text-white/45'>{leftId}</span>
                      </div>
                      <div className='text-xs font-bold text-white/40'>VS</div>
                      <div className={`flex items-baseline gap-2 text-sm ${isRightWinner ? 'text-[#ff2a00] font-bold' : 'text-white'}`}>
                        <span>{rightName}</span>
                        <span className='font-mono text-[11px] text-white/45'>{rightId}</span>
                      </div>
                    </div>

                    <div className='mt-4 rounded-lg border border-white/10 bg-black/25 px-3.5 py-2.5 text-xs'>
                      <span className='text-white/50'>승자:</span>{' '}
                      <span className='font-semibold text-white/80'>{winnerLabel ?? '기록 대기'}</span>
                    </div>

                    {match.note ? (
                      <div className='mt-2.5 text-xs text-white/55'>{match.note}</div>
                    ) : null}
                  </div>
                )
              })}
          </div>
        )}
      </section>
    </TkcSection>
  )
}