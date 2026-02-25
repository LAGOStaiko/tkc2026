import { type ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ARCADE_SONGS } from '@/content/arcade-songs'
import {
  Callout,
  FadeIn,
  Accordion,
  StepCard,
  DetailSubtitle,
  DetailRow,
} from '@/components/tkc/guide-shared'
import { LevelBadge } from '@/components/tkc/level-badge'

export const Route = createFileRoute('/(site)/arcade/')({
  component: ArcadeOnlinePage,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Constants                                                          */
/* ════════════════════════════════════════════════════════════════════ */

const FLOW_CARDS = [
  {
    step: 'STEP 01',
    label: '온라인 예선',
    value: '2곡 합산\n스코어 어택',
    sub: '과제곡 2곡의 점수 합산으로 순위 결정',
    hasArrow: true,
  },
  {
    step: 'STEP 02',
    label: '오프라인 진출',
    value: '차수별 Top 16',
    sub: '각 차수 상위 16명 → 오프라인 스위스 스테이지',
    gold: true,
  },
  {
    step: '참가 방식',
    label: '예선 차수',
    value: '전국 4개 차수',
    sub: '서울 · 대전 · 광주 · 부산\n거주지 무관, 자유 선택',
  },
  {
    step: '점수 제출',
    label: '스코어 연동',
    value: '동더 광장 연동',
    sub: '북번호(太鼓番) 제출 → 점수 자동 반영',
  },
] as const

const REGIONS = [
  {
    num: 1,
    label: '1차수',
    venue: '서울',
    arcade: 'TAIKO LABS',
    image: '/branding/venue-seoul.webp',
  },
  {
    num: 2,
    label: '2차수',
    venue: '대전',
    arcade: '대전 싸이뮤직 게임월드',
    image: '/branding/venue-daejeon.webp',
  },
  {
    num: 3,
    label: '3차수',
    venue: '광주',
    arcade: '광주 게임플라자',
    image: '/branding/venue-gwangju.webp',
  },
  {
    num: 4,
    label: '4차수',
    venue: '부산',
    arcade: '경성대 게임 D',
    image: '/branding/venue-busan.webp',
  },
] as const

const LINK_FLOW = [
  { num: '①', label: '북번호(太鼓番) 제출', desc: '신청 폼에서 입력' },
  { num: '②', label: '동더 광장 연동', desc: '점수 자동 수집' },
  { num: '③', label: '홈페이지 표시', desc: '실시간 점수 반영' },
] as const

const SONGS = [
  {
    label: '과제곡 1',
    name: ARCADE_SONGS.online1.title,
    genre: '귀신 앞보면',
    level: 8,
    levelColor: '#b275f0',
  },
  {
    label: '과제곡 2',
    name: ARCADE_SONGS.online2.title,
    genre: '귀신 앞보면',
    level: 8,
    levelColor: '#b275f0',
  },
] as const

const REQUIRED_INFO = [
  { label: '북번호(太鼓番)' },
  { label: '바나패스 번호' },
] as const

const ELIGIBILITY_ROWS = [
  { label: '국적', value: '대한민국 국적 보유' },
  { label: '거주', value: '대한민국 거주자' },
] as const

const CARD_RULES = [
  { label: '참가 카드', value: '1인당 1장만 사용 가능' },
  { label: '카드 양도 · 대여', value: '금지', isRed: true },
  { label: '타인 대리 연주', value: '금지', isRed: true },
] as const

const PENALTIES = [
  '참가 자격 취소',
  '스코어 삭제',
  '랭킹 제외',
  '수상 권리 박탈',
] as const

const SCORE_RULES = [
  { label: '도전 횟수', value: '제한 없음' },
  { label: '집계 방식', value: '각 곡 최고 득점 합산' },
  { label: '플레이 모드', value: '연주 모드 / AI 배틀 연주' },
] as const

const MINOR_ROWS = [
  { label: '대상', value: '2008년생 이후' },
  { label: '보호자 동의', value: '필수', isBadge: true },
  { label: '제출 방법', value: '동의서(PDF) 작성 후 업로드' },
  { label: '연령 제한', value: '별도 없음' },
] as const

const NOTICES = [
  '본 룰북은 <strong>아케이드 부문</strong>에 해당하며, 콘솔 부문은 별도 룰북을 참고해 주십시오.',
  '룰북 내용은 운영 상황에 따라 <strong>변경될 수 있으며</strong>, 변경 시 공식 채널을 통해 사전 공지됩니다.',
  '모든 참가자는 본 룰북의 내용을 <strong>숙지하고 동의한 것으로 간주</strong>합니다.',
  '대회 중 분쟁사항에 대한 <strong>최종 판단은 운영 측</strong>에 있습니다.',
  '부정행위 적발 시 <strong>실격 및 향후 대회 참가 제한</strong> 조치가 이루어질 수 있습니다.',
] as const

const DISCLAIMERS = [
  '연주 중 트러블·사고 등으로 스코어가 서버에 정상 송신되지 않은 경우 <strong>주최 측은 책임지지 않습니다.</strong>',
  '본 대회는 사전 예고 없이 <strong>변경·중지·종료</strong>될 수 있으며, 변경 사항은 사이트 게재 시점부터 모든 참가자에게 적용됩니다.',
] as const

const NOTICE_ROW_ICONS = [
  '/characters/ika_2_sprite_11.png',
  '/characters/ika_2_sprite_15.png',
  '/characters/ika_2_sprite_03.png',
  '/characters/ika_2_sprite_07.png',
] as const

const CALLOUT_CHAR_ICONS = {
  warning: '/characters/callout-warning.png',
  info: '/characters/callout-info.png',
  notice: '/characters/notice-info.png',
} as const

function CalloutCharIcon({
  type,
  className = 'size-5 shrink-0',
}: {
  type: keyof typeof CALLOUT_CHAR_ICONS
  className?: string
}) {
  return (
    <img
      src={CALLOUT_CHAR_ICONS[type]}
      alt=''
      className={`${className} object-contain`}
      loading='lazy'
      draggable={false}
    />
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page-specific components                                           */
/* ════════════════════════════════════════════════════════════════════ */

/** ─── [NEW] 스텝 간 연결선 ─── */
function StepConnector() {
  return (
    <div className='flex flex-col items-center py-1'>
      <div className='h-5 w-px bg-gradient-to-b from-[#f5a623]/40 to-[#f5a623]/15' />
      <div className='flex size-6 items-center justify-center rounded-full border border-[#f5a623]/25 bg-[#f5a623]/[0.06]'>
        <svg
          width='10'
          height='10'
          viewBox='0 0 10 10'
          fill='none'
          className='text-[#f5a623]'
        >
          <path
            d='M5 1.5V8.5M5 8.5L2 5.5M5 8.5L8 5.5'
            stroke='currentColor'
            strokeWidth='1.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        </svg>
      </div>
      <div className='h-5 w-px bg-gradient-to-b from-[#f5a623]/15 to-transparent' />
    </div>
  )
}

function HighlightCard({
  title,
  tag,
  tagCls,
  children,
}: {
  title: string
  tag: string
  tagCls: string
  children: ReactNode
}) {
  return (
    <div className='relative overflow-hidden rounded-xl border border-[#f5a623]/25 bg-[#111] px-6 py-5'>
      <div className='absolute top-0 right-0 left-0 h-0.5 bg-[#f5a623]' />
      <div className='mb-2 flex items-center gap-2'>
        <span className='text-sm font-bold text-white/90'>{title}</span>
        <span
          className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold ${tagCls}`}
        >
          {tag}
        </span>
      </div>
      <div className='text-[13px] leading-[1.55] break-keep text-white/55 [&>strong]:text-white/90'>
        {children}
      </div>
    </div>
  )
}

/** ─── [CHANGED] AdvanceVisual — 16칸 슬롯 제거, 핵심만 압축 ─── */
function AdvanceVisual() {
  return (
    <div
      className='relative overflow-hidden rounded-2xl border border-[#f5a623]/20 px-7 pt-8 pb-7 text-center'
      style={{
        background:
          'linear-gradient(180deg, rgba(245,166,35,0.06) 0%, rgba(10,10,10,0.9) 100%)',
      }}
    >
      {/* Glow */}
      <div className='tkc-motion-glow pointer-events-none absolute -top-16 left-1/2 h-[260px] w-[260px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(245,166,35,0.18)_0%,transparent_70%)]' />

      {/* Ring */}
      <div className='relative mx-auto mb-4 flex size-[90px] items-center justify-center rounded-full border-[3px] border-[#f5a623] shadow-[0_0_30px_rgba(245,166,35,0.2),inset_0_0_20px_rgba(245,166,35,0.05)]'>
        <div className='absolute -inset-2 rounded-full border border-[#f5a623]/12' />
        <div className='flex items-baseline gap-0.5'>
          <span className='text-[34px] leading-none font-extrabold text-[#f5a623]'>
            16
          </span>
          <span className='text-sm font-bold text-[#f5a623]/70'>명</span>
        </div>
      </div>

      <div className='text-[13px] font-semibold tracking-wide text-[#f5a623]'>
        스위스 스테이지 진출
      </div>
      <div className='mt-1 text-[24px] font-extrabold tracking-tight text-white/90'>
        차수별 Top 16
      </div>
      <div className='mx-auto mt-2 max-w-[300px] text-[13px] leading-[1.55] text-white/55'>
        해당 차수 통산 점수 상위 16명이
        <br />
        스위스 스테이지에 진출
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

function ArcadeOnlinePage() {
  return (
    <>
      {/* ── At a Glance ── */}
      <FadeIn>
        <div className='mb-12'>
          <div className='mb-2 font-mono text-[13px] font-bold tracking-[2px] text-[#f5a623] uppercase'>
            Online Qualifier
          </div>
          <h2 className='mb-8 flex items-center gap-2.5 text-[28px] font-black tracking-tight text-white/90'>
            한눈에 보기
            <span className='size-2 rounded-full bg-[#f5a623] shadow-[0_0_8px_rgba(245,166,35,0.3)]' />
          </h2>

          {/* Main 2×2 flow grid */}
          <div className='grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#2a2a2a] sm:grid-cols-2'>
            {FLOW_CARDS.map((card) => (
              <div
                key={card.step}
                className='relative bg-[#141414] px-6 py-7 transition-colors hover:bg-[#1a1a1a]'
              >
                <div className='mb-1.5 font-mono text-[11px] font-bold tracking-[1.5px] text-[#b8842a] uppercase'>
                  {card.step}
                </div>
                <div className='mb-1 text-[12px] text-white/50'>
                  {card.label}
                </div>
                <div
                  className={`text-[22px] leading-[1.3] font-black tracking-tight whitespace-pre-line ${
                    'gold' in card && card.gold
                      ? 'text-[#f5a623]'
                      : 'text-white/90'
                  }`}
                >
                  {card.value}
                </div>
                <div className='mt-1.5 text-[12px] leading-relaxed whitespace-pre-line text-white/40'>
                  {card.sub}
                </div>
                {'hasArrow' in card && card.hasArrow && (
                  <span className='absolute top-1/2 right-0 z-[2] hidden translate-x-1/2 -translate-y-1/2 text-sm text-[#b8842a] sm:block'>
                    →
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Bottom info strip */}
          <div className='mt-0.5 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] sm:grid-cols-2'>
            <div className='flex items-center gap-3.5 bg-[#141414] px-6 py-5 transition-colors hover:bg-[#1a1a1a]'>
              <div className='flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-[#f5a623]/15 bg-[#f5a623]/[0.08]'>
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='#f5a623'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <rect x='3' y='4' width='18' height='18' rx='2' ry='2' />
                  <line x1='16' y1='2' x2='16' y2='6' />
                  <line x1='8' y1='2' x2='8' y2='6' />
                  <line x1='3' y1='10' x2='21' y2='10' />
                </svg>
              </div>
              <div>
                <div className='text-[11px] text-white/50'>신청 기간</div>
                <div className='text-[15px] font-bold text-white/90'>
                  3.2 ~ 4.30
                </div>
              </div>
            </div>
            <div className='flex items-center gap-3.5 bg-[#141414] px-6 py-5 transition-colors hover:bg-[#1a1a1a]'>
              <div className='flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-[#f5a623]/15 bg-[#f5a623]/[0.08]'>
                <svg
                  width='18'
                  height='18'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='#f5a623'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
                </svg>
              </div>
              <div>
                <div className='text-[11px] text-white/50'>오프라인 예선</div>
                <div className='text-[15px] font-bold text-white/90'>
                  스위스 스테이지 (2패 탈락)
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── Steps Header ── */}
      <FadeIn>
        <div className='mb-2 font-mono text-xs font-semibold tracking-[1px] text-[#f5a623] uppercase'>
          How to participate
        </div>
        <h2 className='mb-2 text-[clamp(22px,4vw,30px)] font-extrabold tracking-tight text-white/90'>
          참가 3단계
        </h2>
        <p className='mb-8 text-sm font-light text-white/55'>
          온라인 예선(스코어 어택) 기준으로 안내합니다.
        </p>
      </FadeIn>

      {/* ── Steps — [CHANGED] 연결선 추가 ── */}
      <div className='flex flex-col'>
        {/* ── Step 01: 신청 & 차수 선택 ── */}
        <StepCard
          num='01'
          heading='신청 & 차수 선택'
          summary={
            <>
              홈페이지에서 <strong className='text-white/90'>참가 차수</strong>
              를 선택하여 신청합니다. 거주지와 무관하게 자유롭게 선택 가능하며,
              오프라인 예선곡 4곡도 함께 선택합니다.
            </>
          }
          toggleLabel='차수 안내 · 사용곡 선택 상세 보기'
        >
          <HighlightCard
            title='차수란?'
            tag='중요'
            tagCls='bg-[#f5a623]/[0.08] text-[#f5a623]'
          >
            차수는 <strong>스위스 스테이지가 열리는 장소</strong>를 의미합니다.
            <br />
            예를 들어, 1차수(서울 · TAIKO LABS)에 신청하면{' '}
            <strong>거주지에 상관없이</strong> 1차수에 신청한 참가자들끼리
            온라인 점수를 겨루고, 상위 16명이{' '}
            <strong>서울 TAIKO LABS에서 열리는 오프라인 대회</strong>에 진출하는
            구조입니다.
          </HighlightCard>

          {/* ── [CHANGED] 차수 안내 섹션 — 별도 박스로 분리 ── */}
          <div className='rounded-xl border border-[#1e1e1e] bg-white/[0.015] p-4'>
            <DetailSubtitle>차수 안내</DetailSubtitle>
            <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
              {REGIONS.map((r) => (
                <div
                  key={r.num}
                  className='relative overflow-hidden rounded-xl border border-[#f5a623]/15 bg-[#111] px-3 pt-4 pb-5 text-center'
                >
                  <div className='absolute top-0 right-0 left-0 h-0.5 bg-[#f5a623]' />
                  <img
                    src={r.image}
                    alt={r.arcade}
                    className='mx-auto mb-3 size-12 rounded-lg object-cover'
                    loading='lazy'
                  />
                  <div className='mb-0.5 font-mono text-[11px] font-semibold tracking-wide text-white/35 uppercase'>
                    {r.label}
                  </div>
                  <div className='text-lg font-extrabold text-[#f5a623]'>
                    {r.venue}
                  </div>
                  <div className='mt-2 inline-block rounded-md border border-[#f5a623]/20 bg-[#f5a623]/[0.06] px-2.5 py-1 text-[12px] font-bold tracking-wide text-[#f5a623]'>
                    {r.arcade}
                  </div>
                </div>
              ))}
            </div>
            <Callout type='info' icon={<CalloutCharIcon type='info' />}>
              차수별로 <strong className='text-white/80'>별도 집계</strong>
              됩니다. 같은 차수에 신청한 참가자끼리만 경쟁합니다.
            </Callout>
          </div>

          {/* ── [CHANGED] 오프라인 예선곡 선택 섹션 — 별도 박스로 분리 ── */}
          <div className='rounded-xl border border-[#1e1e1e] bg-white/[0.015] p-4'>
            <HighlightCard
              title='오프라인 예선곡 선택'
              tag='필수'
              tagCls='bg-[#f5a623]/[0.08] text-[#f5a623]'
            >
              신청 시 <strong>스위스 스테이지에서 사용할 곡 4곡</strong>을 미리
              선택해야 합니다. 신청 이후에는 변경할 수 없습니다.
            </HighlightCard>
            <Link
              to='/song-pool'
              className='inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#f5a623]/70 transition-colors hover:text-[#f5a623]'
            >
              선곡풀 확인하기
              <span aria-hidden>→</span>
            </Link>
          </div>

          <Callout type='danger' icon={<CalloutCharIcon type='warning' />}>
            예선은 <strong className='text-[#e74c3c]'>1개의 차수만</strong> 참가
            가능하며, 온라인 예선 탈락 시 다른 차수에 도전할 수 없습니다.
          </Callout>
          <Callout type='info' icon={<CalloutCharIcon type='info' />}>
            엔트리 취소는{' '}
            <strong className='text-white/80'>불가능합니다.</strong> 차수 선택은
            신중하게 결정해 주세요.
          </Callout>
        </StepCard>

        {/* ── [NEW] 연결선 01 → 02 ── */}
        <StepConnector />

        {/* ── Step 02: 동더 광장 연동 & 점수 제출 ── */}
        <StepCard
          num='02'
          heading='동더 광장 연동 & 점수 제출'
          summary={
            <>
              북번호(太鼓番)를 제출하면 동더 광장을 통해 과제곡 점수가{' '}
              <strong className='text-white/90'>자동으로 반영</strong>됩니다.
              별도 영상 촬영 없이, 플레이만 하면 됩니다.
            </>
          }
          toggleLabel='연동 절차 · 과제곡 상세 보기'
        >
          <div>
            <DetailSubtitle>연동 절차</DetailSubtitle>
            <div className='flex gap-0'>
              {LINK_FLOW.map((step, i) => (
                <div
                  key={step.num}
                  className={`flex-1 border border-[#1e1e1e] bg-white/[0.015] px-2.5 py-3.5 text-center ${
                    i === 0 ? 'rounded-l-xl' : i === 2 ? 'rounded-r-xl' : ''
                  } ${i > 0 ? '-ml-px' : ''}`}
                >
                  <div className='mb-1 text-base font-extrabold text-[#f5a623]'>
                    {step.num}
                  </div>
                  <div className='text-xs font-semibold text-white/90'>
                    {step.label}
                  </div>
                  <div className='mt-0.5 text-[11px] text-white/35'>
                    {step.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <DetailSubtitle>필수 제출 정보</DetailSubtitle>
            {REQUIRED_INFO.map((info) => (
              <div
                key={info.label}
                className='flex items-center justify-between border-b border-[#1e1e1e] py-2.5 text-[13px] last:border-b-0'
              >
                <span className='text-white/55'>{info.label}</span>
                <span className='rounded bg-[#f5a623]/[0.08] px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wide text-[#f5a623]'>
                  필수
                </span>
              </div>
            ))}
          </div>

          <div>
            <DetailSubtitle>과제곡</DetailSubtitle>
            <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
              {SONGS.map((song, i) => (
                <div
                  key={song.name}
                  className='relative overflow-hidden rounded-xl border border-[#1e1e1e] bg-white/[0.02] p-4'
                >
                  <div
                    className='absolute top-0 right-0 left-0 h-0.5'
                    style={{
                      background: i === 0 ? '#f5a623' : '#f7d154',
                    }}
                  />
                  <div className='mb-1.5 font-mono text-[11px] font-semibold tracking-wide text-white/35 uppercase'>
                    {song.label}
                  </div>
                  <div className='mb-1 text-[15px] font-extrabold tracking-tight text-white/90'>
                    {song.name}
                  </div>
                  <div className='flex items-center gap-2 text-xs text-white/55'>
                    <span>{song.genre}</span>
                    <LevelBadge level={song.level} />
                  </div>
                </div>
              ))}
            </div>
            <Callout type='danger' icon={<CalloutCharIcon type='warning' />}>
              온라인 예선에서는{' '}
              <strong className='text-[#e74c3c]'>
                '음표 위치 조정', '목소리', '연주 스킵', '음색'
              </strong>
              만 사용할 수 있으며, 그 외 옵션 사용 시 집계에서 제외됩니다.
            </Callout>
          </div>

          <Callout type='info' icon={<CalloutCharIcon type='info' />}>
            동점 시{' '}
            <strong className='text-white/80'>
              먼저 해당 스코어를 기록한 자
            </strong>
            에게 시드를 부여합니다.
          </Callout>
        </StepCard>

        {/* ── [NEW] 연결선 02 → 03 ── */}
        <StepConnector />

        {/* ── Step 03: 스위스 스테이지 진출 ── */}
        <StepCard
          num='03'
          heading='스위스 스테이지 진출'
          summary={
            <>
              2곡 합산 점수{' '}
              <strong className='text-white/90'>차수별 상위 16명</strong>이
              스위스 스테이지에 진출합니다. 스위스 스테이지를 거쳐 최종 결선
              진출자가 결정됩니다.
            </>
          }
          toggleLabel='점수 산정 · 진출 구조 상세 보기'
        >
          <div>
            <DetailSubtitle>점수 산정 방식</DetailSubtitle>
            <div className='flex flex-wrap items-center justify-center gap-3 py-2'>
              <div className='rounded-xl border border-[#1e1e1e] bg-white/[0.02] px-5 py-2.5 text-center'>
                <div className='text-[11px] text-white/35'>{SONGS[0].name}</div>
                <div className='text-sm font-bold text-white/90'>점수 A</div>
              </div>
              <div className='text-xl font-extrabold text-[#f5a623]'>+</div>
              <div className='rounded-xl border border-[#1e1e1e] bg-white/[0.02] px-5 py-2.5 text-center'>
                <div className='text-[11px] text-white/35'>{SONGS[1].name}</div>
                <div className='text-sm font-bold text-white/90'>점수 B</div>
              </div>
              <div className='text-xl font-extrabold text-[#f5a623]'>=</div>
              <div className='rounded-xl border border-[#f7d154]/25 bg-[#f7d154]/[0.03] px-5 py-2.5 text-center'>
                <div className='text-[11px] text-white/35'>통산 점수</div>
                <div className='text-sm font-bold text-[#f7d154]'>A + B</div>
              </div>
            </div>
          </div>

          {/* [CHANGED] 간소화된 AdvanceVisual */}
          <AdvanceVisual />

          <Callout type='danger' icon={<CalloutCharIcon type='warning' />}>
            오프라인 예선에서는{' '}
            <strong className='text-[#e74c3c]'>
              '음표 위치 조정'과 '목소리'
            </strong>
            만 사용할 수 있으며, 그 외의 연주 옵션은 사용할 수 없습니다.
          </Callout>

          <Callout type='info' icon={<CalloutCharIcon type='info' />}>
            참가자 기권 또는 불참 시,{' '}
            <strong className='text-white/80'>예비 순번 기준</strong>으로 대체
            진행됩니다.
          </Callout>
        </StepCard>
      </div>

      {/* ── Swiss Stage Link ── */}
      <FadeIn>
        <Link
          to='/arcade/swiss'
          className='mt-2 mb-2 flex items-center gap-4 rounded-xl border border-[#1e1e1e] bg-[#111] px-6 py-5 transition-colors hover:border-[#2a2a2a]'
        >
          <div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#f5a623]/15 bg-[#f5a623]/[0.08] text-lg font-extrabold text-[#f5a623]'>
            S
          </div>
          <div className='min-w-0 flex-1'>
            <div className='text-sm font-bold text-white/90'>
              스위스 스테이지 규정 보기
            </div>
            <div className='text-xs text-white/35'>
              2패 탈락 스위스 시스템, 매치 룰, 진출 조건 등 상세 규정
            </div>
          </div>
          <span className='shrink-0 text-white/35'>→</span>
        </Link>
      </FadeIn>

      {/* ── [NEW] CTA — 참가 신청 ── */}
      <FadeIn>
        <div className='mt-6 mb-2'>
          <Link
            to='/apply'
            className='group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl border border-[#f5a623]/40 bg-[#f5a623] px-8 py-5 text-center transition-all hover:shadow-[0_0_32px_rgba(245,166,35,0.25)]'
          >
            <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity group-hover:opacity-100' />
            <span className='text-[17px] font-extrabold tracking-tight text-[#0a0a0a]'>
              대회 참가 신청하기
            </span>
            <span className='text-lg text-[#0a0a0a]/60'>→</span>
          </Link>
        </div>
      </FadeIn>

      {/* ── Detailed Rules ── */}
      <div className='mt-16'>
        <div className='mb-12 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent' />
        <FadeIn>
          <div className='mb-2 font-mono text-xs font-semibold tracking-[1px] text-[#f5a623] uppercase'>
            Detailed Rules
          </div>
          <h2 className='mb-2 text-[clamp(22px,4vw,30px)] font-extrabold tracking-tight text-white/90'>
            세부 규정
          </h2>
          <p className='mb-8 text-sm font-light text-white/55'>
            참가 전 반드시 확인해 주세요.
          </p>
        </FadeIn>

        <FadeIn delay={150}>
          <div className='space-y-3'>
            {/* ① 참가 자격 및 카드 규정 */}
            <Accordion title='참가 자격 및 카드 규정'>
              <div className='space-y-5 sm:space-y-6'>
                <div>
                  <DetailSubtitle>자격 요건</DetailSubtitle>
                  {ELIGIBILITY_ROWS.map((r) => (
                    <DetailRow key={r.label} label={r.label} value={r.value} />
                  ))}
                </div>

                <div>
                  <DetailSubtitle>Bandai Namco Passport 규정</DetailSubtitle>
                  {CARD_RULES.map((r) => (
                    <DetailRow
                      key={r.label}
                      label={r.label}
                      value={r.value}
                      valueClassName={
                        'isRed' in r && r.isRed
                          ? 'shrink-0 font-semibold text-[#e74c3c]/80'
                          : undefined
                      }
                    />
                  ))}
                </div>

                <div className='[&>div]:mt-0'>
                  <Callout type='info' icon={<CalloutCharIcon type='info' />}>
                    2장 이상의 카드로 신청 시{' '}
                    <strong className='text-white/80'>
                      규칙 위반으로 간주
                    </strong>
                    됩니다. 신청한 카드가 아닌 별도의 카드로 연주한 점수는
                    집계되지 않습니다. 중복 신청 시 동더 광장에서 직접 취소해
                    주세요.
                  </Callout>
                </div>

                <div>
                  <DetailSubtitle>위반 시 조치</DetailSubtitle>
                  <div className='flex flex-wrap gap-1.5'>
                    {PENALTIES.map((p) => (
                      <span
                        key={p}
                        className='rounded-lg border border-[#e74c3c]/15 bg-[#e74c3c]/[0.06] px-2.5 py-1 text-xs font-semibold text-[#e74c3c]/80'
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div className='[&>div]:mt-0'>
                  <Callout
                    type='danger'
                    icon={<CalloutCharIcon type='warning' />}
                  >
                    규칙 위반 의심 시 주최 측에서{' '}
                    <strong className='text-[#e74c3c]'>
                      독자적으로 조사를 시행
                    </strong>
                    하며, 악질적인 위반 시{' '}
                    <strong className='text-[#e74c3c]'>
                      향후 공식 이벤트 참가가 영구 제한
                    </strong>
                    될 수 있습니다.
                  </Callout>
                </div>
              </div>
            </Accordion>

            {/* ② 연주 규정 */}
            <Accordion title='연주 규정'>
              <div className='space-y-5 sm:space-y-6'>
                <div>
                  <DetailSubtitle>연주 옵션</DetailSubtitle>
                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                    {/* 온라인 예선 */}
                    <div className='rounded-xl border border-[#1e1e1e] bg-white/[0.015] p-4'>
                      <div className='mb-2 text-[11px] font-semibold tracking-[0.5px] text-white/35'>
                        온라인 예선
                      </div>
                      <div className='flex flex-wrap gap-1.5'>
                        {['음표 위치 조정', '목소리', '연주 스킵', '음색'].map(
                          (opt) => (
                            <span
                              key={opt}
                              className='rounded-md border border-[#f5a623]/15 bg-[#f5a623]/[0.08] px-2 py-0.5 text-xs font-semibold text-[#f5a623]'
                            >
                              {opt}
                            </span>
                          )
                        )}
                      </div>
                      <div className='mt-2 text-[11px] text-white/35'>
                        위 4개만 허용, 그 외 사용 시 집계 제외
                      </div>
                    </div>
                    {/* 오프라인 예선 */}
                    <div className='rounded-xl border border-[#1e1e1e] bg-white/[0.015] p-4'>
                      <div className='mb-2 text-[11px] font-semibold tracking-[0.5px] text-white/35'>
                        오프라인 예선
                      </div>
                      <div className='flex flex-wrap gap-1.5'>
                        {[
                          { name: '음표 위치 조정', ok: true },
                          { name: '목소리', ok: true },
                          { name: '연주 스킵', ok: false },
                          { name: '음색', ok: false },
                        ].map((opt) => (
                          <span
                            key={opt.name}
                            className={
                              opt.ok
                                ? 'rounded-md border border-[#f5a623]/15 bg-[#f5a623]/[0.08] px-2 py-0.5 text-xs font-semibold text-[#f5a623]'
                                : 'rounded-md border border-[#1e1e1e] bg-white/[0.03] px-2 py-0.5 text-xs font-semibold text-white/35 line-through'
                            }
                          >
                            {opt.name}
                          </span>
                        ))}
                      </div>
                      <div className='mt-2 text-[11px] text-white/35'>
                        위 2개만 허용, 연주 스킵 · 음색 사용 불가
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <DetailSubtitle>북채 규정</DetailSubtitle>
                  <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                    <div className='rounded-[10px] border border-[#f5a623]/20 bg-white/[0.015] p-3 text-center'>
                      <div className='mb-1 text-[11px] font-semibold text-[#f5a623]'>
                        ✓ 사용 가능
                      </div>
                      <div className='text-xs leading-relaxed text-white/55'>
                        기기 부속 북채(정품)
                        <br />
                        태고의 달인 공식 커스텀 북채
                      </div>
                    </div>
                    <div className='rounded-[10px] border border-[#e74c3c]/15 bg-white/[0.015] p-3 text-center'>
                      <div className='mb-1 text-[11px] font-semibold text-[#e74c3c]'>
                        ✕ 사용 불가
                      </div>
                      <div className='text-xs leading-relaxed text-white/55'>
                        가공된 북채
                        <br />
                        (절단, 테이핑 등 변형)
                      </div>
                    </div>
                  </div>
                  <a
                    href='https://taiko.namco-ch.net/taiko/kr/mybachi/attention/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='mt-1 inline-block text-xs text-[#f5a623] hover:underline'
                  >
                    공식 커스텀 북채 확인 사항 보기 →
                  </a>
                </div>

                <div>
                  <DetailSubtitle>스코어 집계</DetailSubtitle>
                  {SCORE_RULES.map((r) => (
                    <DetailRow key={r.label} label={r.label} value={r.value} />
                  ))}
                </div>
              </div>
            </Accordion>

            {/* ③ 미성년자 참가 규정 */}
            <Accordion title='미성년자 참가 규정'>
              <div className='space-y-5 sm:space-y-6'>
                <div>
                  {MINOR_ROWS.map((r) => (
                    <DetailRow
                      key={r.label}
                      label={r.label}
                      value={r.value}
                      isBadge={'isBadge' in r ? r.isBadge : undefined}
                    />
                  ))}
                </div>

                <div className='[&>div]:mt-0'>
                  <Callout type='info' icon={<CalloutCharIcon type='info' />}>
                    보호자 동의 요건을 충족하면{' '}
                    <strong className='text-white/80'>연령 제한 없이</strong>{' '}
                    참가할 수 있습니다.
                  </Callout>
                </div>
              </div>
            </Accordion>

            {/* ④ 유의사항 및 면책 */}
            <Accordion title='유의사항 및 면책'>
              <div className='space-y-5 sm:space-y-6'>
                <div>
                  <DetailSubtitle>대회 규정</DetailSubtitle>
                  <div className='space-y-1.5'>
                    {NOTICES.map((html, i) => (
                      <div
                        key={i}
                        className='flex items-center gap-2.5 rounded-xl border border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2.5 text-[13px]'
                      >
                        <img
                          src={NOTICE_ROW_ICONS[i % NOTICE_ROW_ICONS.length]}
                          alt=''
                          className='size-6 shrink-0 object-contain opacity-90'
                          loading='lazy'
                          draggable={false}
                        />
                        <span
                          className='break-keep text-white/55 [&>strong]:text-white/90'
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <DetailSubtitle>면책 사항</DetailSubtitle>
                  <div className='space-y-1.5'>
                    {DISCLAIMERS.map((html, i) => (
                      <div
                        key={i}
                        className='flex items-start gap-2.5 rounded-xl border border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2.5 text-[13px]'
                      >
                        <span className='shrink-0 text-white/35'>·</span>
                        <span
                          className='break-keep text-white/55 [&>strong]:text-white/90'
                          dangerouslySetInnerHTML={{ __html: html }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Accordion>
          </div>
        </FadeIn>
      </div>
    </>
  )
}
