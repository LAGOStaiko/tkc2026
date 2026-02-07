/**
 * TKC2026 Google Apps Script Web App
 *
 * Script Properties required:
 * - SHEET_ID : the Spreadsheet ID (from the URL)
 * - API_KEY  : shared secret (same as Cloudflare env GAS_API_KEY)
 *
 * Sheets expected (tabs):
 * - site_config (key, value, note, updatedAt)
 * - partners (order, name, logoUrl, href, enabled)
 * - content_sections (page, sectionKey, order, title, bodyMd, imageUrl, enabled)
 * - schedule (order, division, title, startDate, endDate, dateText, location, status, note)
 * - results_stage (division, stageKey, stageLabel, order, status, updatedAt, note)
 * - results_rows (division, stageKey, rank, nickname, score, detail, updatedAt)
 * - registrations (createdAt, receiptId, division, name, phone, email, nickname, cardNo, dohirobaNo, spectator, isMinor, consentLink, privacyAgree, status, memo)
 *
 * Optional archive tabs (for /results arcadeArchive2026):
 * - arcade_archive_online
 * - arcade_archive_swiss_matches
 * - arcade_archive_swiss_standings
 * - arcade_archive_decider
 * - arcade_archive_seeding
 * - arcade_archive_qualifiers
 * - arcade_archive_finals_a
 * - arcade_archive_finals_b
 * - arcade_archive_finals_matches
 */

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function toBool_(v) {
  if (v === true) return true;
  if (v === false) return false;
  if (v === null || v === undefined) return false;
  if (typeof v === 'number') return v !== 0;
  var s = String(v).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

function isoDate_(d) {
  if (!(d instanceof Date)) return '';
  var tz = Session.getScriptTimeZone();
  return Utilities.formatDate(d, tz, 'yyyy-MM-dd');
}

function isoDateTime_(d) {
  if (!(d instanceof Date)) return '';
  var tz = Session.getScriptTimeZone();
  return Utilities.formatDate(d, tz, "yyyy-MM-dd'T'HH:mm:ss");
}

function getSs_() {
  var sheetId = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!sheetId) throw new Error('Missing Script Property SHEET_ID');
  return SpreadsheetApp.openById(sheetId);
}

function getSheet_(name) {
  var ss = getSs_();
  var sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Missing sheet(tab): ' + name);
  return sh;
}

function ensureSheetSchema_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  var created = false;
  if (!sh) {
    sh = ss.insertSheet(name);
    created = true;
  }

  if (sh.getMaxColumns() < headers.length) {
    sh.insertColumnsAfter(sh.getMaxColumns(), headers.length - sh.getMaxColumns());
  }

  var current = sh.getRange(1, 1, 1, headers.length).getValues()[0].map(function(v){
    return String(v || '').trim();
  });

  var same = true;
  for (var i = 0; i < headers.length; i++) {
    if (current[i] !== headers[i]) {
      same = false;
      break;
    }
  }

  if (!same) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  sh.setFrozenRows(1);

  return {
    sheet: name,
    created: created,
    headerUpdated: !same
  };
}

function getSheetSchemas_(scope) {
  var core = [
    { name: 'site_config', headers: ['key', 'value', 'note', 'updatedAt'] },
    { name: 'partners', headers: ['order', 'name', 'logoUrl', 'href', 'enabled'] },
    { name: 'content_sections', headers: ['page', 'sectionKey', 'order', 'title', 'bodyMd', 'imageUrl', 'enabled'] },
    { name: 'schedule', headers: ['order', 'division', 'title', 'startDate', 'endDate', 'dateText', 'location', 'status', 'note'] },
    { name: 'results_stage', headers: ['division', 'stageKey', 'stageLabel', 'order', 'status', 'updatedAt', 'note'] },
    { name: 'results_rows', headers: ['division', 'stageKey', 'rank', 'nickname', 'score', 'detail', 'updatedAt'] },
    { name: 'registrations', headers: ['createdAt', 'receiptId', 'division', 'name', 'phone', 'email', 'nickname', 'cardNo', 'dohirobaNo', 'spectator', 'isMinor', 'consentLink', 'privacyAgree', 'status', 'memo'] }
  ];

  var archive = [
    { name: 'arcade_archive_online', headers: ['season', 'region', 'rank', 'entryId', 'nickname', 'score1', 'score2', 'total', 'submittedAt', 'advanced'] },
    { name: 'arcade_archive_swiss_matches', headers: ['season', 'region', 'round', 'table', 'highSeedEntryId', 'p1EntryId', 'p1Nickname', 'p1Seed', 'p2EntryId', 'p2Nickname', 'p2Seed', 'song1', 'level1', 'p1Score1', 'p2Score1', 'song2', 'level2', 'p1Score2', 'p2Score2', 'song3', 'level3', 'p1Score3', 'p2Score3', 'winnerEntryId', 'tieBreakerSong', 'bye', 'note'] },
    { name: 'arcade_archive_swiss_standings', headers: ['season', 'region', 'entryId', 'nickname', 'seed', 'wins', 'losses', 'status'] },
    { name: 'arcade_archive_decider', headers: ['season', 'region', 'rank', 'entryId', 'nickname', 'score', 'winner', 'winnerEntryId', 'note'] },
    { name: 'arcade_archive_seeding', headers: ['season', 'region', 'rank', 'entryId', 'nickname', 'score', 'note'] },
    { name: 'arcade_archive_qualifiers', headers: ['season', 'region', 'group', 'entryId', 'nickname', 'seed'] },
    { name: 'arcade_archive_finals_a', headers: ['season', 'seed', 'region', 'regionLabel', 'entryId', 'nickname', 'score'] },
    { name: 'arcade_archive_finals_b', headers: ['season', 'seed', 'region', 'regionLabel', 'entryId', 'nickname', 'score'] },
    { name: 'arcade_archive_finals_matches', headers: ['season', 'matchNo', 'leftSeed', 'leftRegion', 'leftRegionLabel', 'leftEntryId', 'leftNickname', 'rightSeed', 'rightRegion', 'rightRegionLabel', 'rightEntryId', 'rightNickname', 'winnerEntryId', 'note'] }
  ];

  if (scope === 'archive') return archive;
  return core.concat(archive);
}

function handleInitSheets_(params) {
  var scope = params && params.scope ? String(params.scope).trim().toLowerCase() : 'all';
  if (scope !== 'archive' && scope !== 'all') {
    return { ok: false, error: 'scope must be all or archive' };
  }

  var ss = getSs_();
  var schemas = getSheetSchemas_(scope);
  var created = 0;
  var headerUpdated = 0;
  var sheets = schemas.map(function(schema){
    var result = ensureSheetSchema_(ss, schema.name, schema.headers);
    if (result.created) created++;
    if (result.headerUpdated) headerUpdated++;
    return result;
  });

  return {
    ok: true,
    data: {
      scope: scope,
      total: schemas.length,
      created: created,
      headerUpdated: headerUpdated,
      sheets: sheets
    }
  };
}

function initializeSpreadsheetTabs() {
  return handleInitSheets_({ scope: 'all' });
}

function initializeArchiveTabs() {
  return handleInitSheets_({ scope: 'archive' });
}

var API_CACHE_VERSION_ = '2026-02-06';
var CONTENT_PAGE_KEYS_ = ['home', 'console', 'arcade', 'contact'];

function getApiCacheKey_(action, params) {
  var base = 'tkc2026:' + API_CACHE_VERSION_ + ':' + String(action || '').trim();
  if (action === 'content') {
    var page = params && params.page ? String(params.page).trim().toLowerCase() : '';
    return base + ':' + page;
  }
  return base;
}

function getApiCacheTtlSec_(action) {
  if (action === 'site') return 300;      // 5m
  if (action === 'content') return 180;   // 3m
  if (action === 'schedule') return 90;   // 90s
  if (action === 'results') return 20;    // 20s (results update sensitivity)
  return 60;
}

function executeCachedAction_(action, params, compute) {
  var bypass = params && toBool_(params.noCache);
  if (bypass) return compute();

  var cache = CacheService.getScriptCache();
  var key = getApiCacheKey_(action, params);
  var cached = cache.get(key);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch (err) {
      cache.remove(key);
    }
  }

  var result = compute();
  if (result && result.ok === true) {
    try {
      cache.put(key, JSON.stringify(result), getApiCacheTtlSec_(action));
    } catch (err) {
      // Ignore cache write failures (e.g. payload too large).
    }
  }
  return result;
}

function getApiCacheKeys_() {
  var keys = [
    getApiCacheKey_('site', {}),
    getApiCacheKey_('schedule', {}),
    getApiCacheKey_('results', {})
  ];
  for (var i = 0; i < CONTENT_PAGE_KEYS_.length; i++) {
    keys.push(getApiCacheKey_('content', { page: CONTENT_PAGE_KEYS_[i] }));
  }
  return keys;
}

function purgeApiCache_() {
  var cache = CacheService.getScriptCache();
  var keys = getApiCacheKeys_();
  try {
    cache.removeAll(keys);
  } catch (err) {
    for (var i = 0; i < keys.length; i++) cache.remove(keys[i]);
  }
  return {
    ok: true,
    data: {
      removed: keys.length
    }
  };
}

function resolveScope_(params, fallback) {
  var scope = params && params.scope ? String(params.scope).trim().toLowerCase() : (fallback || 'all');
  if (scope !== 'archive' && scope !== 'all') return null;
  return scope;
}

function getHeaderNumberFormat_(header) {
  var h = String(header || '').trim().toLowerCase();
  if (!h) return null;

  if (h === 'startdate' || h === 'enddate') return 'yyyy-mm-dd';
  if (h === 'createdat' || h === 'updatedat') return 'yyyy-mm-dd hh:mm:ss';

  if (
    h === 'order' ||
    h === 'rank' ||
    h === 'seed' ||
    h === 'wins' ||
    h === 'losses' ||
    h === 'round' ||
    h === 'table' ||
    h === 'matchno' ||
    h === 'p1seed' ||
    h === 'p2seed' ||
    h.indexOf('score') >= 0 ||
    h === 'total'
  ) {
    return '#,##0';
  }

  return null;
}

function getHeaderAlignment_(header) {
  var h = String(header || '').trim().toLowerCase();
  if (!h) return 'left';

  if (
    h === 'enabled' ||
    h === 'advanced' ||
    h === 'bye' ||
    h === 'winner' ||
    h === 'spectator' ||
    h === 'isminor' ||
    h === 'privacyagree'
  ) {
    return 'center';
  }

  if (
    h === 'order' ||
    h === 'rank' ||
    h === 'seed' ||
    h === 'wins' ||
    h === 'losses' ||
    h === 'round' ||
    h === 'table' ||
    h === 'matchno' ||
    h === 'p1seed' ||
    h === 'p2seed' ||
    h.indexOf('score') >= 0 ||
    h === 'total'
  ) {
    return 'right';
  }

  return 'left';
}

function applyReadableSheetStyle_(ss, name, headers) {
  ensureSheetSchema_(ss, name, headers);

  var sh = ss.getSheetByName(name);
  var width = headers.length;
  var lastRow = Math.max(sh.getLastRow(), 2);
  var dataRowCount = Math.max(sh.getLastRow() - 1, 0);
  var fullRange = sh.getRange(1, 1, lastRow, width);
  var headerRange = sh.getRange(1, 1, 1, width);

  sh.setFrozenRows(1);

  var filter = sh.getFilter();
  if (filter) filter.remove();
  fullRange.createFilter();

  var bandings = sh.getBandings();
  for (var i = 0; i < bandings.length; i++) bandings[i].remove();
  fullRange.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);

  headerRange
    .setBackground('#111827')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sh.setRowHeight(1, 30);

  if (dataRowCount > 0) {
    var bodyRange = sh.getRange(2, 1, dataRowCount, width);
    bodyRange.setVerticalAlignment('middle');

    for (var col = 1; col <= width; col++) {
      var header = headers[col - 1];
      var colRange = sh.getRange(2, col, dataRowCount, 1);
      var numberFormat = getHeaderNumberFormat_(header);
      var align = getHeaderAlignment_(header);

      colRange.setHorizontalAlignment(align);
      if (numberFormat) colRange.setNumberFormat(numberFormat);
    }
  }

  sh.autoResizeColumns(1, width);
  for (var c = 1; c <= width; c++) {
    var currentWidth = sh.getColumnWidth(c);
    if (currentWidth < 90) sh.setColumnWidth(c, 90);
    if (currentWidth > 360) sh.setColumnWidth(c, 360);
  }

  return {
    sheet: name,
    rows: dataRowCount
  };
}

function handleFormatSheets_(params) {
  var scope = resolveScope_(params, 'all');
  if (!scope) return { ok: false, error: 'scope must be all or archive' };

  var ss = getSs_();
  var schemas = getSheetSchemas_(scope);
  var sheets = schemas.map(function(schema){
    return applyReadableSheetStyle_(ss, schema.name, schema.headers);
  });

  return {
    ok: true,
    data: {
      scope: scope,
      total: sheets.length,
      sheets: sheets
    }
  };
}

function handleInitAndFormat_(params) {
  var scope = resolveScope_(params, 'all');
  if (!scope) return { ok: false, error: 'scope must be all or archive' };

  var init = handleInitSheets_({ scope: scope });
  if (!init.ok) return init;

  var formatted = handleFormatSheets_({ scope: scope });
  if (!formatted.ok) return formatted;

  return {
    ok: true,
    data: {
      scope: scope,
      total: init.data.total,
      created: init.data.created,
      headerUpdated: init.data.headerUpdated,
      formatted: formatted.data.total
    }
  };
}

function handleClearSheetRows_(params) {
  var scope = resolveScope_(params, 'archive');
  if (!scope) return { ok: false, error: 'scope must be all or archive' };

  var ss = getSs_();
  var schemas = getSheetSchemas_(scope);
  var clearedRows = 0;

  var sheets = schemas.map(function(schema){
    ensureSheetSchema_(ss, schema.name, schema.headers);
    var sh = ss.getSheetByName(schema.name);
    var rows = Math.max(sh.getLastRow() - 1, 0);
    if (rows > 0) sh.getRange(2, 1, rows, schema.headers.length).clearContent();
    clearedRows += rows;
    return {
      sheet: schema.name,
      clearedRows: rows
    };
  });

  return {
    ok: true,
    data: {
      scope: scope,
      total: sheets.length,
      clearedRows: clearedRows,
      sheets: sheets
    }
  };
}

function initializeAndFormatSpreadsheetTabs() {
  return handleInitAndFormat_({ scope: 'all' });
}

function initializeAndFormatArchiveTabs() {
  return handleInitAndFormat_({ scope: 'archive' });
}

function formatSpreadsheetTabs() {
  return handleFormatSheets_({ scope: 'all' });
}

function formatArchiveTabs() {
  return handleFormatSheets_({ scope: 'archive' });
}

function clearArchiveRows() {
  return handleClearSheetRows_({ scope: 'archive' });
}

function notifyMenuResult_(title, result) {
  var ui = SpreadsheetApp.getUi();
  if (!result || !result.ok) {
    ui.alert(
      title + ' failed',
      result && result.error ? String(result.error) : 'Unknown error',
      ui.ButtonSet.OK
    );
    return;
  }

  var data = result.data || {};
  var parts = [];
  if (typeof data.total === 'number') parts.push('tabs=' + data.total);
  if (typeof data.created === 'number') parts.push('created=' + data.created);
  if (typeof data.headerUpdated === 'number') parts.push('headerUpdated=' + data.headerUpdated);
  if (typeof data.formatted === 'number') parts.push('formatted=' + data.formatted);
  if (typeof data.clearedRows === 'number') parts.push('clearedRows=' + data.clearedRows);

  var message = parts.length ? parts.join(', ') : 'Done';
  SpreadsheetApp.getActiveSpreadsheet().toast(message, title, 7);
}

function menuInitAllTabs_() {
  notifyMenuResult_('Init + Format (All)', handleInitAndFormat_({ scope: 'all' }));
}

function menuInitArchiveTabs_() {
  notifyMenuResult_('Init + Format (Archive)', handleInitAndFormat_({ scope: 'archive' }));
}

function menuFormatAllTabs_() {
  notifyMenuResult_('Format (All)', handleFormatSheets_({ scope: 'all' }));
}

function menuFormatArchiveTabs_() {
  notifyMenuResult_('Format (Archive)', handleFormatSheets_({ scope: 'archive' }));
}

function menuSeedArchiveSample_() {
  var ui = SpreadsheetApp.getUi();
  var button = ui.alert(
    'Seed sample archive data?',
    'This will overwrite all rows in arcade_archive_* tabs.',
    ui.ButtonSet.YES_NO
  );
  if (button !== ui.Button.YES) return;

  notifyMenuResult_('Seed Sample 2026', handleSeedArchiveSample_({ overwrite: true }));
}

function menuClearArchiveRows_() {
  var ui = SpreadsheetApp.getUi();
  var button = ui.alert(
    'Clear archive rows?',
    'Header row will be kept. Existing archive rows will be removed.',
    ui.ButtonSet.YES_NO
  );
  if (button !== ui.Button.YES) return;

  var cleared = handleClearSheetRows_({ scope: 'archive' });
  if (cleared.ok) handleFormatSheets_({ scope: 'archive' });
  notifyMenuResult_('Clear Archive Rows', cleared);
}

function menuPurgeApiCache_() {
  notifyMenuResult_('Purge API Cache', purgeApiCache_());
}

function menuWriteOpsGuide_() {
  notifyMenuResult_('Write Ops Guide', handleOpsGuide_({ overwrite: true }));
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('TKC2026 Tools')
    .addItem('Init + Format (All)', 'menuInitAllTabs_')
    .addItem('Init + Format (Archive)', 'menuInitArchiveTabs_')
    .addSeparator()
    .addItem('Format (All)', 'menuFormatAllTabs_')
    .addItem('Format (Archive)', 'menuFormatArchiveTabs_')
    .addSeparator()
    .addItem('Seed Sample 2026', 'menuSeedArchiveSample_')
    .addItem('Clear Archive Rows', 'menuClearArchiveRows_')
    .addSeparator()
    .addItem('Purge API Cache', 'menuPurgeApiCache_')
    .addItem('Write Ops Guide Sheet', 'menuWriteOpsGuide_')
    .addToUi();
}

function pad2_(n) {
  var v = Number(n);
  if (!isFinite(v) || v < 0) v = 0;
  if (v < 10) return '0' + v;
  return String(Math.floor(v));
}

function replaceTableRows_(ss, sheetName, headers, rows) {
  ensureSheetSchema_(ss, sheetName, headers);
  var sh = ss.getSheetByName(sheetName);
  var lastRow = sh.getLastRow();

  if (lastRow > 1) {
    sh.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  }

  if (!rows || rows.length === 0) return 0;

  var values = rows.map(function(row){
    return headers.map(function(h){
      return row[h] !== undefined ? row[h] : '';
    });
  });

  sh.getRange(2, 1, values.length, headers.length).setValues(values);
  return values.length;
}

function buildArchiveFinishedSample2026_() {
  var season = '2026';
  var regions = [
    { key: 'seoul', shortLabel: '서울', prefix: 'SEO' },
    { key: 'daejeon', shortLabel: '대전', prefix: 'DAE' },
    { key: 'gwangju', shortLabel: '광주', prefix: 'GWA' },
    { key: 'busan', shortLabel: '부산', prefix: 'BUS' }
  ];

  var data = {
    arcade_archive_online: [],
    arcade_archive_swiss_matches: [],
    arcade_archive_swiss_standings: [],
    arcade_archive_decider: [],
    arcade_archive_seeding: [],
    arcade_archive_qualifiers: [],
    arcade_archive_finals_a: [],
    arcade_archive_finals_b: [],
    arcade_archive_finals_matches: []
  };

  var qualifierMap = {};

  regions.forEach(function(region, regionIndex){
    var participants = [];
    for (var seed = 1; seed <= 16; seed++) {
      participants.push({
        seed: seed,
        entryId: region.prefix + '-' + pad2_(seed),
        nickname: region.shortLabel + '선수' + pad2_(seed)
      });
    }

    function getP(seed) {
      return participants[seed - 1];
    }

    for (var rank = 1; rank <= 16; rank++) {
      var p = getP(rank);
      var score1 = 996000 - rank * 320 - regionIndex * 25;
      var score2 = 994000 - rank * 300 - regionIndex * 20;
      data.arcade_archive_online.push({
        season: season,
        region: region.key,
        rank: rank,
        entryId: p.entryId,
        nickname: p.nickname,
        score1: score1,
        score2: score2,
        total: score1 + score2,
        submittedAt: '2026-03-' + pad2_(21 + regionIndex) + ' ' + pad2_(10 + Math.floor((rank - 1) / 2)) + ':' + pad2_(rank + 8),
        advanced: true
      });
    }

    var swissPairings = [
      { round: 1, pairs: [[1,16,1],[2,15,2],[3,14,3],[4,13,4],[5,12,5],[6,11,6],[7,10,7],[8,9,8]] },
      { round: 2, pairs: [[1,8,1],[2,7,2],[3,6,3],[4,5,4],[9,16,9],[10,15,10],[11,14,11],[12,13,12]] },
      { round: 3, pairs: [[1,4,1],[2,3,2],[5,12,5],[6,11,6],[7,10,7],[8,9,8]] },
      { round: 4, pairs: [[1,2,1],[3,8,3],[4,7,4],[5,6,5]] }
    ];

    swissPairings.forEach(function(block){
      block.pairs.forEach(function(pair, pairIndex){
        var p1 = getP(pair[0]);
        var p2 = getP(pair[1]);
        var winnerSeed = pair[2];
        var winner = getP(winnerSeed);
        var p1Win = winnerSeed === pair[0];

        var p1Score1 = 983000 - pair[0] * 120 + block.round * 85 - regionIndex * 11 + (p1Win ? 900 : 120);
        var p2Score1 = 983000 - pair[1] * 120 + block.round * 80 - regionIndex * 11 + (p1Win ? 120 : 900);
        var p1Score2 = 981500 - pair[0] * 115 + block.round * 70 - regionIndex * 9 + (p1Win ? 850 : 140);
        var p2Score2 = 981500 - pair[1] * 115 + block.round * 68 - regionIndex * 9 + (p1Win ? 140 : 850);

        var row = {
          season: season,
          region: region.key,
          round: block.round,
          table: pairIndex + 1,
          highSeedEntryId: p1.entryId,
          p1EntryId: p1.entryId,
          p1Nickname: p1.nickname,
          p1Seed: p1.seed,
          p2EntryId: p2.entryId,
          p2Nickname: p2.nickname,
          p2Seed: p2.seed,
          song1: '課題外選曲 A',
          level1: 'Lv.9',
          p1Score1: p1Score1,
          p2Score1: p2Score1,
          song2: '課題外選曲 B',
          level2: 'Lv.9',
          p1Score2: p1Score2,
          p2Score2: p2Score2,
          winnerEntryId: winner.entryId,
          tieBreakerSong: '',
          bye: false,
          note: ''
        };

        if (block.round === 3 && pairIndex === 5) {
          row.p1Score1 = 982400;
          row.p2Score1 = 982400;
          row.p1Score2 = 981700;
          row.p2Score2 = 981700;
          row.song3 = 'Random Draw Song';
          row.level3 = 'Lv.10';
          row.p1Score3 = p1Win ? 980800 : 979900;
          row.p2Score3 = p1Win ? 979900 : 980800;
          row.tieBreakerSong = 'Random Draw Song';
          row.note = '동점으로 타이브레이커 1회 진행';
        }

        data.arcade_archive_swiss_matches.push(row);
      });
    });

    [
      [1, 4, 0, 'qualified'],
      [2, 3, 1, 'decider'],
      [3, 3, 1, 'decider'],
      [4, 3, 1, 'decider'],
      [5, 3, 1, 'decider'],
      [6, 2, 2, 'eliminated'],
      [7, 2, 2, 'eliminated'],
      [8, 2, 2, 'eliminated'],
      [9, 1, 2, 'eliminated'],
      [10, 1, 2, 'eliminated'],
      [11, 1, 2, 'eliminated'],
      [12, 1, 2, 'eliminated'],
      [13, 0, 2, 'eliminated'],
      [14, 0, 2, 'eliminated'],
      [15, 0, 2, 'eliminated'],
      [16, 0, 2, 'eliminated']
    ].forEach(function(row){
      var p = getP(row[0]);
      data.arcade_archive_swiss_standings.push({
        season: season,
        region: region.key,
        entryId: p.entryId,
        nickname: p.nickname,
        seed: p.seed,
        wins: row[1],
        losses: row[2],
        status: row[3]
      });
    });

    var deciderSeeds = [2, 3, 4, 5];
    deciderSeeds.forEach(function(seed, idx){
      var p = getP(seed);
      data.arcade_archive_decider.push({
        season: season,
        region: region.key,
        rank: idx + 1,
        entryId: p.entryId,
        nickname: p.nickname,
        score: 994800 - idx * 620 - regionIndex * 12,
        winner: idx === 0,
        winnerEntryId: idx === 0 ? p.entryId : '',
        note: idx === 0 ? 'Top 8 진출 확정' : ''
      });
    });

    var groupA = getP(1);
    var groupB = getP(2);
    var groupAScore = 997500 - regionIndex * 140;
    var groupBScore = 995900 - regionIndex * 130;

    data.arcade_archive_seeding.push({
      season: season,
      region: region.key,
      rank: 1,
      entryId: groupA.entryId,
      nickname: groupA.nickname,
      score: groupAScore,
      note: '지역 1위(A그룹)'
    });
    data.arcade_archive_seeding.push({
      season: season,
      region: region.key,
      rank: 2,
      entryId: groupB.entryId,
      nickname: groupB.nickname,
      score: groupBScore,
      note: '지역 2위(B그룹)'
    });

    data.arcade_archive_qualifiers.push({
      season: season,
      region: region.key,
      group: 'A',
      entryId: groupA.entryId,
      nickname: groupA.nickname,
      seed: 1
    });
    data.arcade_archive_qualifiers.push({
      season: season,
      region: region.key,
      group: 'B',
      entryId: groupB.entryId,
      nickname: groupB.nickname,
      seed: 2
    });

    qualifierMap[region.key] = {
      groupA: { entryId: groupA.entryId, nickname: groupA.nickname, score: groupAScore },
      groupB: { entryId: groupB.entryId, nickname: groupB.nickname, score: groupBScore }
    };
  });

  var groupAOrder = ['seoul', 'daejeon', 'gwangju', 'busan'];
  var groupBOrder = ['gwangju', 'seoul', 'busan', 'daejeon'];

  groupAOrder.forEach(function(regionKey, idx){
    var q = qualifierMap[regionKey].groupA;
    data.arcade_archive_finals_a.push({
      season: season,
      seed: idx + 1,
      region: regionKey,
      regionLabel: getRegionShortLabel_(regionKey),
      entryId: q.entryId,
      nickname: q.nickname,
      score: q.score + (4 - idx) * 220
    });
  });

  groupBOrder.forEach(function(regionKey, idx){
    var q = qualifierMap[regionKey].groupB;
    data.arcade_archive_finals_b.push({
      season: season,
      seed: idx + 1,
      region: regionKey,
      regionLabel: getRegionShortLabel_(regionKey),
      entryId: q.entryId,
      nickname: q.nickname,
      score: q.score + (4 - idx) * 180
    });
  });

  var aRows = data.arcade_archive_finals_a;
  var bRows = data.arcade_archive_finals_b;
  var finals = [
    { matchNo: 1, left: aRows[0], right: bRows[3], winner: 'left' },
    { matchNo: 2, left: aRows[1], right: bRows[2], winner: 'left' },
    { matchNo: 3, left: aRows[2], right: bRows[1], winner: 'right' },
    { matchNo: 4, left: aRows[3], right: bRows[0], winner: 'right' }
  ];

  finals.forEach(function(m){
    data.arcade_archive_finals_matches.push({
      season: season,
      matchNo: m.matchNo,
      leftSeed: m.left.seed,
      leftRegion: m.left.region,
      leftRegionLabel: m.left.regionLabel,
      leftEntryId: m.left.entryId,
      leftNickname: m.left.nickname,
      rightSeed: m.right.seed,
      rightRegion: m.right.region,
      rightRegionLabel: m.right.regionLabel,
      rightEntryId: m.right.entryId,
      rightNickname: m.right.nickname,
      winnerEntryId: m.winner === 'left' ? m.left.entryId : m.right.entryId,
      note: '8강 결과 반영'
    });
  });

  return data;
}

function handleSeedArchiveSample_(params) {
  var overwrite = params && toBool_(params.overwrite);
  if (!overwrite) {
    return {
      ok: false,
      error: 'Set params.overwrite=true to write sample data'
    };
  }

  var ss = getSs_();
  var schemas = getSheetSchemas_('archive');

  var sample = buildArchiveFinishedSample2026_();
  var written = schemas.map(function(schema){
    var count = replaceTableRows_(
      ss,
      schema.name,
      schema.headers,
      sample[schema.name] || []
    );
    return {
      sheet: schema.name,
      rows: count
    };
  });

  return {
    ok: true,
    data: {
      season: '2026',
      replaced: true,
      sheets: written
    }
  };
}

function seedArchiveFinishedExample2026() {
  return handleSeedArchiveSample_({ overwrite: true });
}

function readTable_(sheetName) {
  var sh = getSheet_(sheetName);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return { headers: values[0] || [], rows: [] };
  var headers = values[0].map(function(h){ return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    // skip fully empty rows
    var empty = true;
    for (var j = 0; j < headers.length; j++) {
      if (row[j] !== '' && row[j] !== null && row[j] !== undefined) { empty = false; break; }
    }
    if (empty) continue;

    var obj = {};
    for (var k = 0; k < headers.length; k++) obj[headers[k]] = row[k];
    rows.push(obj);
  }
  return { headers: headers, rows: rows };
}

function readOptionalTable_(sheetName) {
  var ss = getSs_();
  var sh = ss.getSheetByName(sheetName);
  if (!sh) return { headers: [], rows: [] };

  var values = sh.getDataRange().getValues();
  if (values.length < 2) return { headers: values[0] || [], rows: [] };

  var headers = values[0].map(function(h){ return String(h).trim(); });
  var rows = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var empty = true;
    for (var j = 0; j < headers.length; j++) {
      if (row[j] !== '' && row[j] !== null && row[j] !== undefined) { empty = false; break; }
    }
    if (empty) continue;

    var obj = {};
    for (var k = 0; k < headers.length; k++) obj[headers[k]] = row[k];
    rows.push(obj);
  }

  return { headers: headers, rows: rows };
}

function trim_(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function toNumber_(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return isNaN(value) ? fallback : value;

  var n = Number(String(value).replace(/,/g, '').trim());
  return isNaN(n) ? fallback : n;
}

function normalizeRegionKey_(value) {
  var s = trim_(value).toLowerCase();
  if (!s) return '';
  if (s === 'seoul' || s.indexOf('서울') >= 0 || s.indexOf('1차') >= 0) return 'seoul';
  if (s === 'daejeon' || s.indexOf('대전') >= 0 || s.indexOf('2차') >= 0) return 'daejeon';
  if (s === 'gwangju' || s.indexOf('광주') >= 0 || s.indexOf('3차') >= 0) return 'gwangju';
  if (s === 'busan' || s.indexOf('부산') >= 0 || s.indexOf('4차') >= 0) return 'busan';
  return '';
}

function getRegionLabel_(key) {
  if (key === 'seoul') return '1차 서울';
  if (key === 'daejeon') return '2차 대전';
  if (key === 'gwangju') return '3차 광주';
  if (key === 'busan') return '4차 부산';
  return key;
}

function getRegionShortLabel_(key) {
  if (key === 'seoul') return '서울';
  if (key === 'daejeon') return '대전';
  if (key === 'gwangju') return '광주';
  if (key === 'busan') return '부산';
  return key;
}

function makeParticipant_(entryId, nickname, seed, fallbackPrefix, index) {
  var id = trim_(entryId);
  var name = trim_(nickname);
  var resolvedId = id || ('E-UNK-' + (index + 1));
  var resolvedName = name || id || ((fallbackPrefix || '선수') + ' ' + (index + 1));
  var participant = {
    entryId: resolvedId,
    nickname: resolvedName
  };
  if (seed !== null && seed !== undefined && seed !== '') {
    var parsedSeed = toNumber_(seed, null);
    if (parsedSeed !== null) participant.seed = parsedSeed;
  }
  return participant;
}

function buildArcadeArchive2026_() {
  var season = '2026';
  var regionDefs = [
    { key: 'seoul', label: '1차 서울', shortLabel: '서울' },
    { key: 'daejeon', label: '2차 대전', shortLabel: '대전' },
    { key: 'gwangju', label: '3차 광주', shortLabel: '광주' },
    { key: 'busan', label: '4차 부산', shortLabel: '부산' }
  ];

  var regionMap = {};
  regionDefs.forEach(function(def){
    regionMap[def.key] = {
      key: def.key,
      label: def.label,
      shortLabel: def.shortLabel,
      onlineRows: [],
      swissMatches: [],
      swissStandings: [],
      deciderRows: [],
      seedingRows: [],
      qualifiers: {}
    };
  });

  function resolveRegion_(raw) {
    var key = normalizeRegionKey_(raw);
    return key && regionMap[key] ? key : '';
  }

  readOptionalTable_('arcade_archive_online').rows.forEach(function(r){
    var rowSeason = trim_(r.season);
    if (rowSeason && rowSeason !== season) return;

    var key = resolveRegion_(r.region);
    if (!key) return;

    var score1 = toNumber_(r.score1, 0);
    var score2 = toNumber_(r.score2, 0);
    var rank = toNumber_(r.rank, regionMap[key].onlineRows.length + 1);

    regionMap[key].onlineRows.push({
      rank: rank,
      entryId: trim_(r.entryId) || ('E-UNK-' + rank),
      nickname: trim_(r.nickname) || ('선수 ' + rank),
      score1: score1,
      score2: score2,
      total: toNumber_(r.total, score1 + score2),
      submittedAt: trim_(r.submittedAt),
      advanced: toBool_(r.advanced)
    });
  });

  readOptionalTable_('arcade_archive_swiss_matches').rows.forEach(function(r, idx){
    var rowSeason = trim_(r.season);
    if (rowSeason && rowSeason !== season) return;

    var key = resolveRegion_(r.region);
    if (!key) return;

    var games = [];
    var song1 = trim_(r.song1);
    var song2 = trim_(r.song2);
    var song3 = trim_(r.song3);

    if (song1) {
      games.push({
        song: song1,
        level: trim_(r.level1),
        p1Score: toNumber_(r.p1Score1, 0),
        p2Score: toNumber_(r.p2Score1, 0)
      });
    }
    if (song2) {
      games.push({
        song: song2,
        level: trim_(r.level2),
        p1Score: toNumber_(r.p1Score2, 0),
        p2Score: toNumber_(r.p2Score2, 0)
      });
    }
    if (song3) {
      games.push({
        song: song3,
        level: trim_(r.level3),
        p1Score: toNumber_(r.p1Score3, 0),
        p2Score: toNumber_(r.p2Score3, 0)
      });
    }

    var p1 = makeParticipant_(r.p1EntryId, r.p1Nickname, r.p1Seed, 'P1', idx);
    var p2Id = trim_(r.p2EntryId);
    var p2Name = trim_(r.p2Nickname);
    var bye = toBool_(r.bye) || (!p2Id && !p2Name);

    var match = {
      round: toNumber_(r.round, 1),
      table: toNumber_(r.table, idx + 1),
      highSeedEntryId: trim_(r.highSeedEntryId),
      player1: p1,
      games: games,
      winnerEntryId: trim_(r.winnerEntryId),
      tieBreakerSong: trim_(r.tieBreakerSong),
      bye: bye,
      note: trim_(r.note)
    };

    if (!bye) {
      match.player2 = makeParticipant_(r.p2EntryId, r.p2Nickname, r.p2Seed, 'P2', idx);
    }

    regionMap[key].swissMatches.push(match);
  });

  readOptionalTable_('arcade_archive_swiss_standings').rows.forEach(function(r, idx){
    var rowSeason = trim_(r.season);
    if (rowSeason && rowSeason !== season) return;

    var key = resolveRegion_(r.region);
    if (!key) return;

    var entryId = trim_(r.entryId) || ('E-UNK-' + (idx + 1));
    var status = trim_(r.status).toLowerCase();
    if (status !== 'qualified' && status !== 'decider' && status !== 'eliminated') {
      status = 'alive';
    }

    regionMap[key].swissStandings.push({
      entryId: entryId,
      nickname: trim_(r.nickname) || entryId,
      seed: toNumber_(r.seed, idx + 1),
      wins: toNumber_(r.wins, 0),
      losses: toNumber_(r.losses, 0),
      status: status
    });
  });

  readOptionalTable_('arcade_archive_decider').rows.forEach(function(r){
    var rowSeason = trim_(r.season);
    if (rowSeason && rowSeason !== season) return;

    var key = resolveRegion_(r.region);
    if (!key) return;

    var rank = toNumber_(r.rank, regionMap[key].deciderRows.length + 1);
    var entryId = trim_(r.entryId) || ('E-UNK-' + rank);

    regionMap[key].deciderRows.push({
      rank: rank,
      entryId: entryId,
      nickname: trim_(r.nickname) || entryId,
      score: toNumber_(r.score, 0),
      note: trim_(r.note)
    });

    if (toBool_(r.winner) || trim_(r.winnerEntryId) === entryId) {
      regionMap[key].deciderWinnerEntryId = entryId;
    }
  });

  readOptionalTable_('arcade_archive_seeding').rows.forEach(function(r){
    var rowSeason = trim_(r.season);
    if (rowSeason && rowSeason !== season) return;

    var key = resolveRegion_(r.region);
    if (!key) return;

    var rank = toNumber_(r.rank, regionMap[key].seedingRows.length + 1);
    var entryId = trim_(r.entryId) || ('E-UNK-' + rank);

    regionMap[key].seedingRows.push({
      rank: rank,
      entryId: entryId,
      nickname: trim_(r.nickname) || entryId,
      score: toNumber_(r.score, 0),
      note: trim_(r.note)
    });
  });

  readOptionalTable_('arcade_archive_qualifiers').rows.forEach(function(r, idx){
    var rowSeason = trim_(r.season);
    if (rowSeason && rowSeason !== season) return;

    var key = resolveRegion_(r.region);
    if (!key) return;

    var group = trim_(r.group).toUpperCase();
    var participant = makeParticipant_(r.entryId, r.nickname, r.seed, 'Q', idx);
    if (group === 'A' || group === 'GROUPA' || group === '1') {
      regionMap[key].qualifiers.groupA = participant;
    } else if (group === 'B' || group === 'GROUPB' || group === '2') {
      regionMap[key].qualifiers.groupB = participant;
    }
  });

  var groupASeeds = readOptionalTable_('arcade_archive_finals_a').rows.map(function(r, idx){
    var regionKey = resolveRegion_(r.region) || regionDefs[Math.min(idx, regionDefs.length - 1)].key;
    var seed = toNumber_(r.seed, idx + 1);
    var entryId = trim_(r.entryId) || ('E-UNK-A' + seed);
    var row = {
      seed: seed,
      regionKey: regionKey,
      regionLabel: trim_(r.regionLabel) || getRegionShortLabel_(regionKey),
      entryId: entryId,
      nickname: trim_(r.nickname) || entryId
    };
    var score = toNumber_(r.score, null);
    if (score !== null) row.score = score;
    return row;
  });

  var groupBSeeds = readOptionalTable_('arcade_archive_finals_b').rows.map(function(r, idx){
    var regionKey = resolveRegion_(r.region) || regionDefs[Math.min(idx, regionDefs.length - 1)].key;
    var seed = toNumber_(r.seed, idx + 1);
    var entryId = trim_(r.entryId) || ('E-UNK-B' + seed);
    var row = {
      seed: seed,
      regionKey: regionKey,
      regionLabel: trim_(r.regionLabel) || getRegionShortLabel_(regionKey),
      entryId: entryId,
      nickname: trim_(r.nickname) || entryId
    };
    var score = toNumber_(r.score, null);
    if (score !== null) row.score = score;
    return row;
  });

  var crossMatches = readOptionalTable_('arcade_archive_finals_matches').rows.map(function(r, idx){
    var leftRegionKey = resolveRegion_(r.leftRegion) || 'seoul';
    var rightRegionKey = resolveRegion_(r.rightRegion) || 'busan';

    return {
      matchNo: toNumber_(r.matchNo, idx + 1),
      left: {
        seed: toNumber_(r.leftSeed, 1),
        regionKey: leftRegionKey,
        regionLabel: trim_(r.leftRegionLabel) || getRegionShortLabel_(leftRegionKey),
        entryId: trim_(r.leftEntryId) || ('E-UNK-L' + (idx + 1)),
        nickname: trim_(r.leftNickname) || trim_(r.leftEntryId) || ('Left ' + (idx + 1))
      },
      right: {
        seed: toNumber_(r.rightSeed, 1),
        regionKey: rightRegionKey,
        regionLabel: trim_(r.rightRegionLabel) || getRegionShortLabel_(rightRegionKey),
        entryId: trim_(r.rightEntryId) || ('E-UNK-R' + (idx + 1)),
        nickname: trim_(r.rightNickname) || trim_(r.rightEntryId) || ('Right ' + (idx + 1))
      },
      winnerEntryId: trim_(r.winnerEntryId),
      note: trim_(r.note)
    };
  });

  var regions = regionDefs.map(function(def){
    var region = regionMap[def.key];
    region.onlineRows.sort(function(a,b){ return a.rank - b.rank; });
    region.swissStandings.sort(function(a,b){
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.seed - b.seed;
    });
    region.deciderRows.sort(function(a,b){ return a.rank - b.rank; });
    region.seedingRows.sort(function(a,b){ return a.rank - b.rank; });
    region.swissMatches.sort(function(a,b){
      if (a.round !== b.round) return a.round - b.round;
      return (a.table || 0) - (b.table || 0);
    });
    return region;
  });

  return {
    season: season,
    title: '아케이드 예선 아카이브',
    songs: {
      online1: 'うそうそ時 (Lv.8)',
      online2: '輝きを求めて (Lv.8)',
      decider31: '大空と太鼓の踊り (Lv.9)',
      seeding: 'タイコロール (Lv.10)'
    },
    regions: regions,
    finals: {
      groupASeeds: groupASeeds,
      groupBSeeds: groupBSeeds,
      crossMatches: crossMatches
    }
  };
}

function handleSite_() {
  var cfg = readTable_('site_config').rows;
  var map = {};
  cfg.forEach(function(r){
    var key = String(r.key || '').trim();
    if (!key) return;
    map[key] = r.value;
  });

  var partnersRows = readTable_('partners').rows
    .filter(function(r){ return toBool_(r.enabled); })
    .sort(function(a,b){ return Number(a.order||0) - Number(b.order||0); })
    .map(function(r){
      return {
        order: Number(r.order||0),
        name: String(r.name||'').trim(),
        logoUrl: String(r.logoUrl||'').trim(),
        href: String(r.href||'').trim(),
      };
    });

  var data = {
    eventName: String(map.eventName || ''),
    catchphrase: String(map.catchphrase || ''),
    contactEmail: String(map.contactEmail || ''),
    kakaoChannelUrl: String(map.kakaoChannelUrl || ''),
    heroBgType: String(map.heroBgType || 'image'),
    heroBgUrl: String(map.heroBgUrl || ''),
    heroBgPosterUrl: String(map.heroBgPosterUrl || ''),
    applyOpen: toBool_(map.applyOpen),
    applyNotice: String(map.applyNotice || ''),
    footerInfoMd: String(map.footerInfoMd || ''),
    rulesLastUpdated: String(map.rulesLastUpdated || ''),
    partners: partnersRows
  };

  return { ok: true, data: data };
}

function handleSchedule_() {
  var rows = readTable_('schedule').rows
    .sort(function(a,b){ return Number(a.order||0) - Number(b.order||0); })
    .map(function(r){
      return {
        order: Number(r.order||0),
        division: String(r.division||'').trim(),
        title: String(r.title||'').trim(),
        startDate: isoDate_(r.startDate),
        endDate: isoDate_(r.endDate),
        dateText: String(r.dateText||'').trim(),
        location: String(r.location||'').trim(),
        status: String(r.status||'').trim(),
        note: String(r.note||'').trim()
      };
    });
  return { ok: true, data: { items: rows } };
}

function handleContent_(params) {
  var page = params && params.page ? String(params.page).trim() : '';
  var allowed = { home:true, console:true, arcade:true, contact:true };
  if (!allowed[page]) return { ok:false, error: 'Invalid page' };

  var rows = readTable_('content_sections').rows
    .filter(function(r){ return String(r.page||'').trim() === page; })
    .filter(function(r){ return toBool_(r.enabled); })
    .sort(function(a,b){ return Number(a.order||0) - Number(b.order||0); })
    .map(function(r){
      return {
        page: String(r.page||'').trim(),
        sectionKey: String(r.sectionKey||'').trim(),
        order: Number(r.order||0),
        title: String(r.title||'').trim(),
        bodyMd: String(r.bodyMd||''),
        imageUrl: String(r.imageUrl||'').trim(),
      };
    });

  return { ok: true, data: { page: page, sections: rows } };
}

function handleResults_() {
  var stages = readTable_('results_stage').rows
    .sort(function(a,b){
      var da = String(a.division||'');
      var db = String(b.division||'');
      if (da < db) return -1;
      if (da > db) return 1;
      return Number(a.order||0) - Number(b.order||0);
    })
    .map(function(r){
      return {
        division: String(r.division||'').trim(),
        stageKey: String(r.stageKey||'').trim(),
        stageLabel: String(r.stageLabel||'').trim(),
        order: Number(r.order||0),
        status: String(r.status||'').trim(),
        updatedAt: isoDateTime_(r.updatedAt),
        note: String(r.note||'').trim(),
      };
    });

  var rows = readTable_('results_rows').rows
    .map(function(r){
      return {
        division: String(r.division||'').trim(),
        stageKey: String(r.stageKey||'').trim(),
        rank: Number(r.rank||0),
        nickname: String(r.nickname||'').trim(),
        score: (r.score === '' || r.score === null || r.score === undefined) ? null : Number(r.score),
        detail: String(r.detail||'').trim(),
        updatedAt: isoDateTime_(r.updatedAt),
      };
    });

  // group rows by division+stageKey
  var map = {};
  rows.forEach(function(rr){
    var key = rr.division + '::' + rr.stageKey;
    if (!map[key]) map[key] = [];
    map[key].push(rr);
  });
  Object.keys(map).forEach(function(k){
    map[k].sort(function(a,b){ return a.rank - b.rank; });
  });

  function assemble(division) {
    return stages
      .filter(function(s){ return s.division === division; })
      .map(function(s){
        var key = s.division + '::' + s.stageKey;
        return {
          stageKey: s.stageKey,
          stageLabel: s.stageLabel,
          order: s.order,
          status: s.status,
          note: s.note,
          updatedAt: s.updatedAt,
          rows: map[key] || []
        };
      });
  }

  var arcadeArchive2026 = buildArcadeArchive2026_();

  return {
    ok: true,
    data: {
      console: assemble('console'),
      arcade: assemble('arcade'),
      arcadeArchive2026: arcadeArchive2026
    }
  };
}

function validateRegister_(p) {
  if (!p || typeof p !== 'object') return 'Invalid payload';
  var division = String(p.division||'').trim();
  if (division !== 'console' && division !== 'arcade') return 'division must be console or arcade';

  function req(field) {
    var v = String(p[field]||'').trim();
    if (!v) throw new Error(field + ' is required');
    return v;
  }

  var name = req('name');
  var phone = req('phone');
  var email = req('email');
  var nickname = req('nickname');
  var cardNo = req('cardNo');

  var privacyAgree = toBool_(p.privacyAgree);
  if (!privacyAgree) throw new Error('privacyAgree must be true');

  var isMinor = toBool_(p.isMinor);
  var consentLink = String(p.consentLink||'').trim();
  if (isMinor && !consentLink) throw new Error('consentLink is required when isMinor=true');

  // very lightweight email check
  if (email.indexOf('@') < 1) throw new Error('email looks invalid');

  return null;
}

function makeReceiptId_() {
  var tz = Session.getScriptTimeZone();
  var day = Utilities.formatDate(new Date(), tz, 'yyyyMMdd');
  var rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return 'TKC2026-' + day + '-' + rand;
}

function handleRegister_(payload) {
  var err = validateRegister_(payload);
  if (err) return { ok:false, error: err };

  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sh = getSheet_('registrations');

    // Ensure header exists
    if (sh.getLastRow() < 1) {
      throw new Error('registrations sheet is missing header row');
    }

    var headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(function(h){ return String(h).trim(); });
    var now = new Date();
    var receiptId = makeReceiptId_();

    var record = {
      createdAt: now,
      receiptId: receiptId,
      division: String(payload.division||'').trim(),
      name: String(payload.name||'').trim(),
      phone: String(payload.phone||'').trim(),
      email: String(payload.email||'').trim(),
      nickname: String(payload.nickname||'').trim(),
      cardNo: String(payload.cardNo||'').trim(),
      dohirobaNo: String(payload.dohirobaNo||'').trim(),
      spectator: toBool_(payload.spectator),
      isMinor: toBool_(payload.isMinor),
      consentLink: String(payload.consentLink||'').trim(),
      privacyAgree: toBool_(payload.privacyAgree),
      status: 'received',
      memo: ''
    };

    var row = headers.map(function(h){
      if (h === 'createdAt') return record.createdAt;
      return record[h] !== undefined ? record[h] : '';
    });

    sh.appendRow(row);

    return { ok: true, data: { receiptId: receiptId } };
  } finally {
    lock.releaseLock();
  }
}

function requireApiKey_(apiKey) {
  var expected = PropertiesService.getScriptProperties().getProperty('API_KEY');
  if (!expected) throw new Error('Missing Script Property API_KEY');
  if (!apiKey || String(apiKey) !== String(expected)) {
    return false;
  }
  return true;
}

function doGet(e) {
  // Useful for quick health check in browser:
  return json_({ ok: true, message: 'TKC2026 GAS API is running. Use POST.' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json_({ ok:false, error:'No postData' });
    }

    var body = JSON.parse(e.postData.contents);

    if (!requireApiKey_(body.apiKey)) {
      return json_({ ok:false, error:'Unauthorized' });
    }

    var action = String(body.action || '').trim();
    var params = body.params || {};
    var payload = body.payload || null;

    if (action === 'site') {
      return json_(executeCachedAction_('site', params, function(){
        return handleSite_();
      }));
    }
    if (action === 'schedule') {
      return json_(executeCachedAction_('schedule', params, function(){
        return handleSchedule_();
      }));
    }
    if (action === 'content') {
      return json_(executeCachedAction_('content', params, function(){
        return handleContent_(params);
      }));
    }
    if (action === 'results') {
      return json_(executeCachedAction_('results', params, function(){
        return handleResults_();
      }));
    }

    if (action === 'initSheets') {
      var initResult = handleInitSheets_(params);
      if (initResult.ok) purgeApiCache_();
      return json_(initResult);
    }
    if (action === 'initAndFormatSheets') {
      var initAndFormatResult = handleInitAndFormat_(params);
      if (initAndFormatResult.ok) purgeApiCache_();
      return json_(initAndFormatResult);
    }
    if (action === 'formatSheets') return json_(handleFormatSheets_(params));
    if (action === 'clearSheetRows') {
      var clearResult = handleClearSheetRows_(params);
      if (clearResult.ok) purgeApiCache_();
      return json_(clearResult);
    }
    if (action === 'seedArchiveSample') {
      var seedResult = handleSeedArchiveSample_(params);
      if (seedResult.ok) purgeApiCache_();
      return json_(seedResult);
    }
    if (action === 'opsInit') return json_(handleOpsInit_(params));
    if (action === 'opsGuide') return json_(handleOpsGuide_(params));
    if (action === 'opsUpsert') return json_(handleOpsUpsert_(payload));
    if (action === 'opsExport') return json_(handleOpsExport_(payload || params));
    if (action === 'opsFeed') return json_(handleOpsFeed_(params));
    if (action === 'purgeCache') return json_(purgeApiCache_());
    if (action === 'register') return json_(handleRegister_(payload));

    return json_({ ok:false, error:'Unknown action' });
  } catch (err) {
    return json_({ ok:false, error:String(err) });
  }
}

/**
 * TKC2026 Ops Extension (append to existing Code.gs)
 *
 * Adds actions:
 * - opsInit   : create ops_db_* tabs
 * - opsUpsert : write/update one row into ops_db_*
 * - opsExport : copy ops_db_* -> arcade_archive_* (incremental upsert)
 * - opsFeed   : build archive payload from ops_db_* for broadcast/control pages
 *
 * Required existing helpers from your current Code.gs:
 * - getSs_()
 * - ensureSheetSchema_(ss, name, headers)
 * - readOptionalTable_(sheetName)
 * - trim_(value)
 * - toBool_(value)
 * - toNumber_(value, fallback)
 * - normalizeRegionKey_(value)
 * - getRegionShortLabel_(key)
 */

function getOpsSheetSchemas_() {
  return [
    {
      name: 'ops_db_online',
      headers: ['season', 'region', 'rank', 'entryId', 'nickname', 'score1', 'score2', 'total', 'submittedAt', 'advanced']
    },
    {
      name: 'ops_db_swiss_matches',
      headers: ['season', 'region', 'round', 'table', 'highSeedEntryId', 'p1EntryId', 'p1Nickname', 'p1Seed', 'p2EntryId', 'p2Nickname', 'p2Seed', 'song1', 'level1', 'p1Score1', 'p2Score1', 'song2', 'level2', 'p1Score2', 'p2Score2', 'song3', 'level3', 'p1Score3', 'p2Score3', 'winnerEntryId', 'tieBreakerSong', 'bye', 'note']
    },
    {
      name: 'ops_db_swiss_standings',
      headers: ['season', 'region', 'entryId', 'nickname', 'seed', 'wins', 'losses', 'status']
    },
    {
      name: 'ops_db_decider',
      headers: ['season', 'region', 'rank', 'entryId', 'nickname', 'score', 'winner', 'winnerEntryId', 'note']
    },
    {
      name: 'ops_db_seeding',
      headers: ['season', 'region', 'rank', 'entryId', 'nickname', 'score', 'note']
    },
    {
      name: 'ops_db_qualifiers',
      headers: ['season', 'region', 'group', 'entryId', 'nickname', 'seed']
    },
    {
      name: 'ops_db_finals_a',
      headers: ['season', 'seed', 'region', 'regionLabel', 'entryId', 'nickname', 'score']
    },
    {
      name: 'ops_db_finals_b',
      headers: ['season', 'seed', 'region', 'regionLabel', 'entryId', 'nickname', 'score']
    },
    {
      name: 'ops_db_finals_matches',
      headers: ['season', 'matchNo', 'leftSeed', 'leftRegion', 'leftRegionLabel', 'leftEntryId', 'leftNickname', 'rightSeed', 'rightRegion', 'rightRegionLabel', 'rightEntryId', 'rightNickname', 'winnerEntryId', 'note']
    },
    {
      name: 'ops_db_events',
      headers: ['createdAt', 'stage', 'season', 'region', 'entryId', 'message']
    }
  ];
}

function getOpsStageConfig_() {
  return {
    online: {
      sheet: 'ops_db_online',
      keyFields: ['season', 'region', 'entryId']
    },
    swissMatch: {
      sheet: 'ops_db_swiss_matches',
      keyFields: ['season', 'region', 'round', 'table']
    },
    swissStanding: {
      sheet: 'ops_db_swiss_standings',
      keyFields: ['season', 'region', 'entryId']
    },
    decider: {
      sheet: 'ops_db_decider',
      keyFields: ['season', 'region', 'entryId']
    },
    seeding: {
      sheet: 'ops_db_seeding',
      keyFields: ['season', 'region', 'entryId']
    },
    qualifier: {
      sheet: 'ops_db_qualifiers',
      keyFields: ['season', 'region', 'group']
    },
    finalA: {
      sheet: 'ops_db_finals_a',
      keyFields: ['season', 'seed']
    },
    finalB: {
      sheet: 'ops_db_finals_b',
      keyFields: ['season', 'seed']
    },
    finalMatch: {
      sheet: 'ops_db_finals_matches',
      keyFields: ['season', 'matchNo']
    }
  };
}

function handleOpsInit_(params) {
  var ss = getSs_();
  var schemas = getOpsSheetSchemas_();
  var created = 0;
  var updated = 0;
  var sheets = [];

  for (var i = 0; i < schemas.length; i++) {
    var schema = schemas[i];
    var result = ensureSheetSchema_(ss, schema.name, schema.headers);
    if (result.created) created++;
    if (result.headerUpdated) updated++;
    sheets.push(result);
  }

  return {
    ok: true,
    data: {
      total: schemas.length,
      created: created,
      headerUpdated: updated,
      sheets: sheets
    }
  };
}

function getOpsGuideSchema_(sheetName) {
  var name = trim_(sheetName) || 'ops_sheet_guide';
  return {
    name: name,
    headers: ['순번', '시트명', '용도', '수정타이밍', '필수입력', '입력예시', '운영메모']
  };
}

function buildOpsGuideRows_() {
  return [
    {
      '순번': 1,
      '시트명': 'ops_db_online',
      '용도': '지역 온라인 예선 랭킹 입력(시드 기준 데이터)',
      '수정타이밍': '각 지역 주차 시작 전 또는 온라인 점수 확정 직후',
      '필수입력': 'season, region, rank, entryId, nickname, score1, score2, advanced',
      '입력예시': '2026, seoul, 1, SEO-01, 서울선수01, 996000, 994000, TRUE',
      '운영메모': '선수 1명당 1행. total은 비워도 opsUpsert 시 자동 계산 가능.'
    },
    {
      '순번': 2,
      '시트명': 'ops_db_swiss_matches',
      '용도': '스위스 라운드 매치별 대진/선곡/점수/승자 입력',
      '수정타이밍': '라운드 시작 전 대진/선곡 선입력 + 경기 종료 직후 점수/승자 업데이트',
      '필수입력': 'season, region, round, table, p1EntryId, p2EntryId, song1, song2, winnerEntryId',
      '입력예시': '2026, seoul, 1, 1, SEO-01, SEO-16, 과제곡A, 과제곡B, SEO-01',
      '운영메모': '테이블(매치) 1개당 1행. 부전승은 bye=TRUE, p2 관련 칸 비움.'
    },
    {
      '순번': 3,
      '시트명': 'ops_db_swiss_standings',
      '용도': '스위스 라운드 중간/최종 순위표',
      '수정타이밍': '각 라운드 종료 후 일괄 갱신 또는 지역 최종 확정 시',
      '필수입력': 'season, region, entryId, nickname, seed, wins, losses, status',
      '입력예시': '2026, seoul, SEO-01, 서울선수01, 1, 3, 0, qualified',
      '운영메모': 'status 권장값: qualified / decider / eliminated / alive'
    },
    {
      '순번': 4,
      '시트명': 'ops_db_decider',
      '용도': '데시더 라운드 점수/순위 및 승자 확정',
      '수정타이밍': '데시더 경기 종료 후 즉시',
      '필수입력': 'season, region, rank, entryId, nickname, score, winner',
      '입력예시': '2026, seoul, 1, SEO-02, 서울선수02, 994500, TRUE',
      '운영메모': 'winner=TRUE이면 winnerEntryId는 entryId 기준으로 자동 보정 가능.'
    },
    {
      '순번': 5,
      '시트명': 'ops_db_seeding',
      '용도': '지역 대표 A/B 시드 산정용 점수표',
      '수정타이밍': '지역별 본선 진출자 확정 직후',
      '필수입력': 'season, region, rank, entryId, nickname, score',
      '입력예시': '2026, seoul, 1, SEO-01, 서울선수01, 997100',
      '운영메모': '보통 지역당 2행(1위=A그룹, 2위=B그룹).'
    },
    {
      '순번': 6,
      '시트명': 'ops_db_qualifiers',
      '용도': '최종 본선 진출자 A/B 그룹 확정',
      '수정타이밍': '그룹 배정이 확정되는 즉시',
      '필수입력': 'season, region, group, entryId, nickname, seed',
      '입력예시': '2026, seoul, A, SEO-01, 서울선수01, 1',
      '운영메모': 'group 값은 반드시 A 또는 B.'
    },
    {
      '순번': 7,
      '시트명': 'ops_db_finals_a',
      '용도': '본선 대진용 A그룹 시드 리스트',
      '수정타이밍': '본선 시드 확정 시',
      '필수입력': 'season, seed, region, entryId, nickname',
      '입력예시': '2026, 1, seoul, SEO-01, 서울선수01',
      '운영메모': '시드 1개당 1행.'
    },
    {
      '순번': 8,
      '시트명': 'ops_db_finals_b',
      '용도': '본선 대진용 B그룹 시드 리스트',
      '수정타이밍': '본선 시드 확정 시',
      '필수입력': 'season, seed, region, entryId, nickname',
      '입력예시': '2026, 1, gwangju, GWA-02, 광주선수02',
      '운영메모': '시드 1개당 1행.'
    },
    {
      '순번': 9,
      '시트명': 'ops_db_finals_matches',
      '용도': '본선(8강) 교차 대진 및 승자 기록',
      '수정타이밍': '매치 시작 전 대진 입력 + 매치 종료 후 승자 반영',
      '필수입력': 'season, matchNo, leftEntryId, rightEntryId, winnerEntryId',
      '입력예시': '2026, 1, SEO-01, BUS-02, SEO-01',
      '운영메모': '송출 화면 가독성을 위해 left/right 지역/시드 메타도 함께 입력 권장.'
    },
    {
      '순번': 10,
      '시트명': 'ops_db_events',
      '용도': '운영 로그(자동 누적)',
      '수정타이밍': '수동 수정 금지',
      '필수입력': 'createdAt, stage, season, region, entryId, message',
      '입력예시': '(자동 기록)',
      '운영메모': 'opsUpsert/opsExport/opsGuide 실행 시 자동 추가됨.'
    }
  ];
}

function handleOpsGuide_(params) {
  params = params || {};
  var overwrite = params.overwrite === undefined ? true : toBool_(params.overwrite);
  var schema = getOpsGuideSchema_(params.sheetName);
  var rows = buildOpsGuideRows_();

  var ss = getSs_();
  ensureSheetSchema_(ss, schema.name, schema.headers);
  var sh = ss.getSheetByName(schema.name);

  var lastRow = sh.getLastRow();
  if (overwrite && lastRow > 1) {
    sh.getRange(2, 1, lastRow - 1, schema.headers.length).clearContent();
  }

  var values = rows.map(function(row){
    return schema.headers.map(function(header){
      return row[header] !== undefined ? row[header] : '';
    });
  });

  if (values.length > 0) {
    sh.getRange(2, 1, values.length, schema.headers.length).setValues(values);
  }
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, schema.headers.length);

  appendOpsEvent_('guide', '', '', '', 'guide rows=' + values.length + ', sheet=' + schema.name);

  return {
    ok: true,
    data: {
      sheet: schema.name,
      rows: values.length,
      overwrite: overwrite
    }
  };
}

function upsertSheetRow_(sheet, headers, keyFields, rowObj) {
  var keyIndexes = [];
  for (var i = 0; i < keyFields.length; i++) {
    var idx = headers.indexOf(keyFields[i]);
    if (idx < 0) throw new Error('Unknown key field: ' + keyFields[i]);
    keyIndexes.push(idx);
  }

  var targetValues = headers.map(function(h){
    return rowObj[h] !== undefined ? rowObj[h] : '';
  });

  var lastRow = sheet.getLastRow();
  var rowNumber = -1;

  if (lastRow > 1) {
    var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
    for (var r = 0; r < data.length; r++) {
      var same = true;
      for (var k = 0; k < keyIndexes.length; k++) {
        var col = keyIndexes[k];
        var existing = trim_(data[r][col]);
        var incoming = trim_(targetValues[col]);
        if (existing !== incoming) {
          same = false;
          break;
        }
      }
      if (same) {
        rowNumber = r + 2;
        break;
      }
    }
  }

  if (rowNumber > 0) {
    sheet.getRange(rowNumber, 1, 1, headers.length).setValues([targetValues]);
    return { rowNumber: rowNumber, mode: 'updated' };
  }

  sheet.appendRow(targetValues);
  return { rowNumber: sheet.getLastRow(), mode: 'inserted' };
}

function appendOpsEvent_(stage, season, region, entryId, message) {
  var schema = getOpsSheetSchemas_().filter(function(s){ return s.name === 'ops_db_events'; })[0];
  if (!schema) return;

  var ss = getSs_();
  ensureSheetSchema_(ss, schema.name, schema.headers);
  var sh = ss.getSheetByName(schema.name);
  sh.appendRow([new Date(), stage || '', season || '', region || '', entryId || '', message || '']);
}

function handleOpsUpsert_(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Invalid payload' };
  }

  var stage = trim_(payload.stage);
  var stageConfig = getOpsStageConfig_()[stage];
  if (!stageConfig) {
    return { ok: false, error: 'Unknown stage: ' + stage };
  }

  var row = payload.row;
  if (!row || typeof row !== 'object') {
    return { ok: false, error: 'payload.row is required' };
  }

  var season = trim_(payload.season) || trim_(row.season) || '2026';
  var region = trim_(payload.region) || trim_(row.region);
  var normalizedRegion = normalizeRegionKey_(region);

  var schema = null;
  var schemas = getOpsSheetSchemas_();
  for (var i = 0; i < schemas.length; i++) {
    if (schemas[i].name === stageConfig.sheet) {
      schema = schemas[i];
      break;
    }
  }
  if (!schema) return { ok: false, error: 'Schema not found for stage' };

  var normalized = {};
  for (var h = 0; h < schema.headers.length; h++) {
    var header = schema.headers[h];
    if (header === 'season') normalized[header] = season;
    else if (header === 'region' && normalizedRegion) normalized[header] = normalizedRegion;
    else normalized[header] = row[header] !== undefined ? row[header] : '';
  }

  // Small automatic fixes for convenience
  if (stage === 'online') {
    var s1 = toNumber_(normalized.score1, 0);
    var s2 = toNumber_(normalized.score2, 0);
    if (trim_(normalized.total) === '') normalized.total = s1 + s2;
    normalized.advanced = toBool_(normalized.advanced);
  }
  if (stage === 'swissMatch') {
    normalized.bye = toBool_(normalized.bye);
  }
  if (stage === 'decider') {
    normalized.winner = toBool_(normalized.winner);
    if (normalized.winner && trim_(normalized.winnerEntryId) === '') {
      normalized.winnerEntryId = trim_(normalized.entryId);
    }
  }
  if (stage === 'qualifier') {
    normalized.group = trim_(normalized.group).toUpperCase();
    if (normalized.group !== 'A' && normalized.group !== 'B') {
      return { ok: false, error: 'qualifier.group must be A or B' };
    }
  }

  var ss = getSs_();
  ensureSheetSchema_(ss, schema.name, schema.headers);
  var sh = ss.getSheetByName(schema.name);

  var keys = payload.keyFields && payload.keyFields.length
    ? payload.keyFields
    : stageConfig.keyFields;

  var result = upsertSheetRow_(sh, schema.headers, keys, normalized);
  appendOpsEvent_(
    stage,
    season,
    normalizedRegion,
    trim_(normalized.entryId),
    result.mode + ' row #' + result.rowNumber
  );

  return {
    ok: true,
    data: {
      stage: stage,
      sheet: schema.name,
      season: season,
      region: normalizedRegion || '',
      mode: result.mode,
      rowNumber: result.rowNumber
    }
  };
}

function filterOpsRows_(rows, season, region, isRegionScoped) {
  return rows.filter(function(r){
    var rowSeason = trim_(r.season);
    if (season && rowSeason && rowSeason !== season) return false;

    if (isRegionScoped && region && region !== 'all') {
      return normalizeRegionKey_(r.region) === region;
    }
    return true;
  });
}

function handleOpsExport_(payload) {
  payload = payload || {};

  var season = trim_(payload.season) || '2026';
  var region = trim_(payload.region || 'all').toLowerCase();
  if (region !== 'all') {
    region = normalizeRegionKey_(region);
    if (!region) return { ok: false, error: 'Invalid region' };
  }

  var exportDefs = [
    { from: 'ops_db_online', to: 'arcade_archive_online', keyFields: ['season', 'region', 'entryId'], regionScoped: true },
    { from: 'ops_db_swiss_matches', to: 'arcade_archive_swiss_matches', keyFields: ['season', 'region', 'round', 'table'], regionScoped: true },
    { from: 'ops_db_swiss_standings', to: 'arcade_archive_swiss_standings', keyFields: ['season', 'region', 'entryId'], regionScoped: true },
    { from: 'ops_db_decider', to: 'arcade_archive_decider', keyFields: ['season', 'region', 'entryId'], regionScoped: true },
    { from: 'ops_db_seeding', to: 'arcade_archive_seeding', keyFields: ['season', 'region', 'entryId'], regionScoped: true },
    { from: 'ops_db_qualifiers', to: 'arcade_archive_qualifiers', keyFields: ['season', 'region', 'group'], regionScoped: true },
    { from: 'ops_db_finals_a', to: 'arcade_archive_finals_a', keyFields: ['season', 'seed'], regionScoped: false },
    { from: 'ops_db_finals_b', to: 'arcade_archive_finals_b', keyFields: ['season', 'seed'], regionScoped: false },
    { from: 'ops_db_finals_matches', to: 'arcade_archive_finals_matches', keyFields: ['season', 'matchNo'], regionScoped: false }
  ];

  var archiveSchemas = {};
  var allArchive = getSheetSchemas_('archive');
  for (var a = 0; a < allArchive.length; a++) {
    archiveSchemas[allArchive[a].name] = allArchive[a];
  }

  var ss = getSs_();
  var resultSheets = [];
  var totalWritten = 0;

  for (var i = 0; i < exportDefs.length; i++) {
    var def = exportDefs[i];
    var source = readOptionalTable_(def.from);
    var rows = filterOpsRows_(source.rows, season, region, def.regionScoped);

    var targetSchema = archiveSchemas[def.to];
    if (!targetSchema) continue;

    ensureSheetSchema_(ss, targetSchema.name, targetSchema.headers);
    var targetSheet = ss.getSheetByName(targetSchema.name);
    var written = 0;

    for (var r = 0; r < rows.length; r++) {
      var rowObj = {};
      for (var h = 0; h < targetSchema.headers.length; h++) {
        var header = targetSchema.headers[h];
        rowObj[header] = rows[r][header] !== undefined ? rows[r][header] : '';
      }
      upsertSheetRow_(targetSheet, targetSchema.headers, def.keyFields, rowObj);
      written++;
    }

    totalWritten += written;
    resultSheets.push({ from: def.from, to: def.to, rows: written });
  }

  if (typeof purgeApiCache_ === 'function') {
    try { purgeApiCache_(); } catch (err) {}
  }

  appendOpsEvent_(
    'export',
    season,
    region,
    '',
    'exported rows=' + totalWritten
  );

  return {
    ok: true,
    data: {
      season: season,
      region: region,
      totalSheets: resultSheets.length,
      totalRows: totalWritten,
      sheets: resultSheets
    }
  };
}

function buildArcadeArchiveFromOps_(params) {
  params = params || {};
  var season = trim_(params.season) || '2026';
  var regionFilter = trim_(params.region).toLowerCase();
  if (regionFilter && regionFilter !== 'all') {
    regionFilter = normalizeRegionKey_(regionFilter) || '';
  } else {
    regionFilter = '';
  }

  var regionDefs = [
    { key: 'seoul', label: '1차 서울', shortLabel: '서울' },
    { key: 'daejeon', label: '2차 대전', shortLabel: '대전' },
    { key: 'gwangju', label: '3차 광주', shortLabel: '광주' },
    { key: 'busan', label: '4차 부산', shortLabel: '부산' }
  ];

  var regionMap = {};
  for (var i = 0; i < regionDefs.length; i++) {
    var def = regionDefs[i];
    regionMap[def.key] = {
      key: def.key,
      label: def.label,
      shortLabel: def.shortLabel,
      onlineRows: [],
      swissMatches: [],
      swissStandings: [],
      deciderRows: [],
      seedingRows: [],
      qualifiers: {}
    };
  }

  function allowRegion_(key) {
    if (!key) return false;
    if (!regionFilter) return true;
    return key === regionFilter;
  }

  var onlineRows = readOptionalTable_('ops_db_online').rows;
  onlineRows.forEach(function(r){
    var key = normalizeRegionKey_(r.region);
    if (!allowRegion_(key)) return;
    if (trim_(r.season) && trim_(r.season) !== season) return;

    var score1 = toNumber_(r.score1, 0);
    var score2 = toNumber_(r.score2, 0);
    regionMap[key].onlineRows.push({
      rank: toNumber_(r.rank, regionMap[key].onlineRows.length + 1),
      entryId: trim_(r.entryId),
      nickname: trim_(r.nickname),
      score1: score1,
      score2: score2,
      total: toNumber_(r.total, score1 + score2),
      submittedAt: trim_(r.submittedAt),
      advanced: toBool_(r.advanced)
    });
  });

  var swissRows = readOptionalTable_('ops_db_swiss_matches').rows;
  swissRows.forEach(function(r, idx){
    var key = normalizeRegionKey_(r.region);
    if (!allowRegion_(key)) return;
    if (trim_(r.season) && trim_(r.season) !== season) return;

    var games = [];
    if (trim_(r.song1)) games.push({ song: trim_(r.song1), level: trim_(r.level1), p1Score: toNumber_(r.p1Score1, 0), p2Score: toNumber_(r.p2Score1, 0) });
    if (trim_(r.song2)) games.push({ song: trim_(r.song2), level: trim_(r.level2), p1Score: toNumber_(r.p1Score2, 0), p2Score: toNumber_(r.p2Score2, 0) });
    if (trim_(r.song3)) games.push({ song: trim_(r.song3), level: trim_(r.level3), p1Score: toNumber_(r.p1Score3, 0), p2Score: toNumber_(r.p2Score3, 0) });

    var match = {
      round: toNumber_(r.round, 1),
      table: toNumber_(r.table, idx + 1),
      highSeedEntryId: trim_(r.highSeedEntryId),
      player1: { entryId: trim_(r.p1EntryId), nickname: trim_(r.p1Nickname), seed: toNumber_(r.p1Seed, null) },
      games: games,
      winnerEntryId: trim_(r.winnerEntryId),
      tieBreakerSong: trim_(r.tieBreakerSong),
      bye: toBool_(r.bye),
      note: trim_(r.note)
    };
    if (trim_(r.p2EntryId) || trim_(r.p2Nickname)) {
      match.player2 = { entryId: trim_(r.p2EntryId), nickname: trim_(r.p2Nickname), seed: toNumber_(r.p2Seed, null) };
    }
    regionMap[key].swissMatches.push(match);
  });

  var standings = readOptionalTable_('ops_db_swiss_standings').rows;
  standings.forEach(function(r, idx){
    var key = normalizeRegionKey_(r.region);
    if (!allowRegion_(key)) return;
    if (trim_(r.season) && trim_(r.season) !== season) return;

    var status = trim_(r.status).toLowerCase();
    if (status !== 'qualified' && status !== 'decider' && status !== 'eliminated') status = 'alive';

    regionMap[key].swissStandings.push({
      entryId: trim_(r.entryId) || ('E-UNK-' + (idx + 1)),
      nickname: trim_(r.nickname) || trim_(r.entryId),
      seed: toNumber_(r.seed, idx + 1),
      wins: toNumber_(r.wins, 0),
      losses: toNumber_(r.losses, 0),
      status: status
    });
  });

  var deciderRows = readOptionalTable_('ops_db_decider').rows;
  deciderRows.forEach(function(r){
    var key = normalizeRegionKey_(r.region);
    if (!allowRegion_(key)) return;
    if (trim_(r.season) && trim_(r.season) !== season) return;

    var rank = toNumber_(r.rank, regionMap[key].deciderRows.length + 1);
    var entryId = trim_(r.entryId);
    regionMap[key].deciderRows.push({
      rank: rank,
      entryId: entryId,
      nickname: trim_(r.nickname) || entryId,
      score: toNumber_(r.score, 0),
      note: trim_(r.note)
    });
    if (toBool_(r.winner) || trim_(r.winnerEntryId) === entryId) {
      regionMap[key].deciderWinnerEntryId = entryId;
    }
  });

  var seedingRows = readOptionalTable_('ops_db_seeding').rows;
  seedingRows.forEach(function(r){
    var key = normalizeRegionKey_(r.region);
    if (!allowRegion_(key)) return;
    if (trim_(r.season) && trim_(r.season) !== season) return;

    var rank = toNumber_(r.rank, regionMap[key].seedingRows.length + 1);
    var entryId = trim_(r.entryId);
    regionMap[key].seedingRows.push({
      rank: rank,
      entryId: entryId,
      nickname: trim_(r.nickname) || entryId,
      score: toNumber_(r.score, 0),
      note: trim_(r.note)
    });
  });

  var qualifierRows = readOptionalTable_('ops_db_qualifiers').rows;
  qualifierRows.forEach(function(r){
    var key = normalizeRegionKey_(r.region);
    if (!allowRegion_(key)) return;
    if (trim_(r.season) && trim_(r.season) !== season) return;

    var group = trim_(r.group).toUpperCase();
    var participant = { entryId: trim_(r.entryId), nickname: trim_(r.nickname), seed: toNumber_(r.seed, null) };
    if (group === 'A') regionMap[key].qualifiers.groupA = participant;
    if (group === 'B') regionMap[key].qualifiers.groupB = participant;
  });

  var finalsA = readOptionalTable_('ops_db_finals_a').rows
    .filter(function(r){ return !trim_(r.season) || trim_(r.season) === season; })
    .map(function(r){
      var key = normalizeRegionKey_(r.region) || 'seoul';
      return {
        seed: toNumber_(r.seed, 0),
        regionKey: key,
        regionLabel: trim_(r.regionLabel) || getRegionShortLabel_(key),
        entryId: trim_(r.entryId),
        nickname: trim_(r.nickname),
        score: toNumber_(r.score, null)
      };
    });

  var finalsB = readOptionalTable_('ops_db_finals_b').rows
    .filter(function(r){ return !trim_(r.season) || trim_(r.season) === season; })
    .map(function(r){
      var key = normalizeRegionKey_(r.region) || 'seoul';
      return {
        seed: toNumber_(r.seed, 0),
        regionKey: key,
        regionLabel: trim_(r.regionLabel) || getRegionShortLabel_(key),
        entryId: trim_(r.entryId),
        nickname: trim_(r.nickname),
        score: toNumber_(r.score, null)
      };
    });

  var finalsMatches = readOptionalTable_('ops_db_finals_matches').rows
    .filter(function(r){ return !trim_(r.season) || trim_(r.season) === season; })
    .map(function(r){
      var leftKey = normalizeRegionKey_(r.leftRegion) || 'seoul';
      var rightKey = normalizeRegionKey_(r.rightRegion) || 'busan';
      return {
        matchNo: toNumber_(r.matchNo, 0),
        left: {
          seed: toNumber_(r.leftSeed, 0),
          regionKey: leftKey,
          regionLabel: trim_(r.leftRegionLabel) || getRegionShortLabel_(leftKey),
          entryId: trim_(r.leftEntryId),
          nickname: trim_(r.leftNickname)
        },
        right: {
          seed: toNumber_(r.rightSeed, 0),
          regionKey: rightKey,
          regionLabel: trim_(r.rightRegionLabel) || getRegionShortLabel_(rightKey),
          entryId: trim_(r.rightEntryId),
          nickname: trim_(r.rightNickname)
        },
        winnerEntryId: trim_(r.winnerEntryId),
        note: trim_(r.note)
      };
    });

  var regions = [];
  for (var d = 0; d < regionDefs.length; d++) {
    var region = regionMap[regionDefs[d].key];
    region.onlineRows.sort(function(a,b){ return a.rank - b.rank; });
    region.deciderRows.sort(function(a,b){ return a.rank - b.rank; });
    region.seedingRows.sort(function(a,b){ return a.rank - b.rank; });
    region.swissStandings.sort(function(a,b){
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return a.seed - b.seed;
    });
    region.swissMatches.sort(function(a,b){
      if (a.round !== b.round) return a.round - b.round;
      return (a.table || 0) - (b.table || 0);
    });
    regions.push(region);
  }

  return {
    season: season,
    title: '아케이드 운영 DB 송출',
    songs: {
      online1: 'うそうそ時 (Lv.8)',
      online2: '輝きを求めて (Lv.8)',
      decider31: '大空と太鼓の踊り (Lv.9)',
      seeding: 'タイコロール (Lv.10)'
    },
    regions: regions,
    finals: {
      groupASeeds: finalsA,
      groupBSeeds: finalsB,
      crossMatches: finalsMatches
    }
  };
}

function handleOpsFeed_(params) {
  return {
    ok: true,
    data: {
      arcadeArchive2026: buildArcadeArchiveFromOps_(params || {})
    }
  };
}

function initializeOpsTabs() {
  return handleOpsInit_({});
}

/**
 * Required additions in doPost(e):
 *
 * if (action === 'opsInit') return json_(handleOpsInit_(params));
 * if (action === 'opsGuide') return json_(handleOpsGuide_(params));
 * if (action === 'opsUpsert') return json_(handleOpsUpsert_(payload));
 * if (action === 'opsExport') return json_(handleOpsExport_(payload || params));
 * if (action === 'opsFeed') return json_(handleOpsFeed_(params));
 */

