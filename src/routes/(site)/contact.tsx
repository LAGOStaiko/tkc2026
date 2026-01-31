import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { t } from '@/text'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useContent, useSite } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GlassCard } from '@/components/tkc/glass-card'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/contact')({
  component: ContactPage,
})

type SiteData = {
  contactEmail?: string
  kakaoChannelUrl?: string
  logoUrl?: string
}

type ContentSection = {
  order?: number | string
  title?: string
  bodyMd?: string
  imageUrl?: string
}

type ContentData = {
  content_sections?: ContentSection[]
}

const omitNode = <T extends { node?: unknown }>(props: T) => {
  const { node, ...rest } = props
  void node
  return rest
}

const markdownComponents: Components = {
  h1: (props) => {
    const rest = omitNode(props)
    return (
      <h2 className='text-xl font-semibold text-white md:text-2xl' {...rest} />
    )
  },
  h2: (props) => {
    const rest = omitNode(props)
    return (
      <h3 className='text-lg font-semibold text-white md:text-xl' {...rest} />
    )
  },
  h3: (props) => {
    const rest = omitNode(props)
    return (
      <h4 className='text-base font-semibold text-white md:text-lg' {...rest} />
    )
  },
  p: (props) => {
    const rest = omitNode(props)
    return (
      <p
        className='text-sm leading-relaxed text-white/85 md:text-base'
        {...rest}
      />
    )
  },
  a: (props) => {
    const rest = omitNode(props)
    return (
      <a
        className='text-sky-300 underline underline-offset-4 hover:text-sky-200'
        {...rest}
      />
    )
  },
  ul: (props) => {
    const rest = omitNode(props)
    return <ul className='ml-5 list-disc space-y-1' {...rest} />
  },
  ol: (props) => {
    const rest = omitNode(props)
    return <ol className='ml-5 list-decimal space-y-1' {...rest} />
  },
  li: (props) => {
    const rest = omitNode(props)
    return (
      <li
        className='text-sm leading-relaxed text-white/85 md:text-base'
        {...rest}
      />
    )
  },
  blockquote: (props) => {
    const rest = omitNode(props)
    return (
      <blockquote
        className='border-l-4 border-white/10 pl-4 text-white/60'
        {...rest}
      />
    )
  },
  code: (props) => {
    const rest = omitNode(props)
    return (
      <code className='rounded bg-white/10 px-1 py-0.5 text-sm' {...rest} />
    )
  },
  pre: (props) => {
    const rest = omitNode(props)
    return (
      <pre
        className='overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80'
        {...rest}
      />
    )
  },
}

const getOrder = (value: unknown) => {
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numeric : Number.MAX_SAFE_INTEGER
}

function ContactPage() {
  const { data: siteData, isError: isSiteError } = useSite<SiteData>()
  const {
    data: contentData,
    isLoading: isContentLoading,
    isError: isContentError,
  } = useContent<ContentData>('contact')

  const contactEmail = siteData?.contactEmail ?? ''
  const kakaoChannelUrl = siteData?.kakaoChannelUrl ?? ''
  const emailHref = contactEmail ? `mailto:${contactEmail}` : ''
  const sections = Array.isArray(contentData?.content_sections)
    ? contentData.content_sections
    : []
  const sortedSections = [...sections].sort(
    (left, right) => getOrder(left.order) - getOrder(right.order)
  )

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('contact.title')}`
  }, [])

  return (
    <TkcSection>
      <TkcPageHeader
        title={t('contact.title')}
        subtitle={t('contact.subtitle')}
      />

      {isSiteError && (
        <p className='text-sm text-destructive'>{t('contact.failedInfo')}</p>
      )}
      {isContentError && (
        <p className='text-sm text-destructive'>{t('contact.failedContent')}</p>
      )}

      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-white md:text-2xl'>
          {t('contact.channelsTitle')}
        </h2>
        <div className='grid gap-4 md:grid-cols-2'>
          <GlassCard className='p-5 md:p-7'>
            <div className='space-y-3'>
              <p className='text-xs font-semibold tracking-[0.24em] text-white/60 uppercase'>
                {t('contact.labelEmail')}
              </p>
              <p className='text-sm text-white/85 md:text-base'>
                {contactEmail || t('contact.noInfo')}
              </p>
              {emailHref ? (
                <Button asChild className='h-11 w-full'>
                  <a href={emailHref}>{t('contact.sendEmail')}</a>
                </Button>
              ) : (
                <Button disabled className='h-11 w-full'>
                  {t('contact.sendEmail')}
                </Button>
              )}
            </div>
          </GlassCard>
          <GlassCard className='p-5 md:p-7'>
            <div className='space-y-3'>
              <p className='text-xs font-semibold tracking-[0.24em] text-white/60 uppercase'>
                {t('contact.labelKakao')}
              </p>
              <p className='text-sm text-white/85 md:text-base'>
                {kakaoChannelUrl || t('contact.noInfo')}
              </p>
              {kakaoChannelUrl ? (
                <Button variant='outline' asChild className='h-11 w-full'>
                  <a href={kakaoChannelUrl} target='_blank' rel='noreferrer'>
                    {t('contact.openKakao')}
                  </a>
                </Button>
              ) : (
                <Button variant='outline' disabled className='h-11 w-full'>
                  {t('contact.openKakao')}
                </Button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      <div className='space-y-10 md:space-y-14'>
        {sortedSections.map((section, index) => {
          const body = section.bodyMd ?? ''
          const heading =
            section.title ?? `${t('content.sectionFallback')} ${index + 1}`

          return (
            <GlassCard key={`${heading}-${index}`}>
              <CardHeader className='p-5 md:p-7'>
                <CardTitle className='text-xl text-white md:text-2xl'>
                  {heading}
                </CardTitle>
              </CardHeader>
              <CardContent className='p-5 pt-0 md:p-7 md:pt-0'>
                <div className='max-w-prose space-y-4'>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {body}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </GlassCard>
          )
        })}
      </div>

      {!isContentLoading && !isContentError && sortedSections.length === 0 && (
        <p className='text-sm text-white/60'>{t('contact.noContent')}</p>
      )}
    </TkcSection>
  )
}
