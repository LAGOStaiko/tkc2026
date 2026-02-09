export type TournamentPhoto = {
  id: number
  url: string | null
  caption: string
}

export type TournamentPlacement = {
  name: string
  title: string
}

export type PastTournament = {
  id: string
  year: string
  title: string
  titleKr: string
  subtitle: string
  date: string
  venue: string
  participants: number
  champion: TournamentPlacement
  runnerUp: TournamentPlacement
  finalSong?: string
  note?: string
  photos: TournamentPhoto[]
  accent: string
}

export const PAST_TOURNAMENTS: PastTournament[] = [
  {
    id: 'kungddak2019',
    year: '2019',
    title: '쿵딱전 in PlayX4',
    titleKr: '쿵딱전 in PlayX4',
    subtitle: '',
    date: '2019.05.11',
    venue: '킨텍스',
    participants: 8,
    champion: { name: '세상', title: '우승 / Champion' },
    runnerUp: { name: '뉴트리노개미', title: '준우승 / Runner-up' },
    photos: [],
    accent: '#F5A623',
  },
  {
    id: 'tpt2024',
    year: '2024',
    title: 'Taiko PlayX4 Tournament 2024',
    titleKr: 'TPT2024',
    subtitle: '개인전 + 팀전',
    date: '2024.05.25',
    venue: '킨텍스',
    participants: 8,
    champion: { name: '세상', title: '개인전 우승 / Individual Champion' },
    runnerUp: {
      name: '사쿠라기',
      title: '개인전 준우승 / Individual Runner-up',
    },
    note: '팀전: TEAM A 승리',
    photos: [],
    accent: '#3B8BE6',
  },
]
