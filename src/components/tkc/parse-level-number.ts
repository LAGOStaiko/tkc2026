export function parseLevelNumber(value: string): number | null {
  const match = value.match(/(\d+)/)
  if (!match) return null

  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : null
}
