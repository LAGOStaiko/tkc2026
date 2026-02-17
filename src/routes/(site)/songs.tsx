import { createFileRoute } from '@tanstack/react-router'
import { SongsPage } from '@/components/tkc/songs-page'

export const Route = createFileRoute('/(site)/songs')({
  component: SongsPage,
})
