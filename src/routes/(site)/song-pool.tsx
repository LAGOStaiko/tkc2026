import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { SongPoolPage } from '@/components/tkc/song-pool-page'

const songPoolSearchSchema = z.object({
  tab: z
    .enum(['arcadeSwiss', 'arcadeFinals', 'consoleFinals'])
    .optional()
    .catch(undefined),
})

export const Route = createFileRoute('/(site)/song-pool')({
  validateSearch: songPoolSearchSchema,
  component: SongPoolPage,
})
