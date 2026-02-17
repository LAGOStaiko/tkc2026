const SAFE_SCHEMES = ['https:', 'mailto:']

/**
 * Returns the URL if its scheme is safe (https: or mailto:), otherwise returns fallback.
 * Blocks javascript:, data:, vbscript:, and any other non-safe schemes.
 */
export function sanitizeUrl(
  url: string | undefined | null,
  fallback = '#'
): string {
  if (!url || typeof url !== 'string') return fallback

  const trimmed = url.trim()
  if (!trimmed) return fallback

  try {
    const parsed = new URL(trimmed)
    if (SAFE_SCHEMES.includes(parsed.protocol)) return trimmed
    return fallback
  } catch {
    return fallback
  }
}

/**
 * For img src: allow https: and same-origin relative paths (starting with /).
 */
export function sanitizeImgSrc(
  url: string | undefined | null,
  fallback = ''
): string {
  if (!url || typeof url !== 'string') return fallback

  const trimmed = url.trim()
  if (!trimmed) return fallback

  if (trimmed.startsWith('/')) return trimmed

  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === 'https:') return trimmed
    return fallback
  } catch {
    return fallback
  }
}
