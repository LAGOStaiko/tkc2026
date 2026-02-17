import { createFileRoute } from '@tanstack/react-router'
import { SongPoolPage } from '@/components/tkc/song-pool-page'

export const Route = createFileRoute('/(site)/song-pool')({
  component: SongPoolPage,
})
