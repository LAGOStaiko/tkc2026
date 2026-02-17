import { createFileRoute } from '@tanstack/react-router'
import { ResultsHubPage } from '@/components/tkc/results-hub-page'

export const Route = createFileRoute('/(site)/results')({
  component: ResultsHubPage,
})
