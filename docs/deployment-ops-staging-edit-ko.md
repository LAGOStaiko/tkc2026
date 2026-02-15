# TKC2026 운영/테스트/편집 구조 가이드 (200명 동접 기준)

이 문서는 현재 코드 기준으로 운영 페이지, 테스트 페이지, 편집 페이지를 분리해서 운영하는 방법과 동시 접속자 200명 기준 운영 체크리스트를 정리합니다.

## 1) 구조 정의

### 운영 페이지 (Production)
- 대상: 일반 사용자 공개 페이지 (`/(site)/*`)
- 배포 tier: `TKC_ENV_TIER=production`
- 데이터 소스: `GAS_WEBAPP_URL_PRODUCTION` (없으면 `GAS_WEBAPP_URL` 사용)

### 테스트 페이지 (Staging/Preview)
- 대상: 배포 전 QA/리허설 페이지
- 배포 tier: `TKC_ENV_TIER=staging`
- 데이터 소스: `GAS_WEBAPP_URL_STAGING` (없으면 `GAS_WEBAPP_URL` 사용)
- 화면 식별: 헤더에 `TEST` 배지 노출 (`VITE_APP_STAGE=staging` 권장)

### 편집 페이지 (Edit/Ops)
- 대상: 운영 입력/수정 페이지 (`/ops/*`)
- 배포 tier: `TKC_ENV_TIER=edit` 또는 운영 배포에서 `/ops/*` 사용
- 데이터 소스: `GAS_WEBAPP_URL_EDIT` (없으면 production endpoint로 fallback)
- 접근 제어: `OPS_OPERATOR_KEY` 필수 (`X-OPS-Key` 헤더)
- 화면 식별: `/ops/*` 경로에서 헤더 `EDIT` 배지 노출

## 2) 적용된 코드 변경점

- `functions/_lib/gas.ts`
  - `TKC_ENV_TIER` 기반 GAS 엔드포인트 자동 분기
  - `GAS_FETCH_TIMEOUT_MS` 타임아웃 적용
  - 읽기 액션 한정 재시도(`GAS_FETCH_RETRIES`) 적용
- `functions/api/register.ts`
  - rate limit를 환경변수로 조정 가능:
    - `RATE_LIMIT_WINDOW_MS`
    - `RATE_LIMIT_MAX`
    - `RATE_LIMIT_KV_PREFIX`
  - tier별 KV prefix 분리로 운영/테스트 충돌 방지
- `functions/api/songs.ts`, `functions/api/song-pools.ts`
  - 짧은 CDN 캐시 적용으로 burst 트래픽 완화
- `src/components/site-header.tsx`
  - `TEST/EDIT` 환경 배지 노출

## 3) 권장 환경변수

- 공통
  - `GAS_API_KEY`
  - `GAS_FETCH_TIMEOUT_MS=12000`
  - `GAS_FETCH_RETRIES=1`
- 운영 배포
  - `TKC_ENV_TIER=production`
  - `GAS_WEBAPP_URL_PRODUCTION=...`
  - `OPS_OPERATOR_KEY=...`
- 테스트 배포
  - `TKC_ENV_TIER=staging`
  - `GAS_WEBAPP_URL_STAGING=...`
  - `VITE_APP_STAGE=staging`
- 편집 전용(선택)
  - `TKC_ENV_TIER=edit`
  - `GAS_WEBAPP_URL_EDIT=...`

## 4) 200명 동접 운영 체크리스트

- 반드시 적용
  - Turnstile 활성화 (`TURNSTILE_SECRET_KEY`)
  - `/api/register` KV rate limit 사용 (`RATE_LIMIT_KV` 바인딩)
  - read API 캐시 유지 (`site/content/results/songs/song-pools`)
  - staging은 반드시 staging GAS/시트로 분리

- 권장
  - Cloudflare WAF rule로 `/api/register` 추가 제한
  - Ops write API(`/api/ops/*`)에 IP allowlist/Zero Trust 적용
  - 5xx 비율, GAS 응답시간, 등록 실패율 알림 구성
  - 행사 전 load test로 `/api/results`, `/api/songs`, `/api/register` 검증

## 5) 빠른 검증 방법

1. 운영 배포에서 헤더 배지가 보이지 않는지 확인
2. 테스트 배포에서 헤더 `TEST` 배지가 보이는지 확인
3. `/ops/arcade-control`에서 헤더 `EDIT` 배지와 `OPS_OPERATOR_KEY` 인증 확인
4. 테스트 배포에서 입력한 데이터가 운영 시트에 반영되지 않는지 확인
