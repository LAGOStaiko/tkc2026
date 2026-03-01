# CSP & Security Headers Baseline

> TKC2026 Content Security Policy 운영 기준
> 최종 갱신: 2026-02-11

---

## 1. 고정 보안 디렉티브 (변경 금지)

아래 디렉티브는 **보안 기준선**으로, 완화 PR을 원칙적으로 차단합니다.

| 디렉티브 | 값 | 이유 |
|----------|-----|------|
| `base-uri` | `'self'` | `<base>` 태그 하이재킹 방지 |
| `object-src` | `'none'` | Flash/Java 플러그인 차단 |
| `frame-ancestors` | `'none'` | 클릭재킹 방지 (X-Frame-Options: DENY와 동일) |
| `script-src` | **unsafe-inline / unsafe-eval 절대 금지** | XSS 공격 표면 제거 |

완화가 불가피한 경우 반드시 **보안 검토 + 대안 부재 증명**을 PR에 포함해야 합니다.

---

## 2. 현재 허용 도메인 근거

| 디렉티브 | 도메인 | 서비스 |
|----------|--------|--------|
| `script-src` | `challenges.cloudflare.com` | Turnstile CAPTCHA |
| `style-src` | `fonts.googleapis.com` | Google Fonts CSS |
| `style-src` | `cdn.jsdelivr.net` | Pretendard 폰트 CSS |
| `style-src` | `'unsafe-inline'` | 아래 3절 참조 |
| `font-src` | `fonts.gstatic.com` | Google Fonts 파일 |
| `font-src` | `cdn.jsdelivr.net` | Pretendard 폰트 파일 |
| `img-src` | `i.ytimg.com` | YouTube 썸네일 |
| `connect-src` | `challenges.cloudflare.com` | Turnstile 검증 |
| `frame-src` | `challenges.cloudflare.com` | Turnstile iframe |
| `frame-src` | `www.youtube-nocookie.com` | YouTube 임베드 |

---

## 3. style-src 'unsafe-inline' 현황

**현재 제거 불가.** 아래 의존성이 인라인 스타일을 주입합니다:

- **앱 코드**: JSX `style={{...}}` 80건 이상 (동적 색상, 그라데이션, 너비 계산)
- **Auth UI**: no external auth SDK style injection in current setup
- **Cloudflare Turnstile**: CAPTCHA 위젯 인라인 스타일
- **Sonner**: 토스트 알림 애니메이션/위치 스타일
- **Radix UI**: 포탈 포지셔닝 인라인 스타일

### 제거 로드맵

1. JSX `style={{}}` → Tailwind 클래스 / CSS 변수로 마이그레이션
2. Nonce 기반 CSP로 전환 (빌드 파이프라인 수정 필요)
3. Turnstile nonce 지원 여부 확인 후 적용

---

## 4. worker-src

`worker-src 'self'` — `blob:` 불필요 (Web Worker / Service Worker 미사용).
Worker 도입 시 최소 범위로 재추가.

---

## 5. form-action

`form-action 'self'` — 모든 폼이 JS(fetch/XHR) 기반 제출. HTML `<form action="">` 외부 전송 없음.
현재 외부 인증 iframe은 사용하지 않으므로 `form-action 'self'` 제약에 영향 없음.

---

## 6. CSP 변경 PR 규칙

CSP 관련 변경(디렉티브 추가/수정/삭제) 시 아래를 PR에 **필수 첨부**:

1. **변경 전 브라우저 콘솔 캡처** — 기존 위반 0건 확인
2. **변경 후 브라우저 콘솔 캡처** — 새로운 위반 0건 확인
3. **검증 페이지 목록**:
   - `/` — YouTube 썸네일 로드, 임베드 재생
   - `/apply` — Turnstile CAPTCHA 렌더링
   - `/sign-in` — no external auth dependency page load
4. **변경 사유** — 왜 이 도메인/디렉티브가 필요한지 근거
5. **Report-Only 선 배포** — enforce 전환 전 최소 1회 배포에서 위반 0건 확인

---

## 7. Report-Only → Enforce 전환 체크리스트

현재 CSP는 `Content-Security-Policy-Report-Only` 모드입니다.

- [ ] 배포 후 `/` 홈 — 영상 썸네일(i.ytimg.com) 로드, YouTube 임베드 재생 확인
- [ ] `/apply` — Turnstile CAPTCHA 위젯 정상 렌더링 확인
- [ ] `/sign-in` — no external auth dependency page 정상 로드 확인
- [ ] 브라우저 콘솔에 CSP Report-Only 위반 로그 **0건** 확인
- [ ] 위반 0건 확인 후 `_headers`에서 `Report-Only` → enforce 전환
