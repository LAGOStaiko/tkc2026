export type TournamentPhoto = {
  id: number
  url: string | null
  caption: string
}

export type TournamentPlacement = {
  name: string
  title: string
}

export type TournamentTop4 = {
  rank: 3 | 4
  name: string
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
  top4: TournamentTop4[]
  finalSong: string
  photos: TournamentPhoto[]
  accent: string
}

export const PAST_TOURNAMENTS: PastTournament[] = [
  {
    id: 'tkc2024',
    year: '2024',
    title: 'Taiko Korea Championship 2024',
    titleKr: '제1회 태고 코리아 챔피언십',
    subtitle: '꿈의 시작',
    date: '2024.09.14 — 09.15',
    venue: '서울특별시',
    participants: 64,
    champion: { name: 'Player_A', title: '우승 / Champion' },
    runnerUp: { name: 'Player_B', title: '준우승 / Runner-up' },
    top4: [
      { rank: 3, name: 'Player_C' },
      { rank: 4, name: 'Player_D' },
    ],
    finalSong: '夏祭り',
    photos: [
      { id: 1, url: null, caption: '결승전 현장' },
      { id: 2, url: null, caption: '참가자 단체사진' },
      { id: 3, url: null, caption: '시상식' },
      { id: 4, url: null, caption: '대회장 전경' },
      { id: 5, url: null, caption: '예선 풍경' },
      { id: 6, url: null, caption: '관객석' },
    ],
    accent: '#E63B2E',
  },
  {
    id: 'tkc2025',
    year: '2025',
    title: 'Taiko Korea Championship 2025',
    titleKr: '제2회 태고 코리아 챔피언십',
    subtitle: '꿈에서 현실로',
    date: '2025.08.23 — 08.24',
    venue: '부산광역시',
    participants: 96,
    champion: { name: 'Player_E', title: '우승 / Champion' },
    runnerUp: { name: 'Player_F', title: '준우승 / Runner-up' },
    top4: [
      { rank: 3, name: 'Player_G' },
      { rank: 4, name: 'Player_H' },
    ],
    finalSong: '第六天魔王',
    photos: [
      { id: 1, url: null, caption: '부산 대회장' },
      { id: 2, url: null, caption: '결승 무대' },
      { id: 3, url: null, caption: '라이브 스트리밍' },
      { id: 4, url: null, caption: '우승 세레모니' },
      { id: 5, url: null, caption: '참가자 교류' },
      { id: 6, url: null, caption: '시상식' },
    ],
    accent: '#3B8BE6',
  },
]
