import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createFileRoute } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useContent, useSite } from '@/lib/api'

export const Route = createFileRoute('/(site)/contact')({
  component: ContactPage,
})

type SiteData = {
  contactEmail?: string
  kakaoChannelUrl?: string
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

  return (
    <div className='space-y-6'>
      <div className='space-y-2'>
        <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
          TKC2026
        </p>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>
          Contact
        </h1>
        <p className='text-sm text-muted-foreground'>
          Reach out to the organizers for questions or support.
        </p>
      </div>

      {isSiteLoading && (
        <p className='text-sm text-muted-foreground'>
          Loading contact information...
        </p>
      )}
      {isSiteError && (
        <p className='text-sm text-destructive'>
          Failed to load contact information.
        </p>
      )}
      {isContentLoading && (
        <p className='text-sm text-muted-foreground'>Loading details...</p>
      )}
      {isContentError && (
        <p className='text-sm text-destructive'>Failed to load content.</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Contact Channels</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col gap-3 sm:flex-row'>
            {emailHref ? (
              <Button asChild>
                <a href={emailHref}>Send Email</a>
              </Button>
            ) : (
              <Button disabled>Send Email</Button>
            )}
            {kakaoChannelUrl ? (
              <Button variant='outline' asChild>
                <a
                  href={kakaoChannelUrl}
                  target='_blank'
                  rel='noreferrer'
                >
                  Open Kakao Channel
                </a>
              </Button>
            ) : (
              <Button variant='outline' disabled>
                Open Kakao Channel
              </Button>
            )}
          </div>
          {contactEmail && (
            <p className='text-sm text-muted-foreground'>
              Email: {contactEmail}
            </p>
          )}
          {kakaoChannelUrl && (
            <p className='text-sm text-muted-foreground'>
              Kakao Channel: {kakaoChannelUrl}
            </p>
          )}
          {!hasContactInfo && !isSiteLoading && !isSiteError && (
            <p className='text-sm text-muted-foreground'>
              Contact details will be available soon.
            </p>
          )}
        </CardContent>
      </Card>

      <div className='space-y-6'>
        {sortedSections.map((section, index) => {
          const body = section.bodyMd ?? ''
          const heading = section.title ?? `Section ${index + 1}`

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
            No additional contact content is available.
          </p>
        )}
    </div>
  )
}
