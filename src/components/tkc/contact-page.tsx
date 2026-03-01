import { useEffect, useState, type ReactNode } from 'react'
import { t } from '@/text'
import { ChevronDown } from 'lucide-react'
import { useSite } from '@/lib/api'
import { sanitizeUrl } from '@/lib/sanitize-url'
import { cn } from '@/lib/utils'
import { GlassCard } from '@/components/tkc/glass-card'
import { PageHero, TkcSection } from '@/components/tkc/layout'

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

const FAQ_ITEMS: FaqItemData[] = [
  {
    question: '신청 시 어떤 정보를 제출해야 하나요?',
    answer: (
      <>
        부문에 따라 약간 다릅니다.
        <FaqList
          items={[
            '공통 : 이름, 닉네임, 전화번호, 이메일, 개인정보활용 동의',
            '콘솔 부문 추가 : 영상 링크(유튜브 일부공개)',
            '아케이드 부문 추가 : 북번호(太鼓番), 참가 차수, 오프라인 예선곡 4곡',
            '미성년자 : 보호자 동의서(PDF) 추가 제출',
          ]}
        />
      </>
    ),
  },
  {
    question: '참가 자격은 어떻게 되나요?',
    answer: (
      <>
        <FaqList
          items={[
            '대한민국 국적을 보유하고, 대한민국에 거주하는 분이면 누구나 참가 가능',
            '미성년자 : 보호자 동의서(PDF) 제출 필수',
            '현역 군인 : 소속부대장 허가 필요',
          ]}
        />
      </>
    ),
  },
  {
    question: '콘솔과 아케이드 모두 참가할 수 있나요?',
    answer:
      '콘솔과 아케이드 중 하나의 부문만 참가할 수 있습니다. 중복 신청은 불가합니다.',
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
        <span className='shrink-0 rounded bg-[#f5a623]/[0.08] px-2 py-0.5 font-mono text-[12px] font-bold tracking-wide text-[#f5a623]'>
          Q{num}
        </span>
        <span className='flex-1 text-[13px] font-bold break-keep text-white/90 sm:text-sm'>
          {question}
        </span>
        <ChevronDown
          aria-hidden={true}
          className={cn(
            'size-4 shrink-0 text-white/35 transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-400 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className='overflow-hidden'>
          <div className='border-t border-[#1e1e1e] px-4 py-4 pl-[3.2rem] text-[13px] leading-[1.55] break-keep text-white/55 sm:px-6 sm:py-5 sm:pl-[4.2rem]'>
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

export function ContactPage() {
  const { data: siteData, isError: isSiteError } = useSite<SiteData>()
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  const contactEmail = siteData?.contactEmail ?? ''
  const kakaoChannelUrl = sanitizeUrl(
    siteData?.kakaoChannelUrl || 'http://pf.kakao.com/_PncxgG'
  )
  const emailHref = contactEmail ? sanitizeUrl(`mailto:${contactEmail}`) : ''

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('contact.title')}`
  }, [])

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
                <p className='text-[12px] font-semibold tracking-wide text-white/40 uppercase'>
                  Email
                </p>
                <p className='text-lg font-bold text-sky-400'>
                  {t('contact.labelEmail')}
                </p>
              </div>
            </div>

            <div className='mb-5 flex flex-1 items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5'>
              <span className='font-mono text-sm break-all text-white/60'>
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
                <p className='text-[12px] font-semibold tracking-wide text-white/40 uppercase'>
                  Kakao Channel
                </p>
                <p className='text-lg font-bold text-yellow-400'>
                  {t('contact.labelKakao')}
                </p>
              </div>
            </div>

            <div className='mb-5 flex flex-1 items-center rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5'>
              <span className='font-mono text-sm break-all text-white/60'>
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
                <svg className='size-4' viewBox='0 0 24 24' fill='currentColor'>
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
      <div className='space-y-4'>
        <div className='space-y-2'>
          <span className='font-mono text-xs font-semibold tracking-[1px] text-[#f5a623] uppercase'>
            FAQ
          </span>
          <h2 className='text-[clamp(22px,4vw,30px)] font-extrabold tracking-tight text-white/90'>
            {t('contact.faqTitle')}
          </h2>
        </div>

        <div className='flex flex-col gap-2'>
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem
              key={i}
              num={i + 1}
              question={item.question}
              answer={item.answer}
              isOpen={openFaq === String(i)}
              onToggle={() =>
                setOpenFaq(openFaq === String(i) ? null : String(i))
              }
            />
          ))}
        </div>

        <p className='text-[13px] text-white/40'>
          자세한 대회 규정은 각 부문 페이지를 확인해 주세요.
        </p>
      </div>

      {/* Notice */}
      <div className='flex items-center gap-3 rounded-xl border border-[#f5a623]/[0.12] bg-[#f5a623]/[0.04] p-3.5 text-[12px] leading-[1.55] text-white/55 sm:p-4 sm:text-[13px]'>
        <span className='shrink-0'>⚠</span>
        <span className='break-keep'>{t('contact.notice')}</span>
      </div>
    </TkcSection>
  )
}
