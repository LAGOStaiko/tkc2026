import { ko, type TextKey } from './ko'

export type { TextKey }

export const t = (key: TextKey): string => ko[key]
