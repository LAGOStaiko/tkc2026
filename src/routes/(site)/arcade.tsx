import { useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  FALLBACK_ARCADE_SECTIONS,
  type ArcadeSection,
} from '@/content/arcade-guide'
import { t } from '@/text'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useContent } from '@/lib/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TkcField, TkcRuleSheet } from '@/components/tkc-rule-sheet'
import { TkcPageHeader, TkcSection } from '@/components/tkc/layout'

export const Route = createFileRoute('/(site)/arcade')({
  component: ArcadePage,
})

type ContentSection = {
  sectionKey?: ArcadeSection['sectionKey']
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

const REQUIRED_KEYS: ArcadeSection['sectionKey'][] = [
  'atAGlance',
  'onlineQualifier',
  'offlineSwiss',
  'deciderAndSeeding',
  'finals',
  'operations',
]

const SHEET_ORDER: ArcadeSection['sectionKey'][] = [
  'atAGlance',
  'onlineQualifier',
  'offlineSwiss',
  'deciderAndSeeding',
  'finals',
  'operations',
]

const SECTION_IDS: Record<ArcadeSection['sectionKey'], string> = {
  atAGlance: 'arcade-at-a-glance',
  onlineQualifier: 'arcade-online-qualifier',
  offlineSwiss: 'arcade-offline-swiss',
  deciderAndSeeding: 'arcade-decider-seeding',
  finals: 'arcade-finals',
  operations: 'arcade-operations',
}

const SHEET_TITLES: Record<ArcadeSection['sectionKey'], string> = {
  atAGlance: '대회 개요',
  onlineQualifier: '온라인 예선',
  offlineSwiss: '오프라인 예선 (스위스 스테이지)',
  deciderAndSeeding: '결선 진출자 선발전 / 시드전',
  finals: 'Top 8 결선',
  operations: '밴픽/점수/운영 규정',
}

const fallbackMap = new Map(
  FALLBACK_ARCADE_SECTIONS.map((section) => [section.sectionKey, section])
)

const BADGE_KEYWORDS = ['필수', '중요', '금지', '불가', '추후 공지'] as const

const omitNode = <T extends { node?: unknown }>(props: T) => {
  const { node, ...rest } = props
  void node
  return rest
}

const markdownComponents: Components = {
  h1: (props) => {
    const rest = omitNode(props)
    return <h3 className='text-lg font-bold text-white' {...rest} />
  },
  h2: (props) => {
    const rest = omitNode(props)
    return <h3 className='text-lg font-bold text-white' {...rest} />
  },
  h3: (props) => {
    const rest = omitNode(props)
    return <h4 className='text-base font-bold text-white' {...rest} />
  },
  p: (props) => {
    const rest = omitNode(props)
    return (
      <p
        className='text-sm leading-relaxed break-keep text-white/90 md:text-base md:leading-[1.8]'
        {...rest}
      />
    )
  },
  a: (props) => {
    const rest = omitNode(props)
    return (
      <a
        className='font-medium text-[#ff8c66] underline underline-offset-4 hover:text-[#ff2a00]'
        {...rest}
      />
    )
  },
  ul: (props) => {
    const rest = omitNode(props)
    return <ul className='ml-5 list-disc space-y-1.5' {...rest} />
  },
  ol: (props) => {
    const rest = omitNode(props)
    return <ol className='ml-5 list-decimal space-y-1.5' {...rest} />
  },
  li: (props) => {
    const rest = omitNode(props)
    return (
      <li
        className='text-sm leading-relaxed break-keep text-white/90 md:text-base md:leading-[1.8]'
        {...rest}
      />
    )
  },
  blockquote: (props) => {
    const rest = omitNode(props)
    return (
      <blockquote
        className='border-l-4 border-[#ff2a00]/30 pl-4 text-white/75'
        {...rest}
      />
    )
  },
  code: (props) => {
    const rest = omitNode(props)
    return (
      <code className='rounded bg-white/10 px-1.5 py-0.5 text-sm' {...rest} />
    )
  },
  pre: (props) => {
    const rest = omitNode(props)
    return (
      <pre className='overflow-x-auto rounded-lg border border-white/10 bg-white/[0.05] p-4 text-sm'>
        {rest.children}
      </pre>
    )
  },
  table: (props) => {
    const rest = omitNode(props)
    return (
      <div className='-mx-4 overflow-x-auto px-4'>
        <Table className='text-sm md:text-base'>{rest.children}</Table>
      </div>
    )
  },
  thead: (props) => {
    const rest = omitNode(props)
    return <TableHeader className='bg-white/[0.07] text-white/75' {...rest} />
  },
  tbody: (props) => {
    const rest = omitNode(props)
    return <TableBody className='text-white/90' {...rest} />
  },
  tr: (props) => {
    const rest = omitNode(props)
    return (
      <TableRow
        className='border-white/[0.07] hover:bg-white/[0.04]'
        {...rest}
      />
    )
  },
  th: (props) => {
    const rest = omitNode(props)
    return (
      <TableHead
        className='border-white/[0.07] px-3 py-2 text-xs font-bold break-keep text-white/75 md:px-4 md:py-2.5 md:text-sm'
        {...rest}
      />
    )
  },
  td: (props) => {
    const rest = omitNode(props)
    return (
      <TableCell
        className='border-white/[0.07] px-3 py-2.5 align-top text-sm break-keep text-white/90 md:px-4 md:py-3 md:text-base'
        {...rest}
      />
    )
  },
  hr: () => <hr className='border-white/15' />,
}

function MarkdownBlock({ body }: { body: string }) {
  return (
    <div className='space-y-4'>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
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

function ArcadePage() {
  const { data, isError } = useContent<ContentData>('arcade')
  const title = t('nav.arcade')
  const statusMessage = isError ? t('content.loadFailed') : null

  const sections = useMemo(() => {
    const apiSections = Array.isArray(data?.content_sections)
      ? data.content_sections
      : []
    const apiMap = new Map<ArcadeSection['sectionKey'], ContentSection>()

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

      const sectionTitle = apiSection?.title?.trim()
        ? apiSection.title
        : fallback.title
      const bodyMd = apiSection?.bodyMd?.trim()
        ? apiSection.bodyMd
        : fallback.bodyMd

      return {
        sectionKey: key,
        order: fallback.order,
        title: sectionTitle,
        bodyMd,
      }
    })
  }, [data])

  const sectionMap = useMemo(() => {
    return new Map(sections.map((section) => [section.sectionKey, section]))
  }, [sections])

  const tocItems = SHEET_ORDER.map((key) => ({
    key,
    title: SHEET_TITLES[key],
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
          title: SHEET_TITLES[key],
          fields,
        },
      ]
    })
  }, [sectionMap])

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <TkcSection>
      <TkcPageHeader title={title} />

      {statusMessage && (
        <p className='text-sm text-white/60'>{statusMessage}</p>
      )}

      <div className='lg:grid lg:grid-cols-[260px_1fr] lg:gap-12'>
        <aside className='hidden lg:block'>
          <div className='sticky top-24'>
            <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg backdrop-blur-md'>
              <p className='text-[11px] font-bold tracking-widest text-[#ff2a00] uppercase'>
                목차
              </p>
              <nav
                aria-label='목차'
                className='mt-5 flex flex-col gap-1 text-sm'
              >
                {tocItems.map((item) => (
                  <a
                    key={item.key}
                    href={`#${item.id}`}
                    className='rounded-lg px-3 py-1.5 text-white/75 transition hover:bg-[#ff2a00]/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#ff2a00]/40 focus-visible:outline-none'
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
    </TkcSection>
  )
}
