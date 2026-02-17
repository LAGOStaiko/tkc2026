import { createFileRoute } from '@tanstack/react-router'
import {
  Accordion,
  Callout,
  Card,
  FadeIn,
  StepCard,
  TkcIcon,
} from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/arcade/finals')({
  component: ArcadeFinalsPage,
})

type OverviewItem = { value: string; label: string; color?: string }

const OVERVIEW: OverviewItem[] = [
  { value: 'Top 8', label: '결선 진출', color: '#e74c3c' },
  { value: '8강 → 4강 → 결승', label: '토너먼트 구조' },
  { value: 'PlayX4', label: '현장 결선', color: '#f5a623' },
  { value: '밴픽', label: '공식 적용' },
]

const BRACKET = [
  { match: 'QF 1', players: '시드 1 vs 시드 8' },
  { match: 'QF 2', players: '시드 4 vs 시드 5' },
  { match: 'QF 3', players: '시드 2 vs 시드 7' },
  { match: 'QF 4', players: '시드 3 vs 시드 6' },
  { match: 'SF', players: 'QF 승자 간 대결' },
  { match: 'FINAL', players: 'SF 승자 간 결승전' },
] as const

const BANPICK = [
  'A가 B의 곡 1곡 밴',
  'B가 A의 곡 1곡 밴',
  'A가 본인 곡 선택',
  'B가 본인 곡 선택',
] as const

function ArcadeFinalsPage() {
  return (
    <div className='space-y-6'>
      <FadeIn>
        <Card>
          <h2 className='mb-4 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            결선 개요
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

          <Callout type='info' icon={<TkcIcon name='info' />}>
            결선은 PlayX4 현장 지정 기체로 진행되며, 운영진 안내에 따라
            순차적으로 진행됩니다.
          </Callout>
        </Card>
      </FadeIn>

      <FadeIn delay={80}>
        <Card>
          <h2 className='mb-4 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            대진표 기준
          </h2>
          <div className='space-y-2.5'>
            {BRACKET.map((item) => (
              <div
                key={`${item.match}-${item.players}`}
                className='flex items-center justify-between rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-3.5 py-3'
              >
                <span className='font-mono text-[12px] font-bold text-[#e74c3c]'>
                  {item.match}
                </span>
                <span className='text-[13px] font-medium text-white/75'>
                  {item.players}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={140}>
        <StepCard
          num='01'
          heading='밴픽 진행'
          summary='각 매치 시작 전 밴픽 순서에 따라 선택 가능 곡을 확정합니다.'
          toggleLabel='밴픽 단계 보기'
          accentColor='#f5a623'
        >
          <div className='space-y-2.5'>
            {BANPICK.map((item, i) => (
              <div
                key={item}
                className='rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-3 py-2.5 text-[13px] text-white/70'
              >
                <span className='mr-2 font-mono text-[11px] font-bold text-[#f5a623]'>
                  STEP {String(i + 1).padStart(2, '0')}
                </span>
                {item}
              </div>
            ))}
          </div>
        </StepCard>
      </FadeIn>

      <FadeIn delay={210}>
        <Accordion title='세부 규정 및 판정 기준'>
          <ul className='space-y-2 text-[13px] leading-relaxed text-white/60'>
            <li>• 경기 도중 장비 이상 시 심판단 판단으로 재경기 또는 중단</li>
            <li>• 동점 발생 시 운영진 지정 타이브레이커 적용</li>
            <li>• 지각/무단 이탈/비매너 행위는 경고 또는 실격 처리</li>
            <li>• 최종 해석 권한은 운영진과 심판단에 있음</li>
          </ul>
        </Accordion>
      </FadeIn>
    </div>
  )
}
