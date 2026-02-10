import { useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  Callout,
  FadeIn,
  TkcIcon,
  Card,
  Accordion,
  StepCard,
  DetailSubtitle,
  DetailRow,
} from '@/components/tkc/guide-shared'

export const Route = createFileRoute('/(site)/console/')({
  component: ConsoleQualifierPage,
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
  { label: '방식', value: '스코어 어택', sub: '2곡 합산' },
  { label: '결선 진출', value: '상위 4명', color: '#f7d154' },
  { label: '신청 기간', value: '3.2 ~ 4.30' },
  { label: '제출 방법', value: '유튜브 영상', color: '#f5a623' },
]

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

const RANKING_SCORES = [97, 91, 85, 80, 74, 68]

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
  { label: '현장 참여 시', value: '확정 명찰 현장 수령' },
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

function RankingVisual() {
  const ref = useRef<HTMLDivElement>(null)
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimated(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className='space-y-1'>
      {RANKING_SCORES.map((score, i) => {
        const qualify = i < 4
        return (
          <div
            key={i}
            className={`flex items-center gap-2.5 rounded-xl border p-2.5 px-3.5 ${
              qualify
                ? 'border-[#f7d154]/20 bg-[#f7d154]/[0.02]'
                : 'border-[#1e1e1e] opacity-45'
            }`}
          >
            <div
              className={`w-[26px] text-center text-base font-extrabold ${qualify ? 'text-[#f7d154]' : 'text-white/35'}`}
            >
              {i + 1}
            </div>
            <div className='h-1.5 flex-1 overflow-hidden rounded-full bg-[#1e1e1e]'>
              <div
                className={`h-full rounded-full transition-all duration-800 ease-out ${qualify ? 'bg-gradient-to-r from-[#f7d154] to-[#f7d154]' : 'bg-white/25'}`}
                style={{
                  width: animated ? `${score}%` : '0%',
                  transitionDelay: `${i * 80}ms`,
                }}
              />
            </div>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wide ${
                qualify
                  ? 'bg-[#f7d154]/[0.08] text-[#f7d154]'
                  : 'bg-white/[0.02] text-white/35'
              }`}
            >
              {qualify ? '진출' : '예비'}
            </span>
          </div>
        )
      })}
    </div>
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
        <Card className='mb-12 overflow-hidden p-0'>
          <div className='flex items-center gap-2.5 border-b border-[#1e1e1e] bg-[#111] px-6 py-4'>
            <span className='size-2 rounded-full bg-[#e86e3a]' />
            <span className='text-[15px] font-bold text-white/90'>
              한눈에 보기
            </span>
          </div>
          <div className='grid grid-cols-2 bg-[#111]'>
            {GLANCE_ITEMS.map((item, i) => (
              <div
                key={item.label}
                className={`flex min-h-[96px] flex-col justify-center border-[#1e1e1e] px-6 py-5 ${i < 2 ? 'border-b' : ''} ${i % 2 === 0 ? 'border-r' : ''}`}
              >
                <div className='mb-1 text-[11px] font-medium tracking-wide text-white/35'>
                  {item.label}
                </div>
                <div
                  className='text-[17px] font-bold'
                  style={{ color: item.color ?? 'rgba(255,255,255,0.9)' }}
                >
                  {item.value}
                  {item.sub && (
                    <span className='ml-1 text-xs font-normal text-white/55'>
                      {item.sub}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </FadeIn>

      {/* ── Steps Header ── */}
      <FadeIn>
        <div className='mb-2 font-mono text-xs font-semibold tracking-[1px] text-[#e86e3a] uppercase'>
          How to participate
        </div>
        <h2 className='mb-2 text-[clamp(22px,4vw,30px)] font-extrabold tracking-tight text-white/90'>
          참가 3단계
        </h2>
        <p className='mb-8 text-sm font-light text-white/55'>
          아래 세 단계를 따라가면 됩니다.
        </p>
      </FadeIn>

      {/* ── Step 01: 과제곡 플레이 ── */}
      <div className='space-y-4'>
        <StepCard
          num='01'
          heading='과제곡 플레이'
          accentColor='#e86e3a'
          summary={
            <>
              <strong className='text-white/90'>希望へのメロディー</strong>{' '}
              <span className='rounded bg-[#f7d154]/[0.08] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#f7d154]'>
                뒷보면 ★9
              </span>{' '}
              와 <strong className='text-white/90'>TAIKO-TONGUE-TWISTER</strong>{' '}
              <span className='rounded bg-[#b275f0]/[0.08] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#b275f0]'>
                귀신 ★8
              </span>{' '}
              두 곡을 플레이하세요.
              <br />
              <span className='rounded bg-[#e86e3a]/[0.08] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#e86e3a]'>
                옵션 전면 금지
              </span>{' '}
              진타·배속 등 일체 사용 불가합니다.
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
                      background: i === 0 ? '#e86e3a' : '#f5a623',
                    }}
                  />
                  <div className='mb-1.5 font-mono text-[10px] font-semibold tracking-wide text-white/35 uppercase'>
                    {song.label}
                  </div>
                  <div className='mb-1 text-[15px] font-extrabold tracking-tight text-white/90'>
                    {song.name}
                  </div>
                  <div className='flex items-center gap-2 text-xs text-white/55'>
                    <span>{song.genre}</span>
                    <span
                      className='rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-white'
                      style={{ background: song.levelColor }}
                    >
                      ★{song.level}
                    </span>
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
                  className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold tracking-wide ${
                    rule.allowed
                      ? 'bg-[#f7d154]/[0.08] text-[#f7d154]'
                      : 'bg-[#e86e3a]/[0.08] text-[#e86e3a]'
                  }`}
                >
                  {rule.allowed ? '허용' : '불가'}
                </span>
              </div>
            ))}
            <Callout type='warning' icon={<TkcIcon name='warning' />}>
              입력 방식은 한 번 선택하면{' '}
              <strong className='text-white/80'>결선까지 변경 불가</strong>
              입니다.
            </Callout>
            <Callout type='info' icon={<TkcIcon name='info' />}>
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
          accentColor='#e86e3a'
          summary={
            <>
              직접 앵글로 촬영 →{' '}
              <strong className='text-white/90'>유튜브 일부공개</strong>로
              업로드 → 신청 폼에 링크 제출.
              <br />
              <strong className='text-white/90'>플레이 화면</strong>
              (곡명·점수·결과)과{' '}
              <strong className='text-white/90'>손/컨트롤러 조작</strong>이
              반드시 보여야 합니다.
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
                  <div className='mb-1 text-base font-extrabold text-[#e86e3a]'>
                    {step.num}
                  </div>
                  <div className='text-xs font-semibold text-white/90'>
                    {step.label}
                  </div>
                  <div className='mt-0.5 text-[10px] text-white/35'>
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
            <Callout type='danger' icon={<TkcIcon name='warning' />}>
              규정 미준수 영상은{' '}
              <strong className='text-[#e86e3a]'>심사 대상에서 제외</strong>될
              수 있습니다.
            </Callout>
          </div>
        </StepCard>

        {/* ── Step 03: 결선 진출 확인 ── */}
        <StepCard
          num='03'
          heading='결선 진출 확인'
          accentColor='#e86e3a'
          summary={
            <>
              2곡 합산 통산 점수{' '}
              <span className='rounded bg-[#f7d154]/[0.08] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#f7d154]'>
                상위 4명
              </span>
              이 PlayX4 결선 토너먼트에 진출합니다. 예비 번호가 부여되며, 기권
              시 순차 대체됩니다.
            </>
          }
          toggleLabel='점수 산정 · 순위 상세 보기'
        >
          <div>
            <DetailSubtitle>점수 산정 방식</DetailSubtitle>
            <div className='flex flex-wrap items-center justify-center gap-3 py-2'>
              <div className='rounded-xl border border-[#1e1e1e] bg-white/[0.02] px-5 py-2.5 text-center'>
                <div className='text-[11px] text-white/35'>과제곡 1</div>
                <div className='text-sm font-bold text-white/90'>점수 A</div>
              </div>
              <div className='text-xl font-extrabold text-[#e86e3a]'>+</div>
              <div className='rounded-xl border border-[#1e1e1e] bg-white/[0.02] px-5 py-2.5 text-center'>
                <div className='text-[11px] text-white/35'>과제곡 2</div>
                <div className='text-sm font-bold text-white/90'>점수 B</div>
              </div>
              <div className='text-xl font-extrabold text-[#e86e3a]'>=</div>
              <div className='rounded-xl border border-[#f7d154]/25 bg-[#f7d154]/[0.03] px-5 py-2.5 text-center'>
                <div className='text-[11px] text-white/35'>통산 점수</div>
                <div className='text-sm font-bold text-[#f7d154]'>A + B</div>
              </div>
            </div>
          </div>

          <div>
            <DetailSubtitle>순위 예시</DetailSubtitle>
            <RankingVisual />
            <Callout type='warning' icon={<TkcIcon name='warning' />}>
              아케이드·콘솔 예선 중복 참가도 가능하지만,{' '}
              <strong className='text-white/80'>결선 동시 진출은 불가</strong>
              합니다. (택 1)
            </Callout>
          </div>
        </StepCard>
      </div>

      {/* ── Detailed Rules ── */}
      <div className='mt-16'>
        <div className='mb-12 h-px bg-gradient-to-r from-transparent via-[#333] to-transparent' />
        <FadeIn>
          <div className='mb-2 font-mono text-xs font-semibold tracking-[1px] text-[#e86e3a] uppercase'>
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
                  accentColor='#e86e3a'
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
                  accentColor='#e86e3a'
                />
                <DetailRow
                  label='아케이드·콘솔 동시 결선 진출'
                  value='불가'
                  isBadge={false}
                  accentColor='#e86e3a'
                />
                <Callout type='warning' icon={<TkcIcon name='warning' />}>
                  예선 중복 참가 가능하지만,{' '}
                  <strong className='text-white/80'>결선 진출은 택 1</strong>{' '}
                  구조입니다.
                </Callout>
              </div>

              <div className='mt-4'>
                <DetailSubtitle>대리 참가 · 부정행위</DetailSubtitle>
                <Callout type='danger' icon={<TkcIcon name='warning' />}>
                  중복 참가 및 대리 참가는{' '}
                  <strong className='text-[#e86e3a]'>엄격히 금지</strong>
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
                  accentColor='#e86e3a'
                />
              ))}
              <Callout type='info' icon={<TkcIcon name='info' />}>
                보호자 동의 요건을 충족하면{' '}
                <strong className='text-white/80'>연령 제한 없이</strong> 참가할
                수 있습니다.
              </Callout>
            </Accordion>

            {/* PlayX4 현장 참여 */}
            <Accordion title='PlayX4 직관 참여 · 명찰'>
              {PLAYX4_ROWS.map((r) => (
                <DetailRow key={r.label} label={r.label} value={r.value} />
              ))}
              <Callout type='info' icon={<TkcIcon name='info' />}>
                신청 시 PlayX4 현장 참여 여부를 함께 선택합니다.
              </Callout>
            </Accordion>

            {/* 유의사항 */}
            <Accordion title='유의사항'>
              <div className='space-y-1.5'>
                {NOTICES.map((html, i) => (
                  <div
                    key={i}
                    className='flex items-start gap-2.5 rounded-xl border border-[#1e1e1e] bg-white/[0.015] px-3.5 py-2.5 text-[13px]'
                  >
                    <span className='mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border-2 border-white/25'>
                      <span className='hidden' />
                    </span>
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
