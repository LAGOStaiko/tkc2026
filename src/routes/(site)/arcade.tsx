import { createFileRoute } from '@tanstack/react-router'
import { SiteContentPage } from '@/features/site/content-page'
import { t } from '@/text'

export const Route = createFileRoute('/(site)/arcade')({
  component: ArcadePage,
})

function ArcadePage() {
  return <SiteContentPage page='arcade' title={t('nav.arcade')} />
}
