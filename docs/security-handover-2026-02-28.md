# TKC2026 보안 체계 전달 문서

작성일: 2026-02-28  
대상: 외부 보안/인프라 전문가 전달용  
범위: 신청 페이지, API Functions, 운영(ops) API, 헤더 정책, GAS 연동

## 1) 시스템 개요

- 프론트엔드: React + Vite
- API 계층: Cloudflare Pages Functions (`/functions/api/*`)
- 데이터 계층: Google Apps Script(Web App) 연동
- 인증/비밀값: Cloudflare 환경변수 기반 (`GAS_API_KEY`, `OPS_OPERATOR_KEY`, 선택적으로 Turnstile secret)

## 2) 현재 구현된 보안 체계

### A. 입력/요청 검증

- 신청 폼은 `react-hook-form + zodResolver` 기반 검증을 수행.
- 서버(`functions/api/register.ts`)에서 동일 데이터를 zod 스키마로 재검증.
- 분기형 필수값 검증:
  - `division=console`이면 `videoLink` 필수
  - `division=arcade`이면 `dohirobaNo`, `qualifierRegion`, `offlineSongs(4개)` 필수
  - `isMinor=true`이면 `consentLink` 필수
- `videoLink`, `consentLink`는 `https` URL만 허용.

### B. 자동화 트래픽 제어

- 허니팟 필드(`website`)를 프론트에서 hidden으로 전송하고, 서버에서 값 존재 시 차단.
- Turnstile 토큰 필드(`turnstileToken`)는 현재 코드에 존재.
- 서버는 `TURNSTILE_SECRET_KEY`가 설정된 경우에만 Turnstile 검증을 강제.

### C. Rate Limiting

- 신청 API: IP 기준 제한 적용 (`register:rate-limit`, 기본 10분/30회).
- 읽기 API(`site`, `results`, `content`, `songs`, `song-pools`)도 IP 기준 제한 적용.
- `RATE_LIMIT_KV`가 있으면 KV 기반 카운트, 없으면 isolate 메모리 fallback.

### D. Ops API 인증

- `functions/api/ops/*`는 모두 `requireOpsAuth` 경유.
- 인증 헤더:
  - `X-OPS-Key`
  - 또는 `Authorization: Bearer <token>`
- 서버 기준값: `OPS_OPERATOR_KEY` 환경변수.
- 실패 시 구조화 로그(`ops_auth_failure`)를 남김.

### E. 응답/브라우저 보안 헤더

- 정적 헤더(`public/_headers`):
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy`
  - `X-Content-Type-Options: nosniff`
  - `Permissions-Policy`
- API 응답 공통:
  - JSON 응답 유틸에서 `nosniff`, `Referrer-Policy` 기본 설정.
- `/api/*` 기본 `Cache-Control: no-store` 정책.

### F. 데이터 연동 보호

- Functions -> GAS 호출 시 `GAS_API_KEY`를 payload에 포함해 action 기반 요청.
- GAS 호출은 timeout/retry 정책을 사용(읽기 액션 위주 재시도).
- 스프레드시트 수식 주입 방지:
  - 주요 입력 문자열을 `escapeFormulaField`로 정규화 후 전달.

### G. 캐시 계층

- 읽기 API는 `withEdgeCache`로 Cloudflare edge cache 사용.
- 정상 응답(200)만 캐시 저장.
- API 에러 시 캐시는 fail-open 방식으로 동작.

## 3) Turnstile 관련 현재 상태

- 프론트(`apply-page.tsx`)에는 Turnstile 렌더링/에러 처리/UI 및 token field가 포함되어 있음.
- 백엔드(`register.ts`)는 `TURNSTILE_SECRET_KEY` 존재 시에만 Turnstile 검증을 수행.
- 즉, Turnstile 동작 여부는 프론트 site key + 백엔드 secret 설정 조합으로 결정됨.

## 4) 핵심 엔드포인트 동작 요약

- `GET /api/site`:
  - rate limit + edge cache + GAS `site` action
- `GET /api/results`:
  - rate limit + edge cache + GAS `results` action
- `GET /api/content?page=...`:
  - page allowlist 검증 + rate limit + edge cache + GAS `content` action
- `POST /api/register`:
  - rate limit + JSON/스키마 검증 + 허니팟 검사 + (조건부 Turnstile) + sanitize + GAS `register`
- `GET/POST /api/ops/*`:
  - 공통 ops key 인증 후 action 수행

## 5) 전문가에게 함께 전달할 환경변수 키 목록

- `GAS_API_KEY`
- `GAS_WEBAPP_URL` (또는 tier별 `GAS_WEBAPP_URL_PRODUCTION`, `GAS_WEBAPP_URL_STAGING`, `GAS_WEBAPP_URL_EDIT`)
- `TKC_ENV_TIER`
- `RATE_LIMIT_KV` (바인딩 시)
- `OPS_OPERATOR_KEY`
- `TURNSTILE_SECRET_KEY` (Turnstile 사용 시)
- 프론트: `VITE_TURNSTILE_SITE_KEY` (Turnstile 사용 시)

## 6) 참고

- 세부 파일 목록은 `docs/security-file-map.md` 참조.
