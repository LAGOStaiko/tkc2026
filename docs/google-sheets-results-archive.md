# Google Spreadsheet Integration for Results Archive

This project already reads data from `/api/results`.
The `/api/results` endpoint is a Cloudflare Pages Function that proxies to Google Apps Script (`action: "results"`).

## 1) Runtime Env (Cloudflare)

Set these environment variables in Cloudflare Pages:

- `GAS_WEBAPP_URL` = deployed Apps Script Web App URL (e.g. `https://script.google.com/macros/s/.../exec`)
- `GAS_API_KEY` = shared secret (same value in GAS Script Properties `API_KEY`)

Optional for local Vite dev:

- `VITE_API_PROXY_TARGET` in `.env` to control where `/api/*` is proxied.

Example `.env`:

```env
VITE_API_PROXY_TARGET=https://tkc2026.pages.dev
```

## 2) Apps Script `results` response

`action: "results"` should return existing `console/arcade` data and the new archive payload:

```json
{
  "ok": true,
  "data": {
    "console": [],
    "arcade": [],
    "arcadeArchive2026": {
      "season": "2026",
      "title": "아케이드 예선 아카이브",
      "songs": {
        "online1": "うそうそ時 (Lv.8)",
        "online2": "輝きを求めて (Lv.8)",
        "decider31": "大空と太鼓の踊り (Lv.9)",
        "seeding": "タイコロール (Lv.10)"
      },
      "regions": [],
      "finals": {
        "groupASeeds": [],
        "groupBSeeds": [],
        "crossMatches": []
      }
    }
  }
}
```

The frontend parser (`src/lib/arcade-results-archive.ts`) consumes this shape.

## 3) Optional Spreadsheet Tabs for archive

The Apps Script file can read the following optional tabs and build `arcadeArchive2026`:

- `arcade_archive_online`
- `arcade_archive_swiss_matches`
- `arcade_archive_swiss_standings`
- `arcade_archive_decider`
- `arcade_archive_seeding`
- `arcade_archive_qualifiers`
- `arcade_archive_finals_a`
- `arcade_archive_finals_b`
- `arcade_archive_finals_matches`

Recommended core columns:

- `season`, `region`

### `arcade_archive_online`

- `rank`, `entryId`, `nickname`, `score1`, `score2`, `total`, `submittedAt`, `advanced`

### `arcade_archive_swiss_matches`

- `round`, `table`, `highSeedEntryId`
- `p1EntryId`, `p1Nickname`, `p1Seed`
- `p2EntryId`, `p2Nickname`, `p2Seed`
- `song1`, `level1`, `p1Score1`, `p2Score1`
- `song2`, `level2`, `p1Score2`, `p2Score2`
- optional: `song3`, `level3`, `p1Score3`, `p2Score3`
- `winnerEntryId`, `tieBreakerSong`, `bye`, `note`

### `arcade_archive_swiss_standings`

- `entryId`, `nickname`, `seed`, `wins`, `losses`, `status`
- `status` in: `alive | qualified | decider | eliminated`

### `arcade_archive_decider`

- `rank`, `entryId`, `nickname`, `score`, `note`
- optional: `winner` (`true/false`) or `winnerEntryId`

### `arcade_archive_seeding`

- `rank`, `entryId`, `nickname`, `score`, `note`

### `arcade_archive_qualifiers`

- `group` (`A` or `B`), `entryId`, `nickname`, `seed`

### `arcade_archive_finals_a` / `arcade_archive_finals_b`

- `seed`, `region`, `regionLabel`, `entryId`, `nickname`, `score`

### `arcade_archive_finals_matches`

- `matchNo`
- left side: `leftSeed`, `leftRegion`, `leftRegionLabel`, `leftEntryId`, `leftNickname`
- right side: `rightSeed`, `rightRegion`, `rightRegionLabel`, `rightEntryId`, `rightNickname`
- `winnerEntryId`, `note`

## 3-1) Sheet-by-Sheet 운영 가이드

운영 권장 원칙:

- 실시간 입력은 `ops_db_*`에만 한다.
- 공개 반영은 `opsExport`로 `arcade_archive_*`로 내보낸다.
- `arcade_archive_*`는 결과 공개용이다. 운영 중 직접 수정은 최소화한다.

공통 값 규칙:

- `season`: 보통 `2026`
- `region`: `seoul | daejeon | gwangju | busan`
- `entryId`: 지역 내 고유 ID (예: `SEO-01`)
- boolean 컬럼: `true/false` 또는 `1/0` 사용

### Core tabs

#### `site_config`
- 목적: 사이트 전역 설정값 관리
- 사용 시점: 대회 시작 전, 공지 변경 시
- 핵심 컬럼: `key`, `value`
- 예시 key: `eventName`, `catchphrase`, `applyOpen`, `applyNotice`

#### `partners`
- 목적: 스폰서/파트너 노출 목록
- 사용 시점: 사전 등록, 변경 시
- 핵심 컬럼: `order`, `name`, `logoUrl`, `href`, `enabled`

#### `content_sections`
- 목적: 페이지별 본문 블록 관리
- 사용 시점: 공지/문구 수정 시
- 핵심 컬럼: `page`, `sectionKey`, `order`, `title`, `bodyMd`, `enabled`

#### `schedule`
- 목적: 일정 페이지 렌더링 데이터
- 사용 시점: 일정 확정/변경 시
- 핵심 컬럼: `order`, `division`, `title`, `startDate`, `endDate`, `location`, `status`

#### `results_stage`
- 목적: 일반 결과(콘솔/아케이드) 스테이지 헤더
- 사용 시점: 단계 오픈/종료 상태 변경 시
- 핵심 컬럼: `division`, `stageKey`, `stageLabel`, `order`, `status`, `updatedAt`

#### `results_rows`
- 목적: 일반 결과 랭킹 로우
- 사용 시점: 일반 결과 업데이트 시
- 핵심 컬럼: `division`, `stageKey`, `rank`, `nickname`, `score`, `detail`

#### `registrations`
- 목적: 참가 신청 저장
- 사용 시점: 신청 폼 접수 시 자동 누적
- 비고: 수기 편집보다 상태값(`status`) 관리 위주로 사용

### Ops tabs (`ops_db_*`) - 운영 입력 원본

#### `ops_db_online`
- 목적: 온라인 스코어 어택 결과
- 입력 시점: 지역 예선 시작 전/직후
- 핵심 컬럼: `season`, `region`, `rank`, `entryId`, `nickname`, `score1`, `score2`, `total`, `advanced`

#### `ops_db_swiss_matches`
- 목적: Swiss 매치 단위 로그 (핵심 운영 테이블)
- 입력 시점: 라운드 사전 대진 입력, 경기 종료 직후 점수/승자 입력
- 핵심 컬럼:
  - 매치 키: `season`, `region`, `round`, `table`
  - 선수: `p1*`, `p2*`, `highSeedEntryId`
  - 곡/점수: `song1/2/3`, `level1/2/3`, `p1Score*`, `p2Score*`
  - 결과: `winnerEntryId`, `bye`, `tieBreakerSong`, `note`

#### `ops_db_swiss_standings`
- 목적: Swiss 누적 전적/상태
- 입력 시점: 라운드 종료 후 반영
- 핵심 컬럼: `entryId`, `seed`, `wins`, `losses`, `status`
- `status` 권장값: `alive | qualified | decider | eliminated`

#### `ops_db_decider`
- 목적: 3-1 결정전 기록
- 입력 시점: Swiss 종료 후
- 핵심 컬럼: `rank`, `entryId`, `score`, `winner`, `winnerEntryId`, `note`

#### `ops_db_seeding`
- 목적: 지역 1/2위 시드전 기록
- 입력 시점: 지역 마감 단계
- 핵심 컬럼: `rank`, `entryId`, `score`, `note`

#### `ops_db_qualifiers`
- 목적: 결선 진출자 확정
- 입력 시점: 지역 종료 시
- 핵심 컬럼: `group`(`A` or `B`), `entryId`, `nickname`, `seed`

#### `ops_db_finals_a`
- 목적: 결선 A그룹 시드 테이블
- 입력 시점: 결선 대진 확정 전
- 핵심 컬럼: `seed`, `region`, `regionLabel`, `entryId`, `nickname`, `score`

#### `ops_db_finals_b`
- 목적: 결선 B그룹 시드 테이블
- 입력 시점: 결선 대진 확정 전
- 핵심 컬럼: `seed`, `region`, `regionLabel`, `entryId`, `nickname`, `score`

#### `ops_db_finals_matches`
- 목적: Top 8 크로스 매치 및 승자 기록
- 입력 시점: 결선 진행 중
- 핵심 컬럼:
  - 매치 키: `season`, `matchNo`
  - 좌/우 선수: `left*`, `right*`
  - 결과: `winnerEntryId`, `note`

#### `ops_db_events`
- 목적: 운영 입력 이벤트 로그
- 입력 시점: `opsUpsert`/`opsExport` 시 자동 기록
- 비고: 감사 추적용, 수기 입력 불필요

### Archive tabs (`arcade_archive_*`) - 공개 결과 원본

`opsExport` 실행 시 `ops_db_*`에서 복사/업서트되는 대상이다.

- `arcade_archive_online`: 온라인 예선 공개 데이터
- `arcade_archive_swiss_matches`: Swiss 매치 공개 데이터
- `arcade_archive_swiss_standings`: Swiss 스탠딩 공개 데이터
- `arcade_archive_decider`: 3-1 결정전 공개 데이터
- `arcade_archive_seeding`: 시드전 공개 데이터
- `arcade_archive_qualifiers`: 지역 결선 진출자 공개 데이터
- `arcade_archive_finals_a`: 결선 A그룹 시드 공개 데이터
- `arcade_archive_finals_b`: 결선 B그룹 시드 공개 데이터
- `arcade_archive_finals_matches`: Top 8 매치 공개 데이터

## 4) Auto-create spreadsheet tabs

`Code.gs` now includes helpers that can create tabs and header rows automatically:

- `initializeSpreadsheetTabs()` -> creates core + archive tabs
- `initializeArchiveTabs()` -> creates archive-only tabs

How to run in Apps Script editor:

1. Open the bound Apps Script project.
2. Select function `initializeSpreadsheetTabs` (or `initializeArchiveTabs`).
3. Click Run.
4. Verify tabs and row-1 headers were created.

You can also trigger this via API (`doPost`) with `action: "initSheets"`:

```json
{
  "apiKey": "YOUR_API_KEY",
  "action": "initSheets",
  "params": {
    "scope": "all"
  }
}
```

`scope` can be:

- `all` (default): core + archive
- `archive`: archive only

## 5) Seed a finished tournament example

`Code.gs` includes a sample seeder for "대회 종료 후" 상태:

- `seedArchiveFinishedExample2026()` -> replaces all archive tabs with 2026 sample data

Safe API trigger is also available:

```json
{
  "apiKey": "YOUR_API_KEY",
  "action": "seedArchiveSample",
  "params": {
    "overwrite": true
  }
}
```

Notes:

- This **replaces** rows in all `arcade_archive_*` tabs (header row is kept).
- Use only for demo/testing before real results are entered.

## 6) Spreadsheet menu buttons + readability format

`Code.gs` now provides a custom menu on spreadsheet open (`onOpen`):

- `Init + Format (All)`
- `Init + Format (Archive)`
- `Format (All)`
- `Format (Archive)`
- `Seed Sample 2026`
- `Clear Archive Rows`

The formatting pass applies:

- frozen header row
- header styling (dark background + bold white text)
- alternating row banding
- filter on header row
- basic alignment/number formats by column name
- auto-resize with min/max width bounds

API actions for the same operations:

- `action: "initAndFormatSheets"` (`params.scope`: `all` or `archive`)
- `action: "formatSheets"` (`params.scope`: `all` or `archive`)
- `action: "clearSheetRows"` (`params.scope`: `all` or `archive`, use with caution)

## 7) Frontend routes using the archive

- `/results` (hub)
- `/arcade-results/2026` (season overview)
- `/arcade-results/2026/:region` (region detail)
- `/arcade-results/2026/finals` (Top 8 finals)

These pages are already wired and render even if the archive tables are empty.
