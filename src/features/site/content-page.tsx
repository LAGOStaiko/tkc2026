import { useEffect } from 'react'
import { t } from '@/text'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useContent } from '@/lib/api'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GlassCard } from '@/components/tkc/glass-card'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

type ContentSection = {
  order?: number | string
  title?: string
  bodyMd?: string
  imageUrl?: string
}

type ContentData = {
  content_sections?: ContentSection[]
}

type SiteContentPageProps = {
  page: 'console' | 'arcade'
  title: string
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

export function SiteContentPage({ page, title }: SiteContentPageProps) {
  const { data, isLoading, isError } = useContent<ContentData>(page)
  const sections = Array.isArray(data?.content_sections)
    ? data.content_sections
    : []
  const sortedSections = [...sections].sort(
    (left, right) => getOrder(left.order) - getOrder(right.order)
  )

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <TkcSection>
      <TkcPageHeader title={title} />

      {isLoading && (
        <p className='text-sm text-white/60'>{t('content.loading')}</p>
      )}
      {isError && (
        <p className='text-sm text-destructive'>{t('content.loadFailed')}</p>
      )}

      {!isLoading && !isError && sortedSections.length === 0 && (
        <p className='text-sm text-white/60'>{t('content.empty')}</p>
      )}

      <div className='space-y-10 md:space-y-14'>
        {sortedSections.map((section, index) => {
          const imageUrl = section.imageUrl
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
                {imageUrl ? (
                  <div className='grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start'>
                    <div className='max-w-prose space-y-4'>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {body}
                      </ReactMarkdown>
                    </div>
                    <div className='overflow-hidden rounded-2xl border border-white/10 bg-white/5'>
                      <img
                        src={imageUrl}
                        alt={heading}
                        className='h-full w-full object-cover'
                        loading='lazy'
                      />
                    </div>
                  </div>
                ) : (
                  <div className='max-w-prose space-y-4'>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {body}
                    </ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </GlassCard>
          )
        })}
      </div>
    </TkcSection>
  )
}
