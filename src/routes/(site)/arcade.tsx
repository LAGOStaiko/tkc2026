import { createFileRoute } from '@tanstack/react-router'
import { SiteContentPage } from '@/features/site/content-page'

export const Route = createFileRoute('/(site)/arcade')({
  component: ArcadePage,
})

function ArcadePage() {
  return <SiteContentPage page='arcade' title='Arcade' />
}
