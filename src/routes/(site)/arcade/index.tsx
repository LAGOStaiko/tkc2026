import { type ReactNode } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ARCADE_SONGS } from '@/content/arcade-songs'
import {
  Callout,
  FadeIn,
  Card,
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

type GlanceItem = {
  label: string
  value: string
  color?: string
  sub?: string
}

const GLANCE_ITEMS: GlanceItem[] = [
  { label: '온라인 예선', value: '2곡 합산\n스코어 어택' },
  { label: '오프라인 예선', value: '스위스 스테이지', color: '#f5a623' },
  { label: '예선 차수', value: '4개 차수' },
  { label: '온라인 → 오프라인', value: '차수별 Top 16', color: '#f7d154' },
  { label: '신청 기간', value: '3.2 ~ 4.30' },
  { label: '점수 제출', value: '동더 광장 연동', color: '#f7d154' },
]

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
    arcade: '게임D',
    image: '/branding/venue-busan.webp',
  },
] as const

const LINK_FLOW = [
  { num: '①', label: '남코 아이디 제출', desc: '신청 폼에서 입력' },
  { num: '②', label: '동더 광장 연동', desc: '점수 자동 수집' },
  { num: '③', label: '홈페이지 표시', desc: '실시간 점수 반영' },
] as const

const SONGS = [
  {
    label: '과제곡 1',
    name: ARCADE_SONGS.online1.title,
    genre: '뒷보면',
    level: 8,
    levelColor: '#b275f0',
  },
  {
    label: '과제곡 2',
    name: ARCADE_SONGS.online2.title,
    genre: '귀신',
    level: 8,
    levelColor: '#b275f0',
  },
] as const

const REQUIRED_INFO = [
  { label: '남코 아이디' },
  { label: '바나패스 번호' },
  { label: '동더 광장 북번호' },
] as const

const APPLY_FIELDS = [
  { label: '이름', value: '실명 기재' },
  { label: '동더 네임', value: '게임 내 동더 네임' },
  { label: '전화번호', value: '본인 연락처' },
  { label: '이메일', value: '본인 이메일 주소' },
  { label: '남코 아이디', value: '필수', isBadge: true },
  { label: '바나패스 번호', value: '필수', isBadge: true },
  { label: '동더 광장 북번호', value: '필수', isBadge: true },
  { label: '개인정보활용 동의', value: '필수', isBadge: true },
  { label: '참가 차수', value: '필수', isBadge: true },
  { label: '오프라인 예선곡 4곡', value: '필수', isBadge: true },
  { label: '부모님 동의서', value: '미성년자 한정 · PDF' },
] as const

const ELIGIBILITY_ROWS = [
  { label: '국적', value: '대한민국 국적 보유' },
  { label: '거주', value: '대한민국 거주자' },
] as const

const MINOR_ROWS = [
  { label: '대상', value: '2008년생 이후' },
  { label: '보호자 동의', value: '필수', isBadge: true },
  { label: '제출 방법', value: '동의서(PDF) 작성 후 업로드' },
  { label: '연령 제한', value: '별도 없음' },
] as const

const PLAYX4_ROWS = [
  { label: '직관 참여 시', value: '확정 명찰 현장 수령' },
  { label: '불참 시', value: '명찰 미지급 (별도 발송 불가)' },
] as const

const NOTICES = [
  '본 룰북은 <strong>아케이드 부문</strong>에 해당하며, 콘솔 부문은 별도 룰북을 참고해 주십시오.',
  '룰북 내용은 운영 상황에 따라 <strong>변경될 수 있으며</strong>, 변경 시 공식 채널을 통해 사전 공지됩니다.',
  '모든 참가자는 본 룰북의 내용을 <strong>숙지하고 동의한 것으로 간주</strong>합니다.',
  '대회 중 분쟁사항에 대한 <strong>최종 판단은 운영 측</strong>에 있습니다.',
  '부정행위 적발 시 <strong>실격 및 향후 대회 참가 제한</strong> 조치가 이루어질 수 있습니다.',
] as const

const CALLOUT_CHAR_ICONS = {
  warning: '/characters/callout-warning.png',
  info: '/characters/callout-info.png',
  notice: '/characters/notice-info.png',
} as const

const NOTICE_ROW_ICONS = [
  '/characters/ika_2_sprite_11.png',
  '/characters/ika_2_sprite_15.png',
  '/characters/ika_2_sprite_03.png',
  '/characters/ika_2_sprite_07.png',
] as const

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
        <Card className='mb-12 overflow-hidden p-0'>
          <div className='flex items-center gap-2.5 border-b border-[#1e1e1e] bg-[#111] px-6 py-4'>
            <span className='size-2 rounded-full bg-[#f5a623]' />
            <span className='text-[15px] font-bold text-white/90'>
              한눈에 보기
            </span>
          </div>
          <div className='grid grid-cols-2 bg-[#111]'>
            {GLANCE_ITEMS.map((item, i) => (
              <div
                key={item.label}
                className={`relative flex min-h-[100px] flex-col items-center justify-center border-[#1e1e1e] px-5 pt-7 pb-4 text-center ${i < 4 ? 'border-b' : ''} ${i % 2 === 0 ? 'border-r' : ''}`}
              >
                <div className='absolute top-2.5 left-3.5 text-[12px] font-medium tracking-wide text-white/35'>
                  {item.label}
                </div>
                <div
                  className='text-[24px] font-extrabold tracking-tight whitespace-pre-line sm:text-[28px] sm:whitespace-normal'
                  style={{ color: item.color ?? 'rgba(255,255,255,0.9)' }}
                >
                  {item.value}
                </div>
                {item.sub && (
                  <div className='mt-0.5 text-[12px] text-white/40'>
                    {item.sub}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
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

      {/* ── Steps ── */}
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

          <div className='rounded-xl border border-[#1e1e1e] bg-white/[0.015] p-4'>
            <HighlightCard
              title='오프라인 예선곡 선택'
              tag='필수'
              tagCls='bg-[#f5a623]/[0.08] text-[#f5a623]'
            >
              신청 시 <strong>스위스 스테이지에서 사용할 곡 4곡</strong>을 미리
              선택해야 합니다. 이 곡은 오프라인 대회에서 사이드 선택 시
              활용되며, 신청 이후에는 변경할 수 없습니다.
            </HighlightCard>
          </div>
        </StepCard>

        {/* ── 연결선 01 → 02 ── */}
        <StepConnector />

        {/* ── Step 02: 동더 광장 연동 & 점수 제출 ── */}
        <StepCard
          num='02'
          heading='동더 광장 연동 & 점수 제출'
          summary={
            <>
              남코 아이디와 동더 광장을 연동하면 과제곡 점수가{' '}
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
              <strong className='text-[#e74c3c]'>옵션 전면 금지</strong> — 진타,
              배속 등 일체의 옵션 사용이 불가합니다.
            </Callout>
          </div>
        </StepCard>

        {/* ── 연결선 02 → 03 ── */}
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

          <AdvanceVisual />

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

      {/* ── CTA — 참가 신청 ── */}
      <FadeIn>
        <div className='mt-6 mb-2'>
          <Link
            to='/arcade/apply'
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
            {/* 신청 시 제출 정보 */}
            <Accordion title='신청 시 제출 정보'>
              <DetailSubtitle>필수 제출 항목</DetailSubtitle>
              {APPLY_FIELDS.map((f) => (
                <DetailRow
                  key={f.label}
                  label={f.label}
                  value={f.value}
                  isBadge={'isBadge' in f ? f.isBadge : undefined}
                />
              ))}
            </Accordion>

            {/* 참가 자격 및 제한 */}
            <Accordion title='참가 자격 및 제한'>
              <DetailSubtitle>자격 요건</DetailSubtitle>
              {ELIGIBILITY_ROWS.map((r) => (
                <DetailRow key={r.label} label={r.label} value={r.value} />
              ))}
              <div className='mt-4'>
                <DetailSubtitle>대리 참가 · 부정행위</DetailSubtitle>
                <Callout
                  type='danger'
                  icon={<CalloutCharIcon type='warning' />}
                >
                  중복 참가 및 대리 참가는{' '}
                  <strong className='text-[#e74c3c]'>엄격히 금지</strong>
                  됩니다. 위반 시 실격 처리되며, 향후 대회 참가에 불이익이 있을
                  수 있습니다.
                </Callout>
              </div>
            </Accordion>

            {/* 미성년자 참가 규정 */}
            <Accordion title='미성년자 참가 규정'>
              {MINOR_ROWS.map((r) => (
                <DetailRow
                  key={r.label}
                  label={r.label}
                  value={r.value}
                  isBadge={'isBadge' in r ? r.isBadge : undefined}
                />
              ))}
              <Callout type='info' icon={<CalloutCharIcon type='info' />}>
                보호자 동의 요건을 충족하면{' '}
                <strong className='text-white/80'>연령 제한 없이</strong> 참가할
                수 있습니다.
              </Callout>
            </Accordion>

            {/* PlayX4 직관 참여 */}
            <Accordion title='PlayX4 직관 참여 · 명찰'>
              {PLAYX4_ROWS.map((r) => (
                <DetailRow key={r.label} label={r.label} value={r.value} />
              ))}
              <Callout type='info' icon={<CalloutCharIcon type='info' />}>
                신청 시 PlayX4 직관 참여 여부를 함께 선택합니다.
              </Callout>
            </Accordion>

            {/* 유의사항 */}
            <Accordion title='유의사항'>
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
            </Accordion>
          </div>
        </FadeIn>
      </div>

      {/* ── 하단 최종 CTA (세부 규정 아래) ── */}
      <FadeIn>
        <div className='mt-12 mb-8 text-center'>
          <Link
            to='/arcade/apply'
            className='inline-flex items-center gap-2 rounded-full border border-[#f5a623]/30 bg-[#f5a623]/[0.08] px-8 py-3.5 text-[15px] font-bold text-[#f5a623] transition-all hover:border-[#f5a623]/50 hover:bg-[#f5a623]/[0.12]'
          >
            대회 참가 신청하기
            <span className='text-[#f5a623]/60'>→</span>
          </Link>
        </div>
      </FadeIn>
    </>
  )
}
