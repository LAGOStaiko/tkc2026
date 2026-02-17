import { createFileRoute } from '@tanstack/react-router'
import {
  Accordion,
  Callout,
  Card,
  FadeIn,
  StepCard,
  TkcIcon,
} from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/console/finals')({
  component: ConsoleFinalsPage,
})

const TOURNAMENT = [
  { round: '4강', format: '3곡 선취', note: 'A/B 각각 1곡씩 선택 + 과제곡' },
  {
    round: '3·4위전',
    format: '3곡 선취',
    note: 'A/B 각각 1곡씩 선택 + 과제곡',
  },
  { round: '결승', format: '5곡 선취', note: 'A/B 각각 2곡씩 선택 + 과제곡' },
] as const

const BRACKET = [
  { match: 'SF 1', players: '예선 1위 vs 예선 4위' },
  { match: 'SF 2', players: '예선 2위 vs 예선 3위' },
  { match: 'FINAL', players: 'SF 1 승자 vs SF 2 승자' },
] as const

const BANPICK = [
  'A가 B의 곡 1곡 밴',
  'B가 A의 곡 1곡 밴',
  'A가 본인 곡 선택',
  'B가 본인 곡 선택',
] as const

function ConsoleFinalsPage() {
  return (
    <div className='space-y-6'>
      <FadeIn>
        <Card>
          <h2 className='mb-4 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            결선 개요
          </h2>
          <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-3'>
            {TOURNAMENT.map((item) => (
              <div
                key={item.round}
                className='rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-3.5 py-3'
              >
                <div className='text-[11px] text-white/35'>{item.round}</div>
                <div className='mt-1 text-[15px] font-extrabold text-[#f5a623]'>
                  {item.format}
                </div>
                <div className='mt-1 text-[12px] leading-relaxed break-keep text-white/45'>
                  {item.note}
                </div>
              </div>
            ))}
          </div>

          <Callout type='info' icon={<TkcIcon name='info' />}>
            결선은 현장 지정 장비로만 진행되며, 심판 판정 및 운영진 지시를
            최우선으로 따릅니다.
          </Callout>
        </Card>
      </FadeIn>

      <FadeIn delay={80}>
        <Card>
          <h2 className='mb-4 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            대진 구조
          </h2>
          <div className='space-y-2.5'>
            {BRACKET.map((item) => (
              <div
                key={item.match}
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
          summary='각 매치 시작 전 밴픽 순서에 따라 곡을 제한/선택합니다.'
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

      <FadeIn delay={200}>
        <Accordion title='세부 규정 및 판정 기준'>
          <ul className='space-y-2 text-[13px] leading-relaxed text-white/60'>
            <li>• 곡 시작 이후 장비 이상 발생 시 심판 판단에 따라 재경기</li>
            <li>• 동점 발생 시 지정 타이브레이커 곡으로 승패 결정</li>
            <li>• 경기 지연, 비매너 행위는 경고 또는 실격 대상</li>
            <li>• 최종 해석 권한은 운영진과 심판단에 있음</li>
          </ul>
        </Accordion>
      </FadeIn>
    </div>
  )
}
