import { createFileRoute } from '@tanstack/react-router'
import { SchedulePage } from '@/components/tkc/schedule-page'

export const Route = createFileRoute('/(site)/schedule')({
  component: SchedulePage,
})
