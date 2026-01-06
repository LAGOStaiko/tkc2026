import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TkcField, TkcRuleSheet } from '@/components/tkc-rule-sheet'
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

type FieldBlock = {
  label: string
  body: string
  badges?: string[]
}

const REQUIRED_KEYS: ConsoleSection['sectionKey'][] = [
  'atAGlance',
  'eligibility',
  'stage1',
  'stage2',
  'finals',
  'faq',
]

const SHEET_ORDER: ConsoleSection['sectionKey'][] = [
  'atAGlance',
  'eligibility',
  'stage1',
  'stage2',
  'finals',
  'faq',
]

const SECTION_IDS: Record<ConsoleSection['sectionKey'], string> = {
  atAGlance: 'console-at-a-glance',
  eligibility: 'console-eligibility',
  stage1: 'console-stage-1',
  stage2: 'console-stage-2',
  finals: 'console-finals',
  faq: 'console-faq',
}

const fallbackMap = new Map(
  FALLBACK_CONSOLE_SECTIONS.map((section) => [section.sectionKey, section])
)

const BADGE_KEYWORDS = ['필수', '금지', '추후 공지'] as const

const omitNode = <T extends { node?: unknown }>(props: T) => {
  const { node, ...rest } = props
  void node
  return rest
}

const markdownComponents: Components = {
  h1: (props) => {
    const rest = omitNode(props)
    return <h3 className='text-lg font-semibold text-white' {...rest} />
  },
  h2: (props) => {
    const rest = omitNode(props)
    return <h3 className='text-lg font-semibold text-white' {...rest} />
  },
  h3: (props) => {
    const rest = omitNode(props)
    return <h4 className='text-base font-semibold text-white' {...rest} />
  },
  p: (props) => {
    const rest = omitNode(props)
    return (
      <p
        className='text-sm leading-relaxed text-white/90 break-keep md:text-base md:leading-7'
        {...rest}
      />
    )
  },
  a: (props) => {
    const rest = omitNode(props)
    return (
      <a
        className='text-sky-200 underline underline-offset-4 hover:text-sky-100'
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
        className='text-sm leading-relaxed text-white/90 break-keep md:text-base md:leading-7'
        {...rest}
      />
    )
  },
  blockquote: (props) => {
    const rest = omitNode(props)
    return (
      <blockquote
        className='border-l-4 border-white/15 pl-4 text-white/70'
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
      <pre className='overflow-x-auto rounded-lg border border-white/10 bg-white/5 p-3 text-sm'>
        {rest.children}
      </pre>
    )
  },
  hr: () => <hr className='border-white/10' />,
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

const extractBadges = (label: string, body: string) => {
  const text = `${label} ${body}`
  const badges = BADGE_KEYWORDS.filter((keyword) => text.includes(keyword))
  return badges.length > 0 ? badges : undefined
}

const splitMarkdownSections = (body: string, fallbackLabel: string) => {
  const lines = body.split(/\r?\n/)
  const sections: FieldBlock[] = []
  let currentLabel = ''
  let buffer: string[] = []

  const flush = () => {
    const content = buffer.join('\n').trim()
    if (!content && !currentLabel) return
    const label = currentLabel || fallbackLabel
    if (content) {
      sections.push({
        label,
        body: content,
        badges: extractBadges(label, content),
      })
    }
    buffer = []
  }

  for (const line of lines) {
    const match = line.match(/^#{2,3}\s+(.*)$/)
    if (match) {
      flush()
      currentLabel = match[1].trim()
      continue
    }
    buffer.push(line)
  }

  flush()

  if (sections.length === 0 && body.trim()) {
    return [
      {
        label: fallbackLabel,
        body: body.trim(),
        badges: extractBadges(fallbackLabel, body),
      },
    ]
  }

  return sections
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

  const sheetTitles: Record<ConsoleSection['sectionKey'], string> = {
    atAGlance: t('console.sheet.overview'),
    eligibility: t('console.sheet.eligibility'),
    stage1: t('console.sheet.stage1'),
    stage2: t('console.sheet.stage2'),
    finals: t('console.sheet.finals'),
    faq: t('console.sheet.faq'),
  }

  const tocItems = SHEET_ORDER.map((key) => ({
    key,
    title: sheetTitles[key],
    id: SECTION_IDS[key],
  }))

  const sheetEntries = useMemo(() => {
    return SHEET_ORDER.flatMap((key) => {
      const section = sectionMap.get(key)
      if (!section) return []
      const fields = splitMarkdownSections(section.bodyMd, section.title)
      return [
        {
          key,
          id: SECTION_IDS[key],
          title: sheetTitles[key],
          fields,
        },
      ]
    })
  }, [sectionMap, sheetTitles])

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <div className='space-y-10 md:space-y-12'>
      <div className='space-y-2'>
        <p className='text-xs uppercase tracking-[0.3em] text-muted-foreground'>
          {t('meta.siteName')}
        </p>
        <h1 className='text-3xl font-bold tracking-tight sm:text-4xl font-serif'>
          {title}
        </h1>
      </div>

      {statusMessage && (
        <p className='text-sm text-muted-foreground'>{statusMessage}</p>
      )}

      <div className='lg:grid lg:grid-cols-[260px_1fr] lg:gap-10'>
        <aside className='hidden lg:block'>
          <div className='sticky top-24'>
            <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur-md'>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-white/60'>
                {t('console.tocTitle')}
              </p>
              <nav
                aria-label={t('console.tocTitle')}
                className='mt-4 flex flex-col gap-2 text-sm text-white/80'
              >
                {tocItems.map((item) => (
                  <a
                    key={item.key}
                    href={`#${item.id}`}
                    className='rounded-lg px-2 py-1 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
                  >
                    {item.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        <div className='space-y-10 md:space-y-12'>
          {sheetEntries.map((sheet) => (
            <TkcRuleSheet
              key={sheet.key}
              id={sheet.id}
              className='scroll-mt-24'
              title={sheet.title}
            >
              {sheet.fields.map((field, index) => (
                <TkcField
                  key={`${sheet.key}-${index}`}
                  label={field.label}
                  badges={field.badges}
                >
                  <MarkdownBlock body={field.body} />
                </TkcField>
              ))}
            </TkcRuleSheet>
          ))}
        </div>
      </div>
    </div>
  )
}
