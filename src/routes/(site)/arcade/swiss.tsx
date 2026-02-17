import { createFileRoute } from '@tanstack/react-router'
import {
  Accordion,
  Card,
  FadeIn,
  StepCard,
} from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/arcade/swiss')({
  component: ArcadeSwissPage,
})

type SummaryItem = { value: string; label: string; color?: string }

const SUMMARY: SummaryItem[] = [
  { value: 'Top 16', label: '참가 인원', color: '#f5a623' },
  { value: '8경기', label: '라운드 1 매치 수' },
  { value: '2승', label: '기본 진출 기준', color: '#f7d154' },
  { value: 'Top 8', label: '결선 진출' },
]

const MATCH_RULES = [
  '동일 승패 그룹(예: 1-0, 0-1) 내에서 우선 매칭',
  '같은 상대 재대결은 가능한 한 회피',
  '매 라운드 결과로 다음 라운드 그룹 재편성',
  '동점 우선순위는 점수 합산/상대 전적/추가 기준 순 적용',
] as const

const ADVANCE = [
  { title: '결선 진출', desc: '스위스 종료 후 최종 상위 8명' },
  { title: '시드 배정', desc: '스위스 순위 기준으로 결선 대진 배치' },
  { title: '동점 처리', desc: '규정된 타이브레이커 순서 적용' },
] as const

function ArcadeSwissPage() {
  return (
    <div className='space-y-6'>
      <FadeIn>
        <Card>
          <h2 className='mb-4 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            오프라인 스위스 개요
          </h2>
          <div className='grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 sm:grid-cols-4'>
            {SUMMARY.map((item) => (
              <div
                key={item.label}
                className='rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-3 py-3'
              >
                <div className='text-[12px] text-white/35'>{item.label}</div>
                <div
                  className='mt-1 text-[13px] leading-tight font-extrabold tracking-tight sm:text-[14px]'
                  style={{ color: item.color ?? 'rgba(255,255,255,0.9)' }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={90}>
        <StepCard
          num='01'
          heading='매치 편성'
          summary='동일 승패 그룹 내에서 가능한 한 공정하게 상대를 편성합니다.'
          toggleLabel='매치 편성 규칙 보기'
          accentColor='#f5a623'
        >
          <ul className='space-y-2 text-[13px] leading-relaxed text-white/60'>
            {MATCH_RULES.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </StepCard>
      </FadeIn>

      <FadeIn delay={150}>
        <Card>
          <h2 className='mb-4 text-[17px] font-bold text-white/90 sm:text-[18px]'>
            진출 및 시드
          </h2>
          <div className='space-y-2.5'>
            {ADVANCE.map((item) => (
              <div
                key={item.title}
                className='rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] px-3.5 py-3'
              >
                <div className='text-[14px] font-bold text-white/85'>
                  {item.title}
                </div>
                <div className='mt-1 text-[12px] leading-relaxed text-white/45'>
                  {item.desc}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      <FadeIn delay={210}>
        <Accordion title='세부 규정 및 운영 기준'>
          <ul className='space-y-2 text-[13px] leading-relaxed text-white/60'>
            <li>• 지각/무단 불참 시 해당 경기 몰수 처리</li>
            <li>• 장비/운영 이슈는 현장 심판 판단으로 재진행 여부 결정</li>
            <li>• 비매너 플레이는 경고 누적 시 실격 가능</li>
            <li>• 최종 해석 권한은 운영진 및 심판단에 있음</li>
          </ul>
        </Accordion>
      </FadeIn>
    </div>
  )
}
