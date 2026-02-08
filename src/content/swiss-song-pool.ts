export type SwissSongEntry = {
  title: string
  oni: number
  ura?: number
}

export const SWISS_SONG_POOL: SwissSongEntry[] = [
  { title: 'きみのあかり', oni: 5, ura: 8 },
  { title: '鏡の国のアリス', oni: 6, ura: 8 },
  { title: 'タイムトラベラー', oni: 6 },
  { title: 'ナツモノ☆', oni: 6 },
  { title: 'Growing Up', oni: 6 },
  { title: '虹色・夢色・太鼓色', oni: 6 },
  { title: '想いを手に願いを込めて', oni: 7 },
  { title: 'さいたま2000', oni: 7 },
  { title: 'Mood Swing', oni: 7 },
  { title: 'Aloft in the wind', oni: 7 },
  { title: 'Emma', oni: 7 },
  { title: 'Hello, Worldooon!!', oni: 7 },
  { title: 'Fly again!', oni: 7 },
  { title: 'フリフリ♪ノリノリ♪', oni: 7, ura: 9 },
  { title: '願いはエスペラント', oni: 7 },
  { title: 'ねぇ教えて', oni: 7 },
  { title: '駄々っ子モンスター', oni: 7 },
  { title: 'ゴーゴー・キッチン', oni: 7 },
  { title: 'Fly away', oni: 7 },
  { title: '季曲', oni: 7, ura: 8 },
  { title: '黒神クロニクル', oni: 7 },
  { title: 'スポーツダイジェスドン', oni: 7, ura: 9 },
  { title: '伝説の祭り', oni: 7 },
  { title: 'メカデス。', oni: 7 },
  { title: 'カラメルタイム☆', oni: 8 },
  { title: '東京特許キョ許可局局長!!', oni: 8 },
  { title: 'Phantom Rider', oni: 8, ura: 9 },
  { title: '月影SASURAI', oni: 8, ura: 9 },
  { title: '化物月夜', oni: 8 },
  { title: 'エリンギのエクボ', oni: 8 },
  { title: 'オレサマパイレーツ', oni: 8 },
  { title: 'Amanda', oni: 8 },
  { title: 'Donder Time', oni: 8 },
  { title: "The Magician's Dream", oni: 8 },
  { title: 'エンジェル ドリーム', oni: 8 },
  { title: 'Day by Day!', oni: 8 },
  { title: 'がしゃどくろ', oni: 8 },
  { title: '恋幻想(Love Fantasy)', oni: 8 },
  { title: 'めたるぽりす', oni: 9, ura: 9 },
  { title: '氷竜 ～Kooryu～', oni: 9 },
  { title: 'ユースフルコースター', oni: 9 },
  { title: 'よくでる2000', oni: 9 },
  { title: '少女の神の粒子', oni: 9 },
  { title: "GO GET'EM!", oni: 9, ura: 9 },
  { title: 'Turquoise Tachometer', oni: 9 },
  { title: 'DIMENSIONS', oni: 9 },
  { title: '女帝 ～インバラトゥーラ～', oni: 9 },
  { title: 'Amber Light', oni: 9 },
  { title: '電子ドラムの達人', oni: 9 },
  { title: 'Solitude Star', oni: 9 },
  { title: 'パラレルロリポップ', oni: 9 },
  { title: '初音ミクの消失‐劇場版‐', oni: 9 },
  { title: '歌劇「リコレクトブルー', oni: 9 },
  { title: 'リトルホワイトウィッチ', oni: 9 },
  { title: '天妖ノ舞', oni: 9 },
  { title: '秋竜 ～Shiuryu～', oni: 9 },
  { title: '魔方陣 ‐サモン・デルタ‐', oni: 9 },
  { title: '亜空間遊泳ac12.5', oni: 9 },
  { title: 'はやさいたま2000', oni: 9 },
  { title: 'EDY ‐エレクトリカルダンシングヨガ‐', oni: 9 },
  { title: 'メヌエット', oni: 9 },
  { title: 'いっそこのままで', oni: 9 },
  { title: 'サラえる', oni: 9 },
  { title: '凛', oni: 9 },
  { title: '太鼓乱舞 皆伝', oni: 8 },
  { title: '黄泉のイザナミ', oni: 8 },
  { title: 'LOVE戦!!', oni: 8, ura: 9 },
  { title: 'Choco Chiptune.', oni: 8 },
  { title: 'クルクルクロックル', oni: 8 },
  { title: '夢色コースター', oni: 8 },
]

export type SwissSongOption = {
  /** Select value: "曲名|oni|5" 또는 "曲名|ura|8" */
  value: string
  /** UI 표시: "曲名 (귀신 ★5)" */
  label: string
  title: string
  difficulty: 'oni' | 'ura'
  level: number
}

const DIFF_LABEL = { oni: '귀신', ura: '뒷보면' } as const

export function buildSongOptions(pool: SwissSongEntry[]): SwissSongOption[] {
  const options: SwissSongOption[] = []
  for (const entry of pool) {
    options.push({
      value: `${entry.title}|oni|${entry.oni}`,
      label: `${entry.title} (${DIFF_LABEL.oni} ★${entry.oni})`,
      title: entry.title,
      difficulty: 'oni',
      level: entry.oni,
    })
    if (entry.ura !== undefined) {
      options.push({
        value: `${entry.title}|ura|${entry.ura}`,
        label: `${entry.title} (${DIFF_LABEL.ura} ★${entry.ura})`,
        title: entry.title,
        difficulty: 'ura',
        level: entry.ura,
      })
    }
  }
  return options
}

/** "title|difficulty|level" 형식 문자열을 파싱 */
export function parseSongOption(value: string): SwissSongOption | null {
  const parts = value.split('|')
  if (parts.length !== 3) return null
  const [title, diff, levelStr] = parts
  if (diff !== 'oni' && diff !== 'ura') return null
  const level = Number(levelStr)
  if (!title || isNaN(level)) return null
  return {
    value,
    label: `${title} (${DIFF_LABEL[diff]} ★${level})`,
    title,
    difficulty: diff,
    level,
  }
}

/** value 문자열에서 곡 제목만 추출 */
export function parseSongTitle(value: string): string {
  return value.split('|')[0] ?? value
}
