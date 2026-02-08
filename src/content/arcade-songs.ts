export const ARCADE_SONGS = {
  online1: { title: 'うそうそ時', level: 8 },
  online2: { title: '輝きを求めて', level: 8 },
  decider31: { title: '大空と太鼓の踊り', level: 9 },
  seeding: { title: 'タイコロール', level: 10 },
} as const

export type ArcadeSongKey = keyof typeof ARCADE_SONGS

/** "曲名 (★N)" 형식 문자열 생성 */
export function formatSongLabel(key: ArcadeSongKey): string {
  const s = ARCADE_SONGS[key]
  return `${s.title} (★${s.level})`
}
