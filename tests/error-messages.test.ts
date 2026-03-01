import { describe, expect, it } from 'vitest'
import { toUserMessage } from '../src/lib/api/error-messages'

describe('toUserMessage', () => {
  it('maps exact known server message', () => {
    const result = toUserMessage('Turnstile verification failed')
    expect(result).toContain('보안 인증에 실패했습니다.')
    expect(result).toContain('광고 차단·VPN')
  })

  it('maps variable zod messages by includes', () => {
    const result = toUserMessage(
      'Too big: expected string to have <=100 characters'
    )
    expect(result).toBe(
      '입력값이 올바르지 않습니다. 내용을 확인한 뒤 다시 시도해 주세요.'
    )
  })

  it('maps duplicate entry patterns', () => {
    const result = toUserMessage('DUPLICATE_ENTRY')
    expect(result).toContain('이미 같은 조건으로 신청된 내역이 있습니다.')
  })

  it('falls back with contact guidance', () => {
    const result = toUserMessage('some unknown error')
    expect(result).toContain('신청 중 오류가 발생했습니다.')
    expect(result).toContain('@taikolabs (X)')
    expect(result).toContain('tkc@taikolabs.kr')
  })
})
