import { createFileRoute, Link } from '@tanstack/react-router'
import { Callout, Card, FadeIn, TkcIcon } from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/console/')({
  component: ConsoleQualifierPage,
})

type OverviewItem = { label: string; value: string; color?: string }

const OVERVIEW: OverviewItem[] = [
  { label: '진행 방식', value: '2곡 합산 점수' },
  { label: '결선 진출', value: '상위 4명', color: '#f7d154' },
  { label: '접수 기간', value: '2026.03.02 ~ 2026.04.30' },
  { label: '제출 방식', value: '유튜브 영상', color: '#f5a623' },
]

const SONGS = [
  { tag: '과제곡 1', name: '魍魎跋扈', difficulty: '오니', level: 'Lv.9' },
  {
    tag: '과제곡 2',
    name: 'TAIKO-TONGUE-TWISTER',
    difficulty: '오니',
    level: 'Lv.8',
  },
] as const

const CHECKLIST = [
  '플레이 화면(점수 포함)과 손캠이 모두 보이도록 촬영',
  '영상 편집/배속/중간 컷 없이 원본 그대로 제출',
  '유튜브 전체 공개 업로드 후 링크 제출',
  '응모자 본인 정보(이름, 닉네임, 연락처) 정확히 입력',
] as const

function ConsoleQualifierPage() {
  return (
    <div className='space-y-6'>
      <FadeIn>
        <Card>
          <h2 className='mb-4 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            예선 한눈에 보기
          </h2>
          <div className='grid grid-cols-2 gap-2.5 sm:grid-cols-4'>
            {OVERVIEW.map((item) => (
              <div
                key={item.label}
                className='rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-3 py-3'
              >
                <div className='text-[11px] text-white/35'>{item.label}</div>
                <div
                  className='mt-1 text-[14px] font-extrabold tracking-tight'
                  style={{ color: item.color ?? 'rgba(255,255,255,0.9)' }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={80}>
        <Card>
          <h2 className='mb-4 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            과제곡
          </h2>
          <div className='space-y-2.5'>
            {SONGS.map((song) => (
              <div
                key={song.name}
                className='rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-3.5 py-3'
              >
                <div className='mb-1 text-[11px] font-semibold tracking-wide text-white/35 uppercase'>
                  {song.tag}
                </div>
                <div className='text-[15px] font-bold text-white/88'>
                  {song.name}
                </div>
                <div className='mt-1 text-[12px] text-white/45'>
                  {song.difficulty} · {song.level}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={140}>
        <Card>
          <h2 className='mb-3 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            제출 체크리스트
          </h2>
          <ul className='space-y-2 text-[13px] leading-relaxed text-white/60 sm:text-[14px]'>
            {CHECKLIST.map((item) => (
              <li key={item} className='flex items-start gap-2 break-keep'>
                <span className='mt-[7px] size-1.5 shrink-0 rounded-full bg-[#f5a623]' />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Callout type='warning' icon={<TkcIcon name='warning' />}>
            제출 영상은 본인 플레이 여부와 규정 준수 여부를 판정하는 공식
            자료입니다. 규정 위반 시 예고 없이 실격 처리될 수 있습니다.
          </Callout>
        </Card>
      </FadeIn>

      <FadeIn delay={200}>
        <Card>
          <div className='flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center'>
            <div>
              <h2 className='text-[17px] font-bold text-white/90 sm:text-[18px]'>
                신청 페이지로 이동
              </h2>
              <p className='mt-1 text-[13px] text-white/45'>
                제출 링크와 참가 정보를 입력해 접수를 완료하세요.
              </p>
            </div>
            <Link
              to='/apply'
              className='inline-flex items-center justify-center rounded-lg bg-[#e74c3c] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#ff5d4f] sm:text-sm'
            >
              대회 신청하기
            </Link>
          </div>
        </Card>
      </FadeIn>
    </div>
  )
}
