import { createFileRoute } from '@tanstack/react-router'
import { SiteContentPage } from '@/features/site/content-page'

export const Route = createFileRoute('/(site)/console')({
  component: ConsolePage,
})

function ConsolePage() {
  return <SiteContentPage page='console' title='Console' />
}
