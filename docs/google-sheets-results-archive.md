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

## 5) Frontend routes using the archive

- `/results` (hub)
- `/arcade-results/2026` (season overview)
- `/arcade-results/2026/:region` (region detail)
- `/arcade-results/2026/finals` (Top 8 finals)

These pages are already wired and render even if the archive tables are empty.
