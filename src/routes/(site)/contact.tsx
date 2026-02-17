import { createFileRoute } from '@tanstack/react-router'
import { ContactPage } from '@/components/tkc/contact-page'

export const Route = createFileRoute('/(site)/contact')({
  component: ContactPage,
})
