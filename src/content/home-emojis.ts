export type HomeEmojiKey =
  | 'advance'
  | 'champion'
  | 'details'
  | 'eliminated'
  | 'info'
  | 'match'
  | 'photo'
  | 'playoff'
  | 'rank-1'
  | 'rank-2'
  | 'song-pick'
  | 'stadium'
  | 'summary'
  | 'tie'
  | 'warning'

export type HomeEmojiAsset = {
  key: HomeEmojiKey
  label: string
  png: string
  webp: string
}

export const HOME_EMOJIS: Record<HomeEmojiKey, HomeEmojiAsset> = {
  advance: {
    key: 'advance',
    label: 'Advance',
    png: '/branding/v2/emojis/png/advance.png',
    webp: '/branding/v2/emojis/webp/advance.webp',
  },
  champion: {
    key: 'champion',
    label: 'Champion',
    png: '/branding/v2/emojis/png/champion.png',
    webp: '/branding/v2/emojis/webp/champion.webp',
  },
  details: {
    key: 'details',
    label: 'Details',
    png: '/branding/v2/emojis/png/details.png',
    webp: '/branding/v2/emojis/webp/details.webp',
  },
  eliminated: {
    key: 'eliminated',
    label: 'Eliminated',
    png: '/branding/v2/emojis/png/eliminated.png',
    webp: '/branding/v2/emojis/webp/eliminated.webp',
  },
  info: {
    key: 'info',
    label: 'Info',
    png: '/branding/v2/emojis/png/info.png',
    webp: '/branding/v2/emojis/webp/info.webp',
  },
  match: {
    key: 'match',
    label: 'Match',
    png: '/branding/v2/emojis/png/match.png',
    webp: '/branding/v2/emojis/webp/match.webp',
  },
  photo: {
    key: 'photo',
    label: 'Photo',
    png: '/branding/v2/emojis/png/photo.png',
    webp: '/branding/v2/emojis/webp/photo.webp',
  },
  playoff: {
    key: 'playoff',
    label: 'Playoff',
    png: '/branding/v2/emojis/png/playoff.png',
    webp: '/branding/v2/emojis/webp/playoff.webp',
  },
  'rank-1': {
    key: 'rank-1',
    label: 'Rank 1',
    png: '/branding/v2/emojis/png/rank-1.png',
    webp: '/branding/v2/emojis/webp/rank-1.webp',
  },
  'rank-2': {
    key: 'rank-2',
    label: 'Rank 2',
    png: '/branding/v2/emojis/png/rank-2.png',
    webp: '/branding/v2/emojis/webp/rank-2.webp',
  },
  'song-pick': {
    key: 'song-pick',
    label: 'Song Pick',
    png: '/branding/v2/emojis/png/song-pick.png',
    webp: '/branding/v2/emojis/webp/song-pick.webp',
  },
  stadium: {
    key: 'stadium',
    label: 'Stadium',
    png: '/branding/v2/emojis/png/stadium.png',
    webp: '/branding/v2/emojis/webp/stadium.webp',
  },
  summary: {
    key: 'summary',
    label: 'Summary',
    png: '/branding/v2/emojis/png/summary.png',
    webp: '/branding/v2/emojis/webp/summary.webp',
  },
  tie: {
    key: 'tie',
    label: 'Tie',
    png: '/branding/v2/emojis/png/tie.png',
    webp: '/branding/v2/emojis/webp/tie.webp',
  },
  warning: {
    key: 'warning',
    label: 'Warning',
    png: '/branding/v2/emojis/png/warning.png',
    webp: '/branding/v2/emojis/webp/warning.webp',
  },
}

export const HOME_EMOJI_LIST = Object.values(HOME_EMOJIS)
