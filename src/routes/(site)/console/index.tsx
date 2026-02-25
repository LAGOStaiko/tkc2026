import { createFileRoute } from '@tanstack/react-router'
import {
  Callout,
  FadeIn,
  Accordion,
  StepCard,
  DetailSubtitle,
  DetailRow,
} from '@/components/tkc/guide-shared'
import { LevelBadge } from '@/components/tkc/level-badge'

export const Route = createFileRoute('/(site)/console/')({
  component: ConsoleQualifierPage,
})

/* ════════════════════════════════════════════════════════════════════ */
/*  Constants                                                          */
/* ════════════════════════════════════════════════════════════════════ */

const FLOW_CARDS = [
  {
    step: 'STEP 01',
    label: '과제곡 플레이',
    value: '2곡 합산\n스코어 어택',
    sub: '과제곡 2곡의 점수 합산으로 순위 결정',
    hasArrow: true,
  },
  {
    step: 'STEP 02',
    label: '결선 진출',
    value: '상위 4명',
    sub: 'PlayX4 결선 직행',
    gold: true,
  },
  {
    step: '제출 방식',
    label: '영상 제출',
    value: '유튜브 영상 제출',
    sub: '지정 앵글 촬영 → 일부공개 업로드',
  },
  {
    step: '입력 방식',
    label: '컨트롤러 선택',
    value: '컨트롤러 · 조이콘',
    sub: '한 번 선택 시 결선까지 변경 불가',
  },
] as const

const SONGS = [
  {
    label: '과제곡 1',
    name: '希望へのメロディー',
    genre: '뒷보면',
    level: 9,
    levelColor: '#f5a623',
  },
  {
    label: '과제곡 2',
    name: 'TAIKO-TONGUE-TWISTER',
    genre: '귀신',
    level: 8,
    levelColor: '#b275f0',
  },
] as const

const CONTROLLER_RULES = [
  { label: '태고 컨트롤러 + 북채', allowed: true },
  { label: '조이콘', allowed: true },
  { label: '터치 조작', allowed: false },
] as const

const VIDEO_CHECKLIST = [
  { bold: '플레이 화면', desc: '곡명 · 점수 · 결과 화면이 식별 가능' },
  { bold: '플레이 장면', desc: '손 · 컨트롤러 조작이 확인 가능' },
  { bold: '촬영 각도', desc: '이전 측 지정 촬영 가이드 준수' },
] as const

const SUBMIT_FLOW = [
  { num: '①', label: '촬영', desc: '지정 앵글 준수' },
  { num: '②', label: '업로드', desc: '유튜브 일부공개' },
  { num: '③', label: '제출', desc: '신청 폼에 링크 첨부' },
] as const

const APPLY_FIELDS = [
  { label: '이름', value: '실명 기재' },
  { label: '동더 네임', value: '게임 내 동더 네임' },
  { label: '전화번호', value: '본인 연락처' },
  { label: '이메일', value: '본인 이메일 주소' },
  { label: '개인정보활용 동의', value: '필수', isBadge: true },
  { label: '영상 링크', value: '유튜브 일부공개 링크' },
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
  '본 룰북의 내용은 대회 상황에 따라 <strong>변경될 수 있으며</strong>, 변경 시 공식 채널을 통해 사전 공지됩니다.',
  '모든 참가자는 본 룰북의 내용을 <strong>숙지하고 동의한 것으로 간주</strong>합니다.',
  '대회 중 발생하는 분쟁사항에 대한 <strong>최종 판단은 운영 측</strong>에 있습니다.',
  '부정행위 적발 시 <strong>실격 및 향후 대회 참가 제한</strong> 조치가 이루어질 수 있습니다.',
] as const

/* ════════════════════════════════════════════════════════════════════ */
/*  Ranking Visual                                                     */
/* ════════════════════════════════════════════════════════════════════ */

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
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

function ConsoleQualifierPage() {
  return (
    <>
      {/* ── At a Glance ── */}
      <FadeIn delay={300}>
        <div className='mb-12'>
          <div className='mb-2 font-mono text-xs font-semibold tracking-[1px] text-[#e74c3c] uppercase'>
            Console Qualifier
          </div>
          <h2 className='mb-6 text-[clamp(22px,4vw,30px)] font-extrabold tracking-tight text-white/90'>
            한눈에 보기
          </h2>

          <div>
            <div className='grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[#2a2a2a] bg-[#2a2a2a] sm:grid-cols-2'>
              {FLOW_CARDS.map((card) => (
                <div
                  key={card.step}
                  className='relative bg-[#141414] px-6 py-7 transition-colors hover:bg-[#1a1a1a]'
                >
                  <div className='mb-1.5 font-mono text-[11px] font-bold tracking-[1.5px] text-[#b83a30] uppercase'>
                    {card.step}
                  </div>
                  {card.label && (
                    <div className='mb-1 text-[12px] text-white/50'>
                      {card.label}
                    </div>
                  )}
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
                    <span className='absolute top-1/2 right-0 z-[2] hidden translate-x-1/2 -translate-y-1/2 text-sm text-[#b83a30] sm:block'>
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className='mt-0.5 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#2a2a2a] sm:grid-cols-2'>
              <div className='flex items-center gap-3.5 bg-[#141414] px-6 py-5 transition-colors hover:bg-[#1a1a1a]'>
                <div className='flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-[#e74c3c]/15 bg-[#e74c3c]/[0.08]'>
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='#e74c3c'
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
                <div className='flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-[#e74c3c]/15 bg-[#e74c3c]/[0.08]'>
                  <svg
                    width='18'
                    height='18'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='#e74c3c'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z' />
                    <circle cx='12' cy='10' r='3' />
                  </svg>
                </div>
                <div>
                  <div className='text-[11px] text-white/50'>결선 장소</div>
                  <div className='text-[15px] font-bold text-white/90'>
                    PlayX4
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      <div className='mb-12 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent' />

      {/* ── Steps Header ── */}
      <FadeIn>
        <div className='mb-2 font-mono text-xs font-semibold tracking-[1px] text-[#e74c3c] uppercase'>
          How to participate
        </div>
        <h2 className='mb-2 text-[clamp(22px,4vw,30px)] font-extrabold tracking-tight text-white/90'>
          참가 방법
        </h2>
        <p className='mb-8 text-sm font-light text-white/55'>
          과제곡을 플레이하고, 영상을 제출하세요.
        </p>
      </FadeIn>

      {/* ── Step 01: 과제곡 플레이 ── */}
      <div className='space-y-4'>
        <StepCard
          num='01'
          heading='과제곡 플레이'
          accentColor='#e74c3c'
          summary={
            <>
              과제곡 <strong className='text-white/90'>2곡</strong>을
              플레이하세요. 진타·배속 등{' '}
              <strong className='text-white/90'>옵션은 전면 금지</strong>입니다.
            </>
          }
          toggleLabel='과제곡 · 컨트롤러 상세 보기'
        >
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
                      background: i === 0 ? '#e74c3c' : '#f5a623',
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
          </div>

          <div>
            <DetailSubtitle>컨트롤러 규정</DetailSubtitle>
            {CONTROLLER_RULES.map((rule) => (
              <div
                key={rule.label}
                className='flex items-center justify-between border-b border-[#1e1e1e] py-2.5 text-[13px] last:border-b-0'
              >
                <span className='text-white/55'>{rule.label}</span>
                <span
                  className={`rounded px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide ${
                    rule.allowed
                      ? 'bg-[#f7d154]/[0.08] text-[#f7d154]'
                      : 'bg-[#e74c3c]/[0.08] text-[#e74c3c]'
                  }`}
                >
                  {rule.allowed ? '허용' : '불가'}
                </span>
              </div>
            ))}
            <Callout type='warning' icon={<CalloutCharIcon type='warning' />}>
              입력 방식은 한 번 선택하면{' '}
              <strong className='text-white/80'>결선까지 변경 불가</strong>
              입니다.
            </Callout>
            <Callout type='info' icon={<CalloutCharIcon type='info' />}>
              결선에서는{' '}
              <strong className='text-white/80'>
                BNEK가 준비한 본체 및 컨트롤러
              </strong>
              만 사용합니다.
            </Callout>
          </div>
        </StepCard>

        {/* ── Step 02: 영상 촬영 & 제출 ── */}
        <StepCard
          num='02'
          heading='영상 촬영 & 제출'
          accentColor='#e74c3c'
          summary={
            <>
              직접 앵글로 촬영하여{' '}
              <strong className='text-white/90'>유튜브 일부공개</strong>로
              업로드 후 링크를 제출합니다. 플레이 화면과 조작이 모두 보여야
              합니다.
            </>
          }
          toggleLabel='제출 절차 · 필수 요소 상세 보기'
        >
          <div>
            <DetailSubtitle>제출 절차</DetailSubtitle>
            <div className='flex gap-0'>
              {SUBMIT_FLOW.map((step, i) => (
                <div
                  key={step.num}
                  className={`flex-1 border border-[#1e1e1e] bg-white/[0.015] px-2.5 py-3.5 text-center ${
                    i === 0 ? 'rounded-l-xl' : i === 2 ? 'rounded-r-xl' : ''
                  } ${i > 0 ? '-ml-px' : ''}`}
                >
                  <div className='mb-1 text-base font-extrabold text-[#e74c3c]'>
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
            <DetailSubtitle>영상 필수 포함 요소</DetailSubtitle>
            <div className='space-y-1.5'>
              {VIDEO_CHECKLIST.map((item) => (
                <div
                  key={item.bold}
                  className='flex items-center gap-2.5 rounded-xl border border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2.5 text-[13px]'
                >
                  <span className='flex size-4 shrink-0 items-center justify-center rounded border-2 border-[#f7d154]'>
                    <span className='size-1.5 rounded-sm bg-[#f7d154]' />
                  </span>
                  <span className='text-white/55'>
                    <strong className='text-white/90'>{item.bold}</strong> —{' '}
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>
            <Callout type='danger' icon={<CalloutCharIcon type='warning' />}>
              규정 미준수 영상은{' '}
              <strong className='text-[#e74c3c]'>심사 대상에서 제외</strong>될
              수 있습니다.
            </Callout>
          </div>
        </StepCard>
      </div>

      {/* ── Detailed Rules ── */}
      <div className='mt-16'>
        <div className='mb-12 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent' />
        <FadeIn>
          <div className='mb-2 font-mono text-xs font-semibold tracking-[1px] text-[#e74c3c] uppercase'>
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
            {/* 신청 및 제출 정보 */}
            <Accordion title='신청 및 제출 정보'>
              <DetailSubtitle>필수 제출 항목</DetailSubtitle>
              {APPLY_FIELDS.map((f) => (
                <DetailRow
                  key={f.label}
                  label={f.label}
                  value={f.value}
                  isBadge={'isBadge' in f ? f.isBadge : undefined}
                  accentColor='#e74c3c'
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
                <DetailSubtitle>중복 참가 규정</DetailSubtitle>
                <DetailRow
                  label='아케이드·콘솔 예선 참가'
                  value='가능'
                  isBadge={false}
                  accentColor='#e74c3c'
                />
                <DetailRow
                  label='아케이드·콘솔 동시 결선 진출'
                  value='불가'
                  isBadge={false}
                  accentColor='#e74c3c'
                />
                <Callout
                  type='warning'
                  icon={<CalloutCharIcon type='warning' />}
                >
                  예선 중복 참가 가능하지만,{' '}
                  <strong className='text-white/80'>결선 진출은 택 1</strong>{' '}
                  구조입니다.
                </Callout>
              </div>

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
                  accentColor='#e74c3c'
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
    </>
  )
}
