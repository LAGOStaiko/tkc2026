import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ARCADE_RULEBOOK_SECTIONS } from '@/content/arcade-rulebook'
import { t } from '@/text'
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
        className='text-sm leading-relaxed break-keep text-white/90 md:text-base md:leading-7'
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
        className='text-sm leading-relaxed break-keep text-white/90 md:text-base md:leading-7'
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
  table: (props) => {
    const rest = omitNode(props)
    return (
      <div className='-mx-4 overflow-x-auto px-4'>
        <Table className='min-w-[560px] text-sm md:text-base'>
          {rest.children}
        </Table>
      </div>
    )
  },
  thead: (props) => {
    const rest = omitNode(props)
    return <TableHeader className='bg-white/5 text-white/70' {...rest} />
  },
  tbody: (props) => {
    const rest = omitNode(props)
    return <TableBody className='text-white/85' {...rest} />
  },
  tr: (props) => {
    const rest = omitNode(props)
    return <TableRow className='border-white/10 hover:bg-white/5' {...rest} />
  },
  th: (props) => {
    const rest = omitNode(props)
    return (
      <TableHead
        className='border-white/10 px-3 py-2 text-xs font-semibold whitespace-normal text-white/70 md:text-sm'
        {...rest}
      />
    )
  },
  td: (props) => {
    const rest = omitNode(props)
    return (
      <TableCell
        className='border-white/10 px-3 py-2 align-top text-sm whitespace-normal text-white/85 md:text-base'
        {...rest}
      />
    )
  },
  hr: () => <hr className='border-white/10' />,
}

function ArcadePage() {
  const title = t('nav.arcade')

  useEffect(() => {
    document.title = `${t('meta.siteName')} | ${title}`
  }, [title])

  return (
    <TkcSection>
      <TkcPageHeader
        title={title}
        subtitle='예선부터 결선까지 운영 문서를 기준으로 핵심 규정을 정리했습니다.'
      />

      <div className='lg:grid lg:grid-cols-[260px_1fr] lg:gap-10'>
        <aside className='hidden lg:block'>
          <div className='sticky top-24'>
            <div className='rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg backdrop-blur-md'>
              <p className='text-xs font-semibold tracking-[0.24em] text-white/60 uppercase'>
                Rule Index
              </p>
              <nav className='mt-4 flex flex-col gap-2 text-sm text-white/80'>
                {ARCADE_RULEBOOK_SECTIONS.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className='rounded-lg px-2 py-1 transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:outline-none'
                  >
                    {section.title}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        <div className='space-y-10 md:space-y-12'>
          {ARCADE_RULEBOOK_SECTIONS.map((section) => (
            <TkcRuleSheet
              key={section.id}
              id={section.id}
              className='scroll-mt-24'
              title={section.title}
            >
              {section.fields.map((field, index) => (
                <TkcField
                  key={`${section.id}-${index}`}
                  label={field.label}
                  note={field.note}
                  badges={field.badges}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {field.bodyMd}
                  </ReactMarkdown>
                </TkcField>
              ))}
            </TkcRuleSheet>
          ))}
        </div>
      </div>
    </TkcSection>
  )
}
