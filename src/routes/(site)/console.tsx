import { createFileRoute } from '@tanstack/react-router'
import { SiteContentPage } from '@/features/site/content-page'
import { t } from '@/text'

export const Route = createFileRoute('/(site)/console')({
  component: ConsolePage,
})

function ConsolePage() {
  return <SiteContentPage page='console' title={t('nav.console')} />
}
