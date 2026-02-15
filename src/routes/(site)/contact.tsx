import { useEffect, useState, type ReactNode } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useSite } from '@/lib/api'
import { sanitizeUrl } from '@/lib/sanitize-url'
import { GlassCard } from '@/components/tkc/glass-card'
import { PageHero, TkcSection } from '@/components/tkc/layout'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/(site)/contact')({
  component: ContactPage,
})

type SiteData = {
  contactEmail?: string
  kakaoChannelUrl?: string
}

/* ════════════════════════════════════════════════════════════════════ */
/*  FAQ Data                                                          */
/* ════════════════════════════════════════════════════════════════════ */

type FaqItemData = {
  question: string
  answer: ReactNode
}

type FaqSectionData = {
  title: string
  tag?: 'console' | 'arcade'
  items: FaqItemData[]
}

const FAQ_SECTIONS: FaqSectionData[] = [
  {
    title: '참가 신청 관련',
    items: [
      {
        question: '누가 참가할 수 있나요?',
        answer:
          '대한민국 국적을 보유하고, 대한민국에 거주하는 분이면 누구나 참가 가능합니다. 연령 제한은 별도로 없으나, 미성년자는 보호자 동의가 필요합니다.',
      },
      {
        question: '신청 기간은 언제인가요?',
        answer:
          '2026년 3월 2일(월) ~ 4월 30일(목)입니다. TKC 2026 공식 홈페이지를 통해 온라인으로 신청합니다.',
      },
      {
        question: '신청 시 어떤 정보를 제출해야 하나요?',
        answer: (
          <>
            부문에 따라 약간 다릅니다.
            <FaqList
              items={[
                '공통 : 이름, 닉네임, 전화번호, 이메일, 개인정보활용 동의, 영상 링크',
                '아케이드 부문 추가 : 반코 아이디(Bandai Namco 계정 ID)',
                '미성년자 : 부모님 동의서(PDF) 추가 제출',
              ]}
            />
          </>
        ),
      },
      {
        question: '미성년자도 참가할 수 있나요?',
        answer:
          '네, 참가 가능합니다. 단, 보호자 동의서(PDF)를 작성하여 신청 시 함께 업로드해야 합니다. 연령 제한은 별도로 없습니다.',
      },
      {
        question: 'PlayX4 직관 참여란 무엇인가요?',
        answer:
          '신청 시 PlayX4 직관 참여 여부를 선택할 수 있습니다. 직관 참여자에게는 행사 명찰이 배부되며, 불참 시 명찰은 미지급됩니다.',
      },
    ],
  },
  {
    title: '부문 및 중복 참가',
    items: [
      {
        question: '콘솔과 아케이드 모두 참가할 수 있나요?',
        answer: (
          <>
            예선은 양쪽 모두 참가 가능합니다. 다만,{' '}
            <strong className='text-white/90'>
              결선은 한쪽만 진출할 수 있습니다
            </strong>
            (택1 구조).
          </>
        ),
      },
      {
        question: '아케이드 부문은 예선 차수를 여러 개 신청할 수 있나요?',
        answer: (
          <>
            아니요. 아케이드 예선은{' '}
            <strong className='text-white/90'>1개의 차수만 참가 가능</strong>
            하며, 온라인 예선에서 탈락하더라도 다른 차수에 도전할 수 없습니다.
            차수 선택은 신중하게 결정해 주세요.
          </>
        ),
      },
      {
        question: '대리 참가나 중복 참가가 발각되면 어떻게 되나요?',
        answer:
          '즉시 실격 처리되며, 운영 측이 인정하는 향후 대회 참가에도 불이익이 있을 수 있습니다.',
      },
    ],
  },
  {
    title: '영상 제출',
    items: [
      {
        question: '영상은 어떻게 제출하나요?',
        answer: (
          <>
            유튜브에 업로드 →{' '}
            <strong className='text-white/90'>일부공개</strong> 설정 → 링크를
            신청서에 첨부하면 됩니다.
          </>
        ),
      },
      {
        question: '영상에 반드시 포함되어야 하는 것은?',
        answer: (
          <>
            다음 두 가지가 반드시 포함되어야 합니다.
            <FaqList
              items={[
                '플레이 화면 : 곡명 / 점수 / 결과 화면이 식별 가능해야 함',
                '플레이 장면 : 손 / 컨트롤러 조작이 확인 가능해야 함',
              ]}
            />
            <FaqNote>
              운영 측 지정 촬영 가이드(약관)를 반드시 준수해야 하며, 규제 미준수
              시 심사 대상에서 제외될 수 있습니다.
            </FaqNote>
          </>
        ),
      },
    ],
  },
  {
    title: '콘솔 부문 예선',
    tag: 'console',
    items: [
      {
        question: '콘솔 예선 과제곡은 무엇인가요?',
        answer: (
          <>
            과제곡 2곡의 점수를 합산하여 순위를 산정합니다.
            <FaqList
              items={[
                '希望への旋律 뒷보면 9레벨',
                'TAIKO-TONGUE-TWISTER 귀신 8레벨',
              ]}
            />
          </>
        ),
      },
      {
        question: '콘솔 예선에서 몇 명이 결선에 진출하나요?',
        answer: (
          <>
            <strong className='text-white/90'>상위 4명</strong>이 결선에
            진출합니다.
          </>
        ),
      },
      {
        question: '콘솔 부문에서 사용 가능한 컨트롤러는?',
        answer: (
          <>
            다음 중 선택할 수 있으며, 한 번 선택하면 대회 종료까지 변경할 수
            없습니다.
            <FaqList
              items={[
                '타코 컨트롤러 + 북채 (허용)',
                '조이콘 (허용)',
                '터치 조작 (불가)',
              ]}
            />
            <FaqNote>
              결선에서는 BNEK가 준비한 본체 및 컨트롤러만 사용합니다.
            </FaqNote>
          </>
        ),
      },
    ],
  },
  {
    title: '콘솔 부문 결선',
    tag: 'console',
    items: [
      {
        question: '콘솔 결선은 어떻게 진행되나요?',
        answer: (
          <>
            상위 4명이 싱글 엘리미네이션 토너먼트로 경쟁합니다.
            <FaqList
              items={[
                '4강: 1위 vs 4위 / 2위 vs 3위',
                '3·4위전: 4강 패자 2인',
                '결승: 4강 승자 2인',
              ]}
            />
          </>
        ),
      },
      {
        question: '콘솔 결선에서 곡은 어떻게 준비하나요?',
        answer: (
          <>
            1인당 <strong className='text-white/90'>4곡</strong>을 사전에
            제출합니다. 한 번 사용한 곡은 결선 전체에서 재사용할 수 없으며, 각
            매치마다 상대 곡 1개를 밴할 수 있습니다.
          </>
        ),
      },
      {
        question: '콘솔 결선 경기 구성은?',
        answer: (
          <>
            라운드별로 다릅니다.
            <FaqList
              items={[
                '4강 / 3·4위전 : 각자 1곡 + 과제곡 1곡 = 총 3곡 점수 합산',
                '결승 : 각자 2곡 + 과제곡 1곡 = 총 5곡 점수 합산',
              ]}
            />
            <FaqNote>과제곡은 추후 공지 예정입니다.</FaqNote>
          </>
        ),
      },
    ],
  },
  {
    title: '아케이드 부문 예선',
    tag: 'arcade',
    items: [
      {
        question: '아케이드 예선은 어떤 구조인가요?',
        answer: (
          <>
            <strong className='text-white/90'>온라인 예선</strong>(스코어 어택) →{' '}
            <strong className='text-white/90'>오프라인 예선</strong>(스위스
            스테이지) → <strong className='text-white/90'>결선</strong>(Top 8)
            순서로 진행됩니다.
          </>
        ),
      },
      {
        question: '아케이드 예선 차수는 어떻게 나뉘나요?',
        answer: (
          <>
            4개 차수로 나뉘며, 각 차수는 지역과 연결됩니다.
            <FaqList
              items={[
                '1차수: 서울 / 2차수: 대전 / 3차수: 광주 / 4차수: 부산',
              ]}
            />
            <FaqNote>
              차수별 별도 집계되며, 신청 시 지역을 선택해야 합니다. 지역 구성은
              변경될 수 있습니다.
            </FaqNote>
          </>
        ),
      },
      {
        question: '아케이드 온라인 예선 과제곡은?',
        answer: (
          <>
            과제곡 2곡의 점수를 합산하여 순위를 산정합니다.
            <FaqList
              items={[
                'もものけ姫 앞보면 8레벨',
                '輝く未来を 귀신 8레벨',
              ]}
            />
            <FaqNote>
              각 차수별 상위 16명이 오프라인 예선에 진출합니다.
            </FaqNote>
          </>
        ),
      },
      {
        question: '오프라인 예선(스위스 스테이지)은 어떻게 진행되나요?',
        answer: (
          <>
            스위스 시스템으로 진행됩니다. 같은 전적 끼리 매칭하며,{' '}
            <strong className='text-white/90'>2패 누적 시 탈락</strong>합니다.
            최대 4라운드까지 진행되며, 4-0 기록자는 자동 결선 진출, 3-1 기록자 중
            추가 선발을 통해 1명이 추가 진출합니다.
          </>
        ),
      },
      {
        question: '신청 시 오프라인 예선 사용곡도 미리 선택해야 하나요?',
        answer: (
          <>
            네, 신청 단계에서 오프라인 예선(스위스 스테이지)에서 사용할{' '}
            <strong className='text-white/90'>곡 4곡</strong>을 미리 선택해야
            합니다.
          </>
        ),
      },
    ],
  },
  {
    title: '아케이드 부문 결선',
    tag: 'arcade',
    items: [
      {
        question: '아케이드 결선은 어떻게 구성되나요?',
        answer: (
          <>
            4개 오프라인 예선에서 각 2명씩,{' '}
            <strong className='text-white/90'>총 8명</strong>이 참가하는
            토너먼트입니다. A그룹(4-0 진출자)과 B그룹(3-1 진출자)을 크로스
            시드로 배치합니다.
            <FaqList
              items={[
                'A1 vs B4 / A2 vs B3 / A3 vs B2 / A4 vs B1',
              ]}
            />
          </>
        ),
      },
      {
        question: '아케이드 결선에서 곡은 어떻게 준비하나요?',
        answer: (
          <>
            1인당 <strong className='text-white/90'>5곡</strong>을 사전에
            제출합니다. 한 번 사용한 곡은 이후 라운드에서 재사용할 수 없으나,{' '}
            <strong className='text-white/90'>
              밴빙한 곡은 소모되지 않아
            </strong>{' '}
            다음 라운드에서 재사용 가능합니다.
          </>
        ),
      },
      {
        question: '아케이드 결선 경기 구성은?',
        answer: (
          <>
            라운드별로 다릅니다.
            <FaqList
              items={[
                '8강 / 4강 / 3·4위전 : 각자 1곡 + 과제곡 1곡 = 총 3곡 점수 합산',
                '결승 : 각자 2곡 + 과제곡 1곡 = 총 5곡 점수 합산',
              ]}
            />
          </>
        ),
      },
    ],
  },
  {
    title: '공통 경기 규칙',
    items: [
      {
        question: '옵션(진폭, 배속 등)을 사용할 수 있나요?',
        answer: (
          <>
            예선에서는 공정성 확보를 위해{' '}
            <strong className='text-white/90'>
              모든 옵션 사용이 금지
            </strong>
            됩니다(진폭, 배속 등 일체 불가). 아케이드 결선에서는 배속 조절 외
            다른 옵션(랜덤, 미러 등)을 사용할 수 있습니다.
          </>
        ),
      },
      {
        question: '동점이 발생하면 어떻게 되나요?',
        answer:
          '결선에서 합산 점수가 동점일 경우, 마지막 곡을 동일 조건으로 재대결합니다. 재대결에서도 동점이면 해당 곡의 양(良) 개수가 많은 선수가 승리합니다. 예선 동점 순위는 먼저 엔트리한 참가자가 우선권을 가집니다.',
      },
      {
        question: '기기 오류가 발생하면 어떻게 되나요?',
        answer:
          '프레임 드롭, 입력 불량 등 기기 오류가 발생한 경우 해당 곡을 재경기합니다. 재경기 여부는 대회 운영진이 판단하며, 선수 과실에 의한 미스는 재경기 사유가 아닙니다.',
      },
      {
        question: '서브 번호란 무엇인가요?',
        answer:
          '모든 참가자에게 서브 번호가 부여됩니다. 진출자가 기권하거나 불참할 경우, 서브 넘버 기준으로 대체 진행됩니다.',
      },
    ],
  },
  {
    title: '기타',
    items: [
      {
        question: '룰북 내용이 변경될 수도 있나요?',
        answer:
          '네, 대회 운영 상황에 따라 변경될 수 있으며, 변경 시 공식 채널을 통해 사전 공지됩니다.',
      },
      {
        question: '대회 중 분쟁이 발생하면 어떻게 하나요?',
        answer:
          '대회 중 발생하는 모든 분쟁 사항에 대한 최종 판단은 운영 측에 있습니다.',
      },
    ],
  },
]

const COMPARE_ROWS: { label: string; console: string; arcade: string }[] = [
  {
    label: '예선 방식',
    console: '스코어 어택 → 결선',
    arcade: '스코어 어택 → 스위스 → 결선',
  },
  {
    label: '예선 진출 인원',
    console: '상위 4명',
    arcade: '차수별 16명 → 2명',
  },
  {
    label: '결선 참가 인원',
    console: '4명',
    arcade: '8명 (4차수 × 2명)',
  },
  { label: '결선 사전 제출곡', console: '4곡', arcade: '5곡' },
  {
    label: '밴빙한 곡 재사용',
    console: '× (별도 명시 없음)',
    arcade: '가능 (소모 안 됨)',
  },
  {
    label: '결선 구조',
    console: '4강 → 3·4위전 / 결승',
    arcade: '8강 → 4강 → 3·4위전 / 결승',
  },
  {
    label: '컨트롤러',
    console: '타코컨/조이콘 (터치 불가)',
    arcade: '아케이드 기기 사용',
  },
]

/* ════════════════════════════════════════════════════════════════════ */
/*  Helper Components                                                  */
/* ════════════════════════════════════════════════════════════════════ */

function FaqList({ items }: { items: string[] }) {
  return (
    <ul className='mt-2 space-y-1'>
      {items.map((item, i) => (
        <li
          key={i}
          className='flex items-center gap-2 text-[12px] text-white/55 sm:text-[13px]'
        >
          <span className='shrink-0 font-bold text-[#f5a623]'>›</span>
          <span className='break-keep'>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function FaqNote({ children }: { children: ReactNode }) {
  return (
    <div className='mt-2.5 flex items-center gap-2 rounded-xl border border-[#f5a623]/[0.12] bg-[#f5a623]/[0.04] p-2.5 text-[11px] leading-[1.55] text-white/50 sm:text-[12px]'>
      <span className='shrink-0'>※</span>
      <span className='break-keep'>{children}</span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  FAQ Item                                                           */
/* ════════════════════════════════════════════════════════════════════ */

function FaqItem({
  num,
  question,
  answer,
  isOpen,
  onToggle,
}: {
  num: number
  question: string
  answer: ReactNode
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        'tkc-motion-surface rounded-2xl border border-[#1e1e1e] bg-[#111]',
        isOpen ? 'border-[#2a2a2a]' : 'hover:border-[#2a2a2a]'
      )}
    >
      <button
        type='button'
        className='flex w-full items-center gap-3 px-4 py-3.5 text-left sm:px-6 sm:py-4'
        onClick={onToggle}
      >
        <span className='shrink-0 rounded px-2 py-0.5 font-mono text-[11px] font-bold tracking-wide text-[#f5a623] bg-[#f5a623]/[0.08]'>
          Q{num}
        </span>
        <span className='flex-1 text-[13px] font-bold break-keep text-white/90 sm:text-sm'>
          {question}
        </span>
        <span
          className={cn(
            'text-[11px] text-white/35 transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
        >
          ▾
        </span>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-400 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className='overflow-hidden'>
          <div className='border-t border-[#1e1e1e] px-4 py-4 pl-[3.2rem] text-[13px] leading-[1.55] text-white/55 break-keep sm:px-6 sm:py-5 sm:pl-[4.2rem]'>
            {answer}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════ */
/*  Page                                                               */
/* ════════════════════════════════════════════════════════════════════ */

function ContactPage() {
  const { data: siteData, isError: isSiteError } = useSite<SiteData>()
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  const contactEmail = siteData?.contactEmail ?? ''
  const kakaoChannelUrl = sanitizeUrl(siteData?.kakaoChannelUrl)
  const emailHref = contactEmail
    ? sanitizeUrl(`mailto:${contactEmail}`)
    : ''

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('contact.title')}`
  }, [])

  let globalNum = 0

  return (
    <TkcSection>
      <PageHero
        badge='CONTACT'
        title='문의하기'
        subtitle={t('contact.subtitle')}
        accentColor='#f5a623'
        gradientTo='#f7d154'
      />

      {isSiteError && (
        <p className='text-sm text-destructive'>{t('contact.failedInfo')}</p>
      )}

      {/* Contact Cards */}
      <div className='grid gap-4 md:grid-cols-2'>
        {/* Email Card */}
        <GlassCard className='group relative overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-1 md:p-7'>
          <div className='pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-sky-500/5' />
          <div className='relative flex h-full flex-col'>
            <div className='mb-5 flex items-center gap-3.5'>
              <div className='flex size-12 items-center justify-center rounded-xl border border-sky-400/15 bg-sky-400/8 shadow-[0_0_20px_rgba(74,158,255,0.06)]'>
                <svg
                  className='size-5 text-sky-400'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='1.8'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <rect x='2' y='4' width='20' height='16' rx='3' />
                  <polyline points='2 4 12 13 22 4' />
                </svg>
              </div>
              <div>
                <p className='text-[11px] font-semibold tracking-wide text-white/40 uppercase'>
                  Email
                </p>
                <p className='text-lg font-bold text-sky-400'>
                  {t('contact.labelEmail')}
                </p>
              </div>
            </div>

            <div className='mb-5 flex flex-1 items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5'>
              <span className='text-sm text-white/60 break-all font-mono'>
                {contactEmail || t('contact.noInfo')}
              </span>
            </div>

            {emailHref && emailHref !== '#' ? (
              <a
                href={emailHref}
                className='flex items-center justify-center gap-2 rounded-xl border border-sky-400/20 bg-sky-400/8 px-5 py-3 text-sm font-semibold text-sky-400 transition-all hover:-translate-y-0.5 hover:border-sky-400/35 hover:bg-sky-400/14 hover:shadow-[0_4px_20px_rgba(74,158,255,0.1)]'
              >
                <svg
                  className='size-4'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <path d='M22 2L11 13' />
                  <path d='M22 2L15 22L11 13L2 9L22 2Z' />
                </svg>
                {t('contact.sendEmail')}
              </a>
            ) : (
              <span className='flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white/30'>
                {t('contact.sendEmail')}
              </span>
            )}
          </div>
        </GlassCard>

        {/* Kakao Card */}
        <GlassCard className='group relative overflow-hidden p-5 transition-transform duration-300 hover:-translate-y-1 md:p-7'>
          <div className='pointer-events-none absolute -top-8 -right-8 size-32 rounded-full bg-yellow-400/5' />
          <div className='relative flex h-full flex-col'>
            <div className='mb-5 flex items-center gap-3.5'>
              <div className='flex size-12 items-center justify-center rounded-xl border border-yellow-400/15 bg-yellow-400/8 shadow-[0_0_20px_rgba(247,209,84,0.06)]'>
                <svg
                  className='size-5 text-yellow-400'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.53-.95 3.4-.98 3.62 0 0-.02.17.09.24.11.06.24.01.24.01.32-.05 3.7-2.44 4.28-2.86.55.08 1.12.12 1.71.12 5.52 0 10-3.58 10-7.8C22 6.58 17.52 3 12 3z' />
                </svg>
              </div>
              <div>
                <p className='text-[11px] font-semibold tracking-wide text-white/40 uppercase'>
                  Kakao Channel
                </p>
                <p className='text-lg font-bold text-yellow-400'>
                  {t('contact.labelKakao')}
                </p>
              </div>
            </div>

            <div className='mb-5 flex flex-1 items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5'>
              <span className='text-sm text-white/60 break-all font-mono'>
                {kakaoChannelUrl || t('contact.noInfo')}
              </span>
            </div>

            {kakaoChannelUrl && kakaoChannelUrl !== '#' ? (
              <a
                href={kakaoChannelUrl}
                target='_blank'
                rel='noreferrer'
                className='flex items-center justify-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/8 px-5 py-3 text-sm font-semibold text-yellow-400 transition-all hover:-translate-y-0.5 hover:border-yellow-400/35 hover:bg-yellow-400/14 hover:shadow-[0_4px_20px_rgba(247,209,84,0.1)]'
              >
                <svg
                  className='size-4'
                  viewBox='0 0 24 24'
                  fill='currentColor'
                >
                  <path d='M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.53-.95 3.4-.98 3.62 0 0-.02.17.09.24.11.06.24.01.24.01.32-.05 3.7-2.44 4.28-2.86.55.08 1.12.12 1.71.12 5.52 0 10-3.58 10-7.8C22 6.58 17.52 3 12 3z' />
                </svg>
                {t('contact.openKakao')}
              </a>
            ) : (
              <span className='flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm text-white/30'>
                {t('contact.openKakao')}
              </span>
            )}
          </div>
        </GlassCard>
      </div>

      {/* FAQ Section */}
      <div className='space-y-6'>
        <div className='space-y-2'>
          <span className='font-mono text-xs font-semibold tracking-[1px] text-[#f5a623] uppercase'>
            FAQ
          </span>
          <h2 className='text-[clamp(22px,4vw,30px)] font-extrabold tracking-tight text-white/90'>
            {t('contact.faqTitle')}
          </h2>
          <p className='text-sm font-light text-white/55'>
            룰북 기반 자주 묻는 질문 30선
          </p>
        </div>

        <div className='space-y-8'>
          {FAQ_SECTIONS.map((section, sIdx) => {
            return (
              <div key={sIdx} className='space-y-3'>
                {/* Section header */}
                <div className='flex items-center gap-2.5 border-b border-[#1e1e1e] pb-3'>
                  <span className='size-2 shrink-0 rounded-full bg-[#e74c3c]' />
                  <span className='text-[15px] font-bold text-white/90'>
                    {section.title}
                  </span>
                  {section.tag && (
                    <span className='rounded px-2.5 py-0.5 font-mono text-[11px] font-bold tracking-wide bg-[#f5a623]/[0.08] text-[#f5a623]'>
                      {section.tag === 'console' ? 'CONSOLE' : 'ARCADE'}
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className='flex flex-col gap-2'>
                  {section.items.map((item, iIdx) => {
                    globalNum++
                    const key = `${sIdx}-${iIdx}`
                    return (
                      <FaqItem
                        key={key}
                        num={globalNum}
                        question={item.question}
                        answer={item.answer}
                        isOpen={openFaq === key}
                        onToggle={() =>
                          setOpenFaq(openFaq === key ? null : key)
                        }
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Comparison Table */}
      <div className='space-y-4'>
        <div className='space-y-2'>
          <span className='font-mono text-xs font-semibold tracking-[1px] text-[#f5a623] uppercase'>
            COMPARE
          </span>
          <h2 className='text-[clamp(22px,4vw,30px)] font-extrabold tracking-tight text-white/90'>
            부문별 비교 요약
          </h2>
        </div>

        {/* Desktop table */}
        <div className='hidden overflow-hidden rounded-2xl border border-[#1e1e1e] bg-[#111] md:block'>
          <table className='w-full text-[13px]'>
            <caption className='sr-only'>콘솔 · 아케이드 부문 비교</caption>
            <thead>
              <tr className='border-b border-[#1e1e1e] bg-[#1a1a1a]'>
                <th className='px-5 py-3.5 text-left font-mono text-[11px] font-semibold tracking-wide text-white/35 uppercase'>
                  항목
                </th>
                <th className='px-5 py-3.5 text-left font-mono text-[11px] font-semibold tracking-wide text-[#f5a623] uppercase'>
                  콘솔
                </th>
                <th className='px-5 py-3.5 text-left font-mono text-[11px] font-semibold tracking-wide text-[#f5a623] uppercase'>
                  아케이드
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    'border-b border-[#1e1e1e] last:border-b-0',
                    i % 2 === 1 && 'bg-white/[0.015]'
                  )}
                >
                  <td className='px-5 py-3 font-medium text-white/55 break-keep'>
                    {row.label}
                  </td>
                  <td className='px-5 py-3 font-semibold text-white/90 break-keep'>
                    {row.console}
                  </td>
                  <td className='px-5 py-3 font-semibold text-white/90 break-keep'>
                    {row.arcade}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className='space-y-2 md:hidden'>
          {COMPARE_ROWS.map((row, i) => (
            <div
              key={i}
              className='tkc-motion-surface rounded-2xl border border-[#1e1e1e] bg-[#111] px-4 py-3 hover:border-[#2a2a2a]'
            >
              <p className='mb-2 font-mono text-[11px] font-semibold tracking-wide text-white/35 uppercase'>
                {row.label}
              </p>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='mb-0.5 font-mono text-[11px] font-bold tracking-wide text-[#f5a623]'>
                    콘솔
                  </p>
                  <p className='text-[12px] font-semibold text-white/90 break-keep'>
                    {row.console}
                  </p>
                </div>
                <div>
                  <p className='mb-0.5 font-mono text-[11px] font-bold tracking-wide text-[#f5a623]'>
                    아케이드
                  </p>
                  <p className='text-[12px] font-semibold text-white/90 break-keep'>
                    {row.arcade}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notice */}
      <div className='flex items-center gap-3 rounded-xl border border-[#f5a623]/[0.12] bg-[#f5a623]/[0.04] p-3.5 text-[12px] leading-[1.55] text-white/55 sm:p-4 sm:text-[13px]'>
        <span className='shrink-0'>⚠</span>
        <span className='break-keep'>{t('contact.notice')}</span>
      </div>
    </TkcSection>
  )
}
