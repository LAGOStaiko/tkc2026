# Arcade Tournament Ops System (Mobile Input + Export + Broadcast)

This document describes the full 운영 흐름 requested:

1. 운영자가 스마트폰에서 입력  
2. 운영 DB 스프레드시트(`ops_db_*`)에 즉시 저장  
3. 검수 후 홈페이지 스프레드시트(`arcade_archive_*`)로 내보내기  
4. 내보내기 전에도 DB 기준 송출 화면을 별도 창으로 표시

The structure follows the uploaded qualifier rulebook:

- online score attack (2 songs)
- offline Swiss stage (match logs + standings)
- 3-1 decider
- seeding match
- Top 8 finals A/B seeding + cross matches

## 1) Added API Endpoints

Cloudflare Functions:

- `GET /api/ops/feed`
- `POST /api/ops/upsert`
- `POST /api/ops/export`
- `POST /api/ops/init`

### Auth

- Write endpoints (`upsert/export/init`) require `X-OPS-Key` header.
- Set `OPS_OPERATOR_KEY` in Cloudflare Pages environment variables.

Read endpoint (`feed`) is public so venue broadcast screens can load without secret.

## 2) Added Frontend Pages

- 운영 입력 콘솔: `/ops/arcade-control`
- 송출 창: `/ops/arcade-broadcast?season=2026&region=seoul`

### `/ops/arcade-control`

- 모바일 대응 입력 폼
- 스테이지별 필수 항목만 입력
- DB 저장(업서트), 운영 DB 탭 초기화, 지역/전체 내보내기
- 우측/하단 미리보기:
  - 지역 최종 순위
  - 최신 Swiss 라운드
  - A/B 결선 진출 현황

### `/ops/arcade-broadcast`

- 3초 자동 갱신
- 큰 화면 송출용 레이아웃
- 지역 최종 순위 / 현재 Swiss 라운드 / 결선 진출 상태

## 3) Apps Script Required Patch

Append `docs/apps-script-ops-extension.gs` to your GAS `Code.gs`.

This adds:

- ops DB tab schemas (`ops_db_online`, `ops_db_swiss_matches`, ...)
- `handleOpsInit_`
- `handleOpsUpsert_`
- `handleOpsExport_`
- `handleOpsFeed_`

And then add the following action routes inside your existing `doPost(e)`:

```js
if (action === 'opsInit') return json_(handleOpsInit_(params));
if (action === 'opsUpsert') return json_(handleOpsUpsert_(payload));
if (action === 'opsExport') return json_(handleOpsExport_(payload || params));
if (action === 'opsFeed') return json_(handleOpsFeed_(params));
```

## 4) Cloudflare Env Checklist

Already used:

- `GAS_WEBAPP_URL`
- `GAS_API_KEY`

New:

- `OPS_OPERATOR_KEY` (required for write endpoints)

## 5) Typical Match-Day Flow

1. Open `/ops/arcade-control` on phone.
2. Enter `OPS_OPERATOR_KEY` once.
3. Select season/region.
4. Input rows as tournament runs:
   - `online`
   - `swissMatch`
   - `swissStanding`
   - `decider`
   - `seeding`
   - `qualifier`
   - `finalA/finalB/finalMatch`
5. Open `/ops/arcade-broadcast?...` on venue display for live feed from DB.
6. After review, click:
   - `선택 지역 내보내기` or
   - `시즌 전체 내보내기`
7. Public site pages (`/results`, `/arcade-results/2026/*`) then reflect exported archive data.

## 6) Important Notes

- `opsExport` is idempotent (upsert by key fields). Re-export is safe.
- Public archive and ops DB are separated by design.
- If Apps Script action is missing, `/api/ops/*` will return server error until `Code.gs` patch is deployed.
