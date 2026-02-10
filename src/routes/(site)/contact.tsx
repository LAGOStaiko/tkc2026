import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import { useSite } from '@/lib/api'
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

const FAQ_ITEMS = [
  {
    question: '대회 참가 자격이 어떻게 되나요?',
    answer:
      '참가 자격 등 세부 조건은 각 부문 안내 페이지에서 확인하실 수 있습니다. 콘솔과 아케이드 부문별로 참가 조건이 다르니 해당 페이지를 확인해 주세요.',
  },
  {
    question: '두 부문(콘솔 · 아케이드) 동시 참가가 가능한가요?',
    answer:
      '네, 콘솔과 아케이드 부문은 별도로 운영되므로 두 부문 모두 참가 가능합니다.',
  },
  {
    question: '결선은 어디에서 진행되나요?',
    answer:
      '결선은 5월 23일 팩토리에서 열리는 플레이엑스포(PlayX4) 2026에서 진행됩니다. 콘솔과 아케이드 결선이 동시에 진행됩니다.',
  },
  {
    question: '문의 응답까지 얼마나 걸리나요?',
    answer:
      '이메일 및 카카오 채널을 통한 문의는 영업일 기준 1~2일 이내에 답변드리고 있습니다. 대회 기간 중에는 다소 지연될 수 있습니다.',
  },
]

function FaqItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <GlassCard
      className={cn(
        'overflow-hidden transition-all',
        isOpen && 'border-white/20 bg-white/[0.05]'
      )}
    >
      <button
        type='button'
        className='flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02] md:gap-4 md:px-6 md:py-5'
        onClick={onToggle}
      >
        <span className='flex size-8 flex-shrink-0 items-center justify-center rounded-lg border border-[#ff2a00]/50 text-sm font-extrabold text-[#ff2a00] md:size-9 md:text-base'>
          Q
        </span>
        <span className='flex-1 text-sm font-semibold break-keep md:text-base'>
          {question}
        </span>
        <svg
          className={cn(
            'size-5 flex-shrink-0 text-white/40 transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        >
          <polyline points='6 9 12 15 18 9' />
        </svg>
      </button>
      <div
        className={cn(
          'grid transition-all duration-300',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className='overflow-hidden'>
          <div className='px-5 pb-5 pl-16 text-sm leading-relaxed text-white/70 break-keep md:px-6 md:pb-6 md:pl-[4.5rem] md:text-base'>
            {answer}
          </div>
        </div>
      </div>
    </GlassCard>
  )
}

function ContactPage() {
  const { data: siteData, isError: isSiteError } = useSite<SiteData>()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const contactEmail = siteData?.contactEmail ?? ''
  const kakaoChannelUrl = siteData?.kakaoChannelUrl ?? ''
  const emailHref = contactEmail ? `mailto:${contactEmail}` : ''

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
                <p className='text-[11px] font-semibold tracking-widest text-white/40 uppercase'>
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

            {emailHref ? (
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
                <p className='text-[11px] font-semibold tracking-widest text-white/40 uppercase'>
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

            {kakaoChannelUrl ? (
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
      <div className='space-y-4'>
        <div className='space-y-2'>
          <p className='text-xs font-semibold tracking-[3px] text-[#ff2a00] uppercase'>
            FAQ
          </p>
          <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>
            {t('contact.faqTitle')}
          </h2>
          <p className='text-sm text-white/60 md:text-base'>
            {t('contact.faqDesc')}
          </p>
        </div>

        <div className='flex flex-col gap-2'>
          {FAQ_ITEMS.map((item, index) => (
            <FaqItem
              key={index}
              question={item.question}
              answer={item.answer}
              isOpen={openFaq === index}
              onToggle={() =>
                setOpenFaq(openFaq === index ? null : index)
              }
            />
          ))}
        </div>
      </div>

      {/* Notice */}
      <GlassCard className='flex items-start gap-3.5 p-5 md:p-6'>
        <div className='mt-0.5 flex size-7 flex-shrink-0 items-center justify-center rounded-lg border border-[#ff2a00]/12 bg-[#ff2a00]/6'>
          <svg
            className='size-3.5 text-[#ff2a00]'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <circle cx='12' cy='12' r='10' />
            <line x1='12' y1='16' x2='12' y2='12' />
            <line x1='12' y1='8' x2='12.01' y2='8' />
          </svg>
        </div>
        <p className='text-sm leading-relaxed text-white/50 break-keep md:text-base'>
          {t('contact.notice')}
        </p>
      </GlassCard>
    </TkcSection>
  )
}
