import { createFileRoute } from '@tanstack/react-router'
import { ApplyPage } from '@/components/tkc/apply-page'

export const Route = createFileRoute('/(site)/apply')({
  component: ApplyPage,
})
