# TKC2026 보안 관련 파일 맵

작성일: 2026-02-28  
용도: 전문가 전달 시 파일 역할을 빠르게 파악하기 위한 인덱스

## 1) 신청/입력 계층

| 파일 | 역할 |
|---|---|
| `src/components/tkc/apply-page.tsx` | 신청 폼 UI, 프론트 검증, 허니팟/Turnstile 토큰 처리, 제출 흐름 |
| `src/lib/api/index.ts` | 프론트 API 요청 유틸, timeout 처리, 읽기 API 캐시/재시도 정책 |
| `shared/register-limits.ts` | 신청 payload 각 필드 길이 제한 상수 |

## 2) 신청 API 및 공통 보안 유틸

| 파일 | 역할 |
|---|---|
| `functions/api/register.ts` | 신청 API 본체: rate limit, 스키마 검증, 허니팟 검사, 조건부 Turnstile 검증, sanitize, GAS 등록 호출 |
| `functions/_lib/rate-limit.ts` | IP rate limiting(KV 기반 + 메모리 fallback) |
| `functions/_lib/sanitize.ts` | 스프레드시트 formula injection 방지 문자열 처리 |
| `functions/_lib/response.ts` | JSON 응답 래퍼, 공통 보안 헤더(`nosniff`, `Referrer-Policy`) |
| `functions/_lib/gas.ts` | GAS endpoint 선택, timeout/retry, action 호출 공통화 |
| `functions/_lib/edge-cache.ts` | Cloudflare edge cache 래퍼 |

## 3) 읽기 API

| 파일 | 역할 |
|---|---|
| `functions/api/site.ts` | 사이트 설정 조회 API (`site`) |
| `functions/api/results.ts` | 결과 조회 API (`results`) |
| `functions/api/content.ts` | 페이지 콘텐츠 조회 API (`content`) + page allowlist |
| `functions/api/songs.ts` | 곡 목록 조회 API (`showcaseSongs`) |
| `functions/api/song-pools.ts` | 송풀 조회 API (`songPools`) |
| `functions/api/broadcast.ts` | 방송/피드 관련 공개 데이터 조회 API |

## 4) Ops 인증/운영 API

| 파일 | 역할 |
|---|---|
| `functions/_lib/ops-auth.ts` | 운영 API 키 인증(`X-OPS-Key`, `Authorization Bearer`) |
| `functions/api/ops/feed.ts` | 운영 피드 조회 |
| `functions/api/ops/upsert.ts` | 운영 데이터 upsert |
| `functions/api/ops/export.ts` | 운영 데이터 export |
| `functions/api/ops/init.ts` | 운영 초기화 |
| `functions/api/ops/guide.ts` | 운영 가이드 시트 처리 |
| `functions/api/ops/validate.ts` | 운영 검증 |
| `functions/api/ops/publish.ts` | 운영 publish |
| `functions/api/ops/rollback.ts` | 운영 rollback |
| `functions/api/ops/snapshots.ts` | 스냅샷 목록 |
| `functions/api/ops/publish-log.ts` | publish 로그 조회 |
| `functions/api/ops/pub-commit.ts` | publish commit |

## 5) 정책/운영 문서

| 파일 | 역할 |
|---|---|
| `public/_headers` | 정적 및 `/api/*` 공통 보안/캐시 헤더 정책 |
| `docs/csp-security-baseline.md` | CSP 정책 설명 문서 |
| `docs/arcade-ops-system.md` | 운영 시스템 구조 설명 |
| `docs/deployment-ops-staging-edit-ko.md` | 환경 분리/배포 운영 문서 |

## 6) 전달 우선순위(최소 세트)

1. `src/components/tkc/apply-page.tsx`
2. `functions/api/register.ts`
3. `functions/_lib/rate-limit.ts`
4. `functions/_lib/ops-auth.ts`
5. `functions/_lib/sanitize.ts`
6. `functions/_lib/gas.ts`
7. `public/_headers`
8. `docs/security-handover-2026-02-28.md`
