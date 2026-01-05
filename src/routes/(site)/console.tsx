import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  FALLBACK_CONSOLE_SECTIONS,
  type ConsoleSection,
} from '@/content/console-guide'
import { useContent } from '@/lib/api'
import { t } from '@/text'

export const Route = createFileRoute('/(site)/console')({
  component: ConsolePage,
})

type ContentSection = {
  sectionKey?: ConsoleSection['sectionKey']
  order?: number | string
  title?: string
  bodyMd?: string
}

type ContentData = {
  content_sections?: ContentSection[]
}

const REQUIRED_KEYS: ConsoleSection['sectionKey'][] = [
  'atAGlance',
  'eligibility',
  'stage1',
  'stage2',
  'finals',
  'faq',
]

const fallbackMap = new Map(
  FALLBACK_CONSOLE_SECTIONS.map((section) => [section.sectionKey, section])
)

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

function MarkdownBlock({ body }: { body: string }) {
  return (
    <div className='space-y-4'>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {body}
      </ReactMarkdown>
    </div>
  )
}

type AccordionSectionProps = {
  title: string
  body: string
  defaultOpen?: boolean
}

function AccordionSection({
  title,
  body,
  defaultOpen,
}: AccordionSectionProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className='rounded-2xl border bg-card/60'>
      <CollapsibleTrigger className='group flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-base font-semibold'>
        <span>{title}</span>
        <ChevronDown className='h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-180' />
      </CollapsibleTrigger>
      <CollapsibleContent className='CollapsibleContent'>
        <div className='px-5 pb-6 pt-1'>
          <MarkdownBlock body={body} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function ConsolePage() {
  const { data, isError } = useContent<ContentData>('console')
  const title = t('nav.console')
  const statusMessage = isError ? t('content.loadFailed') : null

  const sections = useMemo(() => {
    const apiSections = Array.isArray(data?.content_sections)
      ? data.content_sections
      : []
    const apiMap = new Map<ConsoleSection['sectionKey'], ContentSection>()

    for (const section of apiSections) {
      if (!section?.sectionKey) continue
      apiMap.set(section.sectionKey, section)
    }

    return REQUIRED_KEYS.map((key) => {
      const fallback = fallbackMap.get(key)
      const apiSection = apiMap.get(key)
      if (!fallback) {
        return {
          sectionKey: key,
          order: 0,
          title: apiSection?.title ?? '',
          bodyMd: apiSection?.bodyMd ?? '',
        }
      }

      const title = apiSection?.title?.trim()
        ? apiSection.title
        : fallback.title
      const bodyMd = apiSection?.bodyMd?.trim()
        ? apiSection.bodyMd
        : fallback.bodyMd

      return {
        sectionKey: key,
        order: fallback.order,
        title,
        bodyMd,
      }
    })
  }, [data])

  const sectionMap = useMemo(() => {
    return new Map(sections.map((section) => [section.sectionKey, section]))
  }, [sections])

  const atAGlance = sectionMap.get('atAGlance')
  const eligibility = sectionMap.get('eligibility')
  const stageSections = [
    sectionMap.get('stage1'),
    sectionMap.get('stage2'),
    sectionMap.get('finals'),
  ].filter((section): section is ConsoleSection => Boolean(section))
  const faqSection = sectionMap.get('faq')

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <div className='space-y-10'>
      <div className='space-y-2'>
        <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
          {t('meta.siteName')}
        </p>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl'>{title}</h1>
      </div>

      {statusMessage && (
        <p className='text-sm text-muted-foreground'>{statusMessage}</p>
      )}

      <section className='grid gap-6 lg:grid-cols-2'>
        {atAGlance && (
          <Card>
            <CardHeader>
              <CardTitle className='text-xl'>{atAGlance.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownBlock body={atAGlance.bodyMd} />
            </CardContent>
          </Card>
        )}
        {eligibility && (
          <Card>
            <CardHeader>
              <CardTitle className='text-xl'>{eligibility.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownBlock body={eligibility.bodyMd} />
            </CardContent>
          </Card>
        )}
      </section>

      <section className='space-y-4'>
        <h2 className='text-xl font-semibold'>{t('console.rulesTitle')}</h2>
        <div className='space-y-3'>
          {stageSections.map((section, index) => (
            <AccordionSection
              key={section.sectionKey}
              title={section.title}
              body={section.bodyMd}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </section>

      {faqSection && (
        <section className='space-y-3'>
          <AccordionSection title={faqSection.title} body={faqSection.bodyMd} />
        </section>
      )}
    </div>
  )
}
