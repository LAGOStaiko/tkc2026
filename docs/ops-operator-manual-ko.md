# TKC2026 아케이드 운영 매뉴얼 (초심자/실무 공용)

이 문서는 `docs/Code.gs.full.gs` 기준으로, 대회 운영자가 **처음 봐도 실제 운영 가능한 수준**으로 정리한 매뉴얼입니다.

## 1. 문서 목적

- 운영자가 메뉴/시트/API를 헷갈리지 않고 사용할 수 있게 안내
- Swiss 라운드 운영 자동화(`재계산 -> 다음 라운드 대진 -> 내보내기`) 절차 표준화
- 실수/장애 시 복구 절차를 빠르게 수행할 수 있게 가이드

## 2. 전체 구조 한눈에 보기

- 입력 원본: `ops_db_*` (운영용)
- 공개 원본: `arcade_archive_*` (사이트 송출용)
- 변환: `opsExport` (ops -> archive 업서트)
- 송출 API: `results` / `opsFeed`
- 자동화 핵심:
  - `opsSwissRebuildStandings`
  - `opsSwissNextRound`
  - `opsRoundClose` (두 기능 + export 묶음)

## 3. 필수 사전 설정

- Script Properties
  - `SHEET_ID`: 사용 스프레드시트 ID
  - `API_KEY`: 서버와 공유하는 API 키
- 권한
  - Apps Script 계정이 해당 스프레드시트 편집 권한 보유
- 최초 1회 권장 실행
  - 메뉴 `TKC2026 도구 > 운영 시작 세팅(원클릭)`

## 4. 시트 분류

### 4-1. 기본 사이트/대회 시트

- `site_config`, `partners`, `content_sections`, `schedule`, `results_stage`, `results_rows`, `registrations`

### 4-2. 운영 입력 시트 (`ops_db_*`)

- `ops_db_online`: 온라인 예선 랭킹
- `ops_db_swiss_matches`: Swiss 매치 단위 입력(핵심)
- `ops_db_swiss_standings`: Swiss 누적 전적/상태
- `ops_db_decider`: 3-1 데시더
- `ops_db_seeding`: 시드전
- `ops_db_qualifiers`: A/B 본선 진출자
- `ops_db_finals_a`, `ops_db_finals_b`: 결선 시드
- `ops_db_finals_matches`: 결선 매치 결과
- `ops_db_events`: 자동 로그

### 4-3. 공개 시트 (`arcade_archive_*`)

- `opsExport`로 갱신되는 공개 데이터
- 실시간 운영 중 직접 수정 최소화 권장

## 5. 메뉴 기능 설명

- `전체 탭 초기화+서식`: 기본+아카이브 탭 생성/헤더 정렬/가독성 서식
- `아카이브 탭 초기화+서식`: archive만 생성/서식
- `운영 시작 세팅(원클릭)`: 초심자용 통합 세팅
- `운영 시작 가이드 시트 작성`: 체크리스트(`ops_beginner_guide`) 생성
- `운영 가이드 시트 작성`: 시트별 요약 가이드
- `시트별 인라인 가이드 작성`: 각 `ops_db_*` 우측 가이드 블록 작성
- `스위스 라운드 종료(자동 대진+내보내기)`: 실무 핵심 버튼

## 6. 초심자 운영 절차 (권장 표준)

### 6-1. 첫 세팅

1. `운영 시작 세팅(원클릭)` 실행
2. 생성된 `ops_beginner_guide` 시트 확인
3. `ops_db_online` / `ops_db_swiss_standings`에 시즌/지역/선수 기본값 확인

### 6-2. 라운드 운영 중

1. `ops_db_swiss_matches`에 라운드/테이블/선수 정보 선입력
2. 경기 종료마다 점수 + `winnerEntryId` 입력
3. 부전승이면 `bye=TRUE`, 승자는 자동/수동으로 `winnerEntryId`에 반영

### 6-3. 라운드 종료 시

1. 메뉴 `스위스 라운드 종료(자동 대진+내보내기)` 실행
2. 내부 동작:
   - 이전 라운드까지 결과 기준 standings 재계산
   - 다음 라운드 자동 대진 생성(부전승 포함)
   - archive 시트로 내보내기
3. 토스트 값 확인:
   - `rebuiltRows`, `generatedRows`, `totalRows`

## 7. Swiss 자동화 로직 요약

### 7-1. standings 재계산 (`opsSwissRebuildStandings`)

- 입력: `ops_db_swiss_matches`
- 계산:
  - 승자 `wins +1`
  - 패자 `losses +1`
  - 부전승은 승자 `wins +1`
- 정렬:
  - `wins` 내림차순
  - `losses` 오름차순
  - `seed` 오름차순

### 7-2. 다음 라운드 자동 대진 (`opsSwissNextRound`)

- 참가자 소스: `ops_db_swiss_standings`
- 기본 제외: `status=qualified` / `status=eliminated`
- 매칭 우선순위:
  - 동승점 + 비리매치
  - 비리매치 우선
  - 불가 시 리매치 허용
- 부전승:
  - 참가자 홀수면 1명 자동 부전승
  - 가급적 이전 부전승 미경험자 우선

### 7-3. 라운드 종료 묶음 (`opsRoundClose`)

- `rebuild -> nextRound -> export` 순차 실행

## 8. API 사용 규격

### 8-1. 공통 요청 포맷

```json
{
  "apiKey": "YOUR_API_KEY",
  "action": "opsRoundClose",
  "params": {},
  "payload": {}
}
```

### 8-2. 주요 action

- `opsInit`
- `opsGuide`
- `opsInlineGuide`
- `opsBeginnerGuide`
- `opsFirstTimeSetup`
- `opsUpsert`
- `opsSwissRebuildStandings`
- `opsSwissNextRound`
- `opsRoundClose`
- `opsExport`
- `opsFeed` — `executeCachedAction_` 래핑 (15초 TTL, `season:region` 키)

> **opsFeed 캐시 원칙:** opsFeed 캐시는 시즌/지역 단위로 생성되며, 데이터 변경(opsUpsert, opsExport, opsRoundClose 등) 직후 자동 무효화됩니다. `purgeOpsFeedCache_(season, region)` 헬퍼가 해당 시즌/지역의 캐시만 삭제합니다.

### 8-3. 자주 쓰는 예시

원클릭 세팅:

```json
{
  "apiKey": "YOUR_API_KEY",
  "action": "opsFirstTimeSetup",
  "params": {
    "initAll": true,
    "overwriteGuide": true
  }
}
```

라운드 종료(자동):

```json
{
  "apiKey": "YOUR_API_KEY",
  "action": "opsRoundClose",
  "payload": {
    "season": "2026",
    "region": "seoul",
    "exportArchive": true
  }
}
```

Swiss 매치 업서트:

```json
{
  "apiKey": "YOUR_API_KEY",
  "action": "opsUpsert",
  "payload": {
    "stage": "swissMatch",
    "season": "2026",
    "region": "seoul",
    "row": {
      "round": 1,
      "table": 1,
      "p1EntryId": "SEO-01",
      "p1Nickname": "서울선수01",
      "p1Seed": 1,
      "p2EntryId": "SEO-16",
      "p2Nickname": "서울선수16",
      "p2Seed": 16,
      "song1": "과제곡A",
      "song2": "과제곡B",
      "p1Score1": 987000,
      "p2Score1": 980000,
      "p1Score2": 985000,
      "p2Score2": 982000,
      "winnerEntryId": "SEO-01"
    }
  }
}
```

## 9. 운영 중 자주 나는 오류와 처리

- `이전 라운드가 완료되지 않았습니다`
  - 의미: 이전 라운드에 `winnerEntryId` 누락
  - 조치: 누락 매치 채우고 재실행
- `대상 라운드에 이미 행이 있습니다`
  - 의미: 같은 round 데이터가 이미 존재
  - 조치: `overwrite=true`로 재생성하거나 수동 검수
- `standings 데이터가 없습니다`
  - 의미: 스탠딩 소스 부족
  - 조치: `ops_db_swiss_standings` 또는 온라인 seed 데이터 확인
- `region 값이 올바르지 않습니다`
  - 허용값: `seoul`, `daejeon`, `gwangju`, `busan`

## 10. 운영 품질 체크리스트

- 라운드 종료 전:
  - 모든 매치에 승자 입력 여부 확인
  - 부전승 행 `bye=TRUE` 확인
- 라운드 종료 후:
  - 생성된 다음 라운드 테이블 수 확인
  - 부전승 중복 배정 여부 확인
  - `opsExport` 반영 후 공개 화면 확인
- 종료 후:
  - `ops_db_events` 로그로 누가/언제 실행했는지 감사 추적
- 선곡풀 릴리즈 전:
  - `song_pool_arcade_swiss`의 `difficulty` 오탈자 검사 (`oni`/`ura` 이외 값 없는지 확인)
  - `song_pool_arcade_finals`, `song_pool_console_finals`도 동일 검사

## 11. 권장 실무 원칙

- 운영 입력은 항상 `ops_db_*`에만 한다.
- 공개 데이터는 `opsExport`로만 반영한다.
- 라운드 전환은 `opsRoundClose`를 표준 버튼으로 통일한다.
- 급한 수동 수정 후에는 반드시 `opsSwissRebuildStandings`로 정합성 복구한다.
- ops_db에서 행을 삭제한 후에는 "기존 아카이브 초기화 후 재송출" 체크 후 송출하여 고아 데이터를 제거한다.
- **지역 replace는 결선 시트를 지우지 않음** — 지역 단위 재송출 시 finals_a/finals_b/finals_matches는 보호된다.
- **전체 replace만 결선 포함 정리** — "시즌 전체 송출" + replace 체크 시에만 결선 시트가 초기화 후 재작성된다.

## 12. 선곡풀 관리

### 단일 소스 원칙

선곡풀은 **`song_pool_*` 시트가 유일한 소스**입니다.

| 시트 | 용도 |
|---|---|
| `song_pool_console_finals` | 콘솔 결선 선곡풀 |
| `song_pool_arcade_finals` | 아케이드 결선 선곡풀 |
| `song_pool_arcade_swiss` | 아케이드 스위스 스테이지 선곡풀 |

### 시트 헤더

모든 선곡풀 시트는 동일 헤더를 사용합니다:

`order | title | difficulty | level | note`

- `difficulty`: 소문자 `oni` 또는 `ura`만 허용 (대소문자/공백은 자동 보정되지만, 그 외 값은 API에서 제외됨)
- `level`: 숫자 (★ 레벨)
- `title`이 비어 있거나 `difficulty`가 무효인 행은 API 응답에서 자동 제외
- 하나의 곡이 oni/ura 모두 있으면 **행 2개**로 입력

### 캐시 반영 지연

- GAS 캐시: **최대 15초**
- CDN 캐시: **없음** (`private, no-store`)
- 브라우저: **최대 30초** (탭 포커스 시 자동 refetch)

**시트 수정 후 최대 15초 이내 사이트 반영.** 즉시 확인하려면 GAS에서 `purgeApiCache_()` 실행 후 브라우저 새로고침.

### 신청 페이지 연동

신청 폼(`/apply`)의 "오프라인 선곡" 드롭다운은 `song_pool_arcade_swiss` 시트에서 자동 로드됩니다. 정적 상수가 아닌 API 기반이므로 시트 수정만으로 옵션이 변경됩니다.

## 13. 변경 이력

- 2026-02-08
  - `normalizeDifficulty_()` 헬퍼 추가: `difficulty` 값을 `oni`/`ura`로 엄격 정규화
  - `handleSongPools_`에서 `title` 비어 있거나 `difficulty` 무효인 행 자동 제외
  - 신청 페이지(`/apply`) 선곡 필터에 `difficulty` 재검증 추가
  - 선곡풀 페이지(`/song-pool`)에 전체 빈 상태 UI 추가
  - 운영 품질 체크리스트에 선곡풀 `difficulty` 오탈자 검사 항목 추가
  - 선곡풀 단일 소스 전환: `song_pool_*` 시트 → `songPools` API → 프론트엔드
  - `song_pool_arcade_swiss` 시트 스키마 추가
  - GAS `SWISS_SONG_POOL_` 상수 + `buildArcadeSongPoolOptions_()` 제거
  - `handleSite_`에서 `arcadeSongPool` 필드 제거
  - `handleSongPools_`가 `consoleFinals`, `arcadeFinals`, `arcadeSwiss` 3개 풀 반환
  - 선곡풀/과제곡 캐시 정책 통일 (GAS 15초, CDN 없음, 브라우저 30초)
  - 신청 페이지(`/apply`) 선곡 드롭다운을 `useSongPools()` API 기반으로 전환
  - 선곡풀 페이지(`/song-pool`)를 정적 상수에서 API 기반으로 전환

- 2026-02-07
  - `opsExport`에 `mode: 'replace'` 옵션 추가 (고아 데이터 제거)
  - 지역 replace 시 결선 시트 보호 규칙 추가 (regionScopedOnly / seasonAll)
  - replace 실행 전 confirm 다이얼로그 추가 (지역/전체 문구 분리)
  - `opsFeed` GAS CacheService 캐싱 추가 (15초 TTL, season:region 키, mutation 시 자동 무효화)
  - `purgeOpsFeedCache_(season, region)` 헬퍼 분리 — 시즌/지역 타겟 캐시 삭제
  - 모든 mutation(opsUpsert/opsExport/opsRoundClose 등) 성공 시 opsFeed 캐시 무효화 통일
  - `opsSwissRebuildStandings` 추가
  - `opsSwissNextRound`/`opsRoundClose` 자동화 강화
  - `opsBeginnerGuide`/`opsFirstTimeSetup` 추가
  - 메뉴 한글화 및 운영 토스트 지표 확장

