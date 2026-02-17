import { createFileRoute } from '@tanstack/react-router'
import { ArchivePage } from '@/components/tkc/archive-page'

export const Route = createFileRoute('/(site)/archive')({
  component: ArchivePage,
})
