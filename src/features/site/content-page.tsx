import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useContent } from '@/lib/api'

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

export function SiteContentPage({ page, title }: SiteContentPageProps) {
  const { data, isLoading, isError } = useContent<ContentData>(page)
  const sections = Array.isArray(data?.content_sections)
    ? data.content_sections
    : []
  const sortedSections = [...sections].sort(
    (left, right) => getOrder(left.order) - getOrder(right.order)
  )

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
          TKC2026
        </p>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          {title}
        </h1>
      </div>

      {isLoading && (
        <p className='text-sm text-muted-foreground'>Loading content...</p>
      )}
      {isError && (
        <p className='text-sm text-destructive'>Failed to load content.</p>
      )}

      {!isLoading && !isError && sortedSections.length === 0 && (
        <p className='text-sm text-muted-foreground'>No content available.</p>
      )}

      <div className='space-y-6'>
        {sortedSections.map((section, index) => {
          const imageUrl = section.imageUrl
          const body = section.bodyMd ?? ''
          const heading = section.title ?? `Section ${index + 1}`

          return (
            <Card key={`${heading}-${index}`}>
              <CardHeader>
                <CardTitle className='text-xl'>{heading}</CardTitle>
              </CardHeader>
              <CardContent>
                {imageUrl ? (
                  <div className='grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-start'>
                    <div className='space-y-4'>
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownComponents}
                      >
                        {body}
                      </ReactMarkdown>
                    </div>
                    <div className='overflow-hidden rounded-2xl border bg-muted/30'>
                      <img
                        src={imageUrl}
                        alt={heading}
                        className='h-full w-full object-cover'
                        loading='lazy'
                      />
                    </div>
                  </div>
                ) : (
                  <div className='space-y-4'>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {body}
                    </ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
