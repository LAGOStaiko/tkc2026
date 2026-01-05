import { useEffect } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useContent, useSite } from '@/lib/api'
import { t } from '@/text'

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
    return <h2 className='text-2xl font-semibold tracking-tight' {...rest} />
  },
  h2: (props) => {
    const rest = omitNode(props)
    return <h3 className='text-xl font-semibold tracking-tight' {...rest} />
  },
  h3: (props) => {
    const rest = omitNode(props)
    return <h4 className='text-lg font-semibold tracking-tight' {...rest} />
  },
  p: (props) => {
    const rest = omitNode(props)
    return <p className='text-base leading-relaxed text-foreground/90' {...rest} />
  },
  a: (props) => {
    const rest = omitNode(props)
    return (
      <a
        className='text-primary underline underline-offset-4 hover:text-primary/80'
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
    return <li className='text-base leading-relaxed text-foreground/90' {...rest} />
  },
  blockquote: (props) => {
    const rest = omitNode(props)
    return (
      <blockquote
        className='border-l-4 border-muted pl-4 text-muted-foreground'
        {...rest}
      />
    )
  },
  code: (props) => {
    const rest = omitNode(props)
    return <code className='rounded bg-muted px-1 py-0.5 text-sm' {...rest} />
  },
  pre: (props) => {
    const rest = omitNode(props)
    return (
      <pre
        className='overflow-x-auto rounded-lg border bg-muted p-3 text-sm'
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
  const {
    data: siteData,
    isLoading: isSiteLoading,
    isError: isSiteError,
  } = useSite<SiteData>()
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

  const hasContactInfo = Boolean(contactEmail || kakaoChannelUrl)

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${t('contact.title')}`
  }, [])

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
          {t('meta.siteName')}
        </p>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          {t('contact.title')}
        </h1>
        <p className='text-sm text-muted-foreground'>
          {t('contact.subtitle')}
        </p>
      </div>

      {isSiteError && (
        <p className='text-sm text-destructive'>
          {t('contact.failedInfo')}
        </p>
      )}
      {isContentError && (
        <p className='text-sm text-destructive'>
          {t('contact.failedContent')}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('contact.channelsTitle')}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col gap-3 sm:flex-row'>
            {emailHref ? (
              <Button asChild>
                <a href={emailHref}>{t('contact.sendEmail')}</a>
              </Button>
            ) : (
              <Button disabled>{t('contact.sendEmail')}</Button>
            )}
            {kakaoChannelUrl ? (
              <Button variant='outline' asChild>
                <a
                  href={kakaoChannelUrl}
                  target='_blank'
                  rel='noreferrer'
                >
                  {t('contact.openKakao')}
                </a>
              </Button>
            ) : (
              <Button variant='outline' disabled>
                {t('contact.openKakao')}
              </Button>
            )}
          </div>
          {contactEmail && (
            <p className='text-sm text-muted-foreground'>
              {t('contact.labelEmail')}: {contactEmail}
            </p>
          )}
          {kakaoChannelUrl && (
            <p className='text-sm text-muted-foreground'>
              {t('contact.labelKakao')}: {kakaoChannelUrl}
            </p>
          )}
          {!hasContactInfo && !isSiteLoading && !isSiteError && (
            <p className='text-sm text-muted-foreground'>
              {t('contact.noInfo')}
            </p>
          )}
        </CardContent>
      </Card>

      <div className='space-y-6'>
        {sortedSections.map((section, index) => {
          const body = section.bodyMd ?? ''
          const heading =
            section.title ?? `${t('content.sectionFallback')} ${index + 1}`

          return (
            <Card key={`${heading}-${index}`}>
              <CardHeader>
                <CardTitle className='text-xl'>{heading}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {body}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!isContentLoading &&
        !isContentError &&
        sortedSections.length === 0 && (
          <p className='text-sm text-muted-foreground'>
            {t('contact.noContent')}
          </p>
        )}
    </div>
  )
}
