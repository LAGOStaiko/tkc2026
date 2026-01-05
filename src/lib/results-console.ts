const ENTRY_ID_REGEX = /E-\d+/i
const S1_REGEX = /s1\s*[:=]\s*([\d,]+)/i
const S2_REGEX = /s2\s*[:=]\s*([\d,]+)/i

const toNumber = (value?: string) => {
  if (!value) return undefined
  const numeric = Number(value.replace(/,/g, ''))
  return Number.isFinite(numeric) ? numeric : undefined
}

export function extractEntryId(
  nickname?: string,
  detail?: string
): string | undefined {
  const detailMatch = detail?.match(ENTRY_ID_REGEX)?.[0]
  if (detailMatch) return detailMatch.toUpperCase()

  const nicknameMatch = nickname?.match(ENTRY_ID_REGEX)?.[0]
  if (nicknameMatch) return nicknameMatch.toUpperCase()

  return undefined
}

export function formatNicknameWithEntryId(
  nickname?: string,
  entryId?: string
) {
  const name = nickname?.trim()
  if (!name && entryId) return entryId
  if (!name) return '-'
  if (!entryId) return name
  if (name.includes(entryId)) return name
  return `${name} (${entryId})`
}

export function extractController(detail?: string) {
  if (!detail) return ''
  const text = detail.toLowerCase()
  if (
    text.includes('\uC870\uC774\uCF58') ||
    text.includes('\uC870\uC774 \uCF58') ||
    text.includes('joy')
  ) {
    return '\uC870\uC774\uCF58'
  }
  if (text.includes('\uBD81')) {
    return '\uBD81'
  }
  return ''
}

export function extractS1S2(detail?: string) {
  if (!detail) return {}
  const s1Match = detail.match(S1_REGEX)
  const s2Match = detail.match(S2_REGEX)
  return {
    s1: s1Match ? toNumber(s1Match[1]) : undefined,
    s2: s2Match ? toNumber(s2Match[1]) : undefined,
  }
}
