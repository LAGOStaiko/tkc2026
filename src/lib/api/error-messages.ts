const CONTACT_HELP =
  '문제가 계속되면 @taikolabs (X) 또는 tkc@taikolabs.kr로 문의해 주세요.'

const ERROR_MAP: Record<string, string> = {
  'Content-Type must be application/json':
    '요청 형식에 문제가 있습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
  'Invalid request context':
    '비정상적인 접근으로 차단되었습니다. 주소창에서 직접 사이트에 접속한 뒤 다시 신청해 주세요. 계속 안 되면 VPN을 끄거나 다른 브라우저에서 시도해 보세요.',
  'Too many requests':
    '요청이 너무 많아 일시적으로 제한되었습니다. 잠시 후 다시 시도해 주세요.',
  'Request body is too large':
    '입력 내용이 너무 깁니다. 각 항목을 짧게 줄인 뒤 다시 시도해 주세요.',
  'Payload Too Large':
    '입력 내용이 너무 깁니다. 각 항목을 짧게 줄인 뒤 다시 시도해 주세요.',
  'Invalid JSON body':
    '요청 형식에 문제가 있습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.',

  'name is required': '이름을 입력해 주세요.',
  'phone is required': '전화번호를 입력해 주세요.',
  'valid email is required': '올바른 이메일 주소를 입력해 주세요.',
  'nickname is required': '동더 네임을 입력해 주세요.',
  'namcoId is required': '남코 아이디를 입력해 주세요.',
  'privacyAgree must be true': '개인정보 수집 및 이용에 동의해 주세요.',
  'Bot detected':
    '보안 인증에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요.',
  'videoLink is required for console division':
    '콘솔 부문은 동영상 링크가 필요합니다. 링크를 입력해 주세요.',
  'dohirobaNo is required for arcade division':
    '아케이드 부문은 동더 광장 북번호가 필요합니다. 북번호를 입력해 주세요.',
  'qualifierRegion is required for arcade division':
    '아케이드 부문은 온라인 예선 차수를 선택해야 합니다.',
  '4 offline songs are required for arcade division':
    '오프라인 예선곡 4곡을 모두 선택해 주세요.',
  'consentLink is required when isMinor=true':
    '미성년자는 보호자 동의서 링크를 첨부해야 합니다.',
  'videoLink must use https':
    '동영상 링크가 올바르지 않습니다. https://로 시작하는 전체 주소를 붙여넣어 주세요.',
  'videoLink must be a valid URL':
    '동영상 링크가 올바르지 않습니다. https://로 시작하는 전체 주소를 붙여넣어 주세요.',
  'consentLink must use https':
    '동의서 링크가 올바르지 않습니다. https://로 시작하는 전체 주소를 붙여넣어 주세요.',
  'consentLink must be a valid URL':
    '동의서 링크가 올바르지 않습니다. https://로 시작하는 전체 주소를 붙여넣어 주세요.',

  'Security verification is unavailable':
    `보안 인증 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요. ${CONTACT_HELP}`,
  'Turnstile verification required':
    '보안 인증 정보가 전달되지 않았습니다. 페이지를 새로고침한 뒤 인증을 다시 진행해 주세요.',
  'Turnstile verification failed':
    '보안 인증에 실패했습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요. 계속 안 되면 광고 차단·VPN을 잠시 꺼 보세요.',
  'Turnstile verification unavailable':
    '보안 인증 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',

  'Internal Server Error':
    `서버에 일시적인 문제가 있습니다. 잠시 후 다시 시도해 주세요. ${CONTACT_HELP}`,
  'Request timed out':
    '응답이 늦어지고 있습니다. 네트워크 상태를 확인하고 잠시 후 다시 시도해 주세요.',
  'Invalid JSON response':
    `서버 응답을 처리할 수 없습니다. 페이지를 새로고침한 뒤 다시 시도해 주세요. ${CONTACT_HELP}`,
}

const FALLBACK_MESSAGE = `신청 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. ${CONTACT_HELP}`

export function toUserMessage(raw: string): string {
  const message = String(raw ?? '').trim()
  if (!message) return FALLBACK_MESSAGE

  if (ERROR_MAP[message]) return ERROR_MAP[message]

  if (
    message.includes('Too big:') ||
    message.includes('Invalid option:') ||
    message.includes('Invalid input:')
  ) {
    return '입력값이 올바르지 않습니다. 내용을 확인한 뒤 다시 시도해 주세요.'
  }

  if (message.includes('DUPLICATE_ENTRY') || message.includes('이미 같은')) {
    return '이미 같은 조건으로 신청된 내역이 있습니다. 기존 신청 내용을 확인해 주세요.'
  }

  return FALLBACK_MESSAGE
}
