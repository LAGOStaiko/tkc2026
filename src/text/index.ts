import { ko, type TextKey } from './ko'

export const t = (key: TextKey): string => ko[key]
