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

function getActiveSpreadsheetOrNull_() {
  try {
    return SpreadsheetApp.getActiveSpreadsheet();
  } catch (err) {
    return null;
  }
}

function getSs_() {
  var props = PropertiesService.getScriptProperties();
  var sheetId = trim_(props.getProperty('SHEET_ID'));
  var active = getActiveSpreadsheetOrNull_();

  // For spreadsheet-bound/menu execution, always trust active spreadsheet first.
  if (active) {
    var activeId = active.getId();
    if (sheetId !== activeId) {
      props.setProperty('SHEET_ID', activeId);
    }
    return active;
  }

  if (!sheetId) {
    throw new Error('Missing Script Property SHEET_ID');
  }

  try {
    return SpreadsheetApp.openById(sheetId);
  } catch (err) {
    throw new Error(
      'Failed to open SHEET_ID=' + sheetId +
      '. Check spreadsheet access permission and Script Property SHEET_ID. ' +
      'Original: ' + String(err)
    );
  }
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
    { name: 'registrations', headers: ['createdAt', 'receiptId', 'division', 'name', 'phone', 'email', 'nickname', 'cardNo', 'dohirobaNo', 'spectator', 'isMinor', 'consentLink', 'privacyAgree', 'status', 'memo'] },
    { name: 'showcase_songs', headers: ['division', 'stageKey', 'stageLabel', 'order', 'songTitle', 'difficulty', 'level', 'descriptionMd', 'revealed'] },
    { name: 'song_pool_console_finals', headers: ['order', 'title', 'difficulty', 'level', 'note'] },
    { name: 'song_pool_arcade_finals', headers: ['order', 'title', 'difficulty', 'level', 'note'] },
    { name: 'song_pool_arcade_swiss', headers: ['order', 'title', 'difficulty', 'level', 'note'] }
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

function getKnownHeadersForSheet_(sheetName) {
  var name = trim_(sheetName);
  if (!name) return null;

  var all = getSheetSchemas_('all');
  for (var i = 0; i < all.length; i++) {
    if (all[i].name === name) return all[i].headers;
  }

  if (typeof getOpsSheetSchemas_ === 'function') {
    var ops = getOpsSheetSchemas_();
    for (var j = 0; j < ops.length; j++) {
      if (ops[j].name === name) return ops[j].headers;
    }
  }

  return null;
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

var API_CACHE_VERSION_ = '2026-02-07';
var CONTENT_PAGE_KEYS_ = ['home', 'console', 'arcade', 'contact'];
var OPS_FEED_REGION_KEYS_ = ['', 'seoul', 'daejeon', 'gwangju', 'busan'];
var OPS_FEED_SEASON_KEYS_ = ['2026'];
var ARCADE_SONGS_ = {
  online1: 'うそうそ時 (Lv.8)',
  online2: '輝きを求めて (Lv.8)',
  decider31: '大空と太鼓の踊り (Lv.9)',
  seeding: 'タイコロール (Lv.10)'
};

function getApiCacheKey_(action, params) {
  var base = 'tkc2026:' + API_CACHE_VERSION_ + ':' + String(action || '').trim();
  if (action === 'content') {
    var page = params && params.page ? String(params.page).trim().toLowerCase() : '';
    return base + ':' + page;
  }
  if (action === 'opsFeed') {
    var season = params && params.season ? String(params.season).trim() : '2026';
    var region = params && params.region ? String(params.region).trim().toLowerCase() : '';
    return base + ':' + season + ':' + region;
  }
  return base;
}

function getApiCacheTtlSec_(action) {
  if (action === 'site') return 300;      // 5m
  if (action === 'content') return 180;   // 3m
  if (action === 'schedule') return 90;   // 90s
  if (action === 'results') return 20;    // 20s (results update sensitivity)
  if (action === 'opsFeed') return 15;    // 15s (ops 라이브 데이터, 폴링 빈도 대응)
  if (action === 'showcaseSongs') return 15;  // 15s (revealed 즉시 반영)
  if (action === 'songPools') return 15;      // 15s (시트 변경 즉시 반영)
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
    getApiCacheKey_('results', {}),
    getApiCacheKey_('showcaseSongs', {}),
    getApiCacheKey_('songPools', {})
  ];
  for (var i = 0; i < CONTENT_PAGE_KEYS_.length; i++) {
    keys.push(getApiCacheKey_('content', { page: CONTENT_PAGE_KEYS_[i] }));
  }
  for (var s = 0; s < OPS_FEED_SEASON_KEYS_.length; s++) {
    for (var j = 0; j < OPS_FEED_REGION_KEYS_.length; j++) {
      keys.push(getApiCacheKey_('opsFeed', { season: OPS_FEED_SEASON_KEYS_[s], region: OPS_FEED_REGION_KEYS_[j] }));
    }
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

/**
 * opsFeed 캐시만 시즌/지역 기준으로 삭제.
 * season 미지정 시 OPS_FEED_SEASON_KEYS_ 전체, region 미지정 시 전 지역 삭제.
 */
function purgeOpsFeedCache_(season, region) {
  var cache = CacheService.getScriptCache();
  var seasons = season ? [String(season).trim()] : OPS_FEED_SEASON_KEYS_;
  var regions = region ? ['', String(region).trim().toLowerCase()] : OPS_FEED_REGION_KEYS_;
  var keys = [];
  for (var s = 0; s < seasons.length; s++) {
    for (var r = 0; r < regions.length; r++) {
      keys.push(getApiCacheKey_('opsFeed', { season: seasons[s], region: regions[r] }));
    }
  }
  try {
    cache.removeAll(keys);
  } catch (err) {
    for (var i = 0; i < keys.length; i++) cache.remove(keys[i]);
  }
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
      title + ' 실패',
      result && result.error ? String(result.error) : '알 수 없는 오류',
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
  if (typeof data.round === 'number') parts.push('round=' + data.round);
  if (typeof data.rebuiltRows === 'number') parts.push('rebuiltRows=' + data.rebuiltRows);
  if (typeof data.writtenRows === 'number') parts.push('writtenRows=' + data.writtenRows);
  if (typeof data.generatedRows === 'number') parts.push('generatedRows=' + data.generatedRows);
  if (typeof data.opsTabs === 'number') parts.push('opsTabs=' + data.opsTabs);
  if (typeof data.opsFormatted === 'number') parts.push('opsFormatted=' + data.opsFormatted);
  if (typeof data.guideRows === 'number') parts.push('guideRows=' + data.guideRows);
  if (typeof data.inlineSheets === 'number') parts.push('inlineSheets=' + data.inlineSheets);
  if (typeof data.beginnerGuideRows === 'number') parts.push('beginnerGuideRows=' + data.beginnerGuideRows);
  if (typeof data.totalRows === 'number') parts.push('totalRows=' + data.totalRows);
  if (data.region) parts.push('region=' + data.region);
  if (data.season) parts.push('season=' + data.season);
  if (data.beginnerGuideSheet) parts.push('beginnerGuideSheet=' + data.beginnerGuideSheet);
  if (data.sheetId) parts.push('sheetId=' + data.sheetId);
  if (data.name) parts.push('name=' + data.name);

  var message = parts.length ? parts.join(', ') : '완료';
  SpreadsheetApp.getActiveSpreadsheet().toast(message, title, 7);
}

function menuInitAllTabs_() {
  notifyMenuResult_('전체 탭 초기화+서식', handleInitAndFormat_({ scope: 'all' }));
}

function menuInitArchiveTabs_() {
  notifyMenuResult_('아카이브 탭 초기화+서식', handleInitAndFormat_({ scope: 'archive' }));
}

function menuFormatAllTabs_() {
  notifyMenuResult_('전체 탭 서식 적용', handleFormatSheets_({ scope: 'all' }));
}

function menuFormatArchiveTabs_() {
  notifyMenuResult_('아카이브 탭 서식 적용', handleFormatSheets_({ scope: 'archive' }));
}

function menuSeedArchiveSample_() {
  var ui = SpreadsheetApp.getUi();
  var button = ui.alert(
    '아카이브 샘플 데이터를 채울까요?',
    'arcade_archive_* 탭의 기존 행이 모두 덮어써집니다.',
    ui.ButtonSet.YES_NO
  );
  if (button !== ui.Button.YES) return;

  notifyMenuResult_('2026 샘플 데이터 채우기', handleSeedArchiveSample_({ overwrite: true }));
}

function menuClearArchiveRows_() {
  var ui = SpreadsheetApp.getUi();
  var button = ui.alert(
    '아카이브 행을 비울까요?',
    '헤더 행은 유지되고, 기존 데이터 행은 삭제됩니다.',
    ui.ButtonSet.YES_NO
  );
  if (button !== ui.Button.YES) return;

  var cleared = handleClearSheetRows_({ scope: 'archive' });
  if (cleared.ok) handleFormatSheets_({ scope: 'archive' });
  notifyMenuResult_('아카이브 행 비우기', cleared);
}

function menuPurgeApiCache_() {
  notifyMenuResult_('API 캐시 비우기', purgeApiCache_());
}

function handleSheetBindingDebug_() {
  var props = PropertiesService.getScriptProperties();
  var propSheetId = trim_(props.getProperty('SHEET_ID'));
  var active = null;
  var activeId = '';
  var activeName = '';

  try {
    active = SpreadsheetApp.getActiveSpreadsheet();
  } catch (errActive) {
    active = null;
  }

  if (active) {
    activeId = active.getId();
    activeName = active.getName();
  }

  var openByIdOk = false;
  var openByIdError = '';
  if (propSheetId) {
    try {
      SpreadsheetApp.openById(propSheetId);
      openByIdOk = true;
    } catch (errOpen) {
      openByIdOk = false;
      openByIdError = String(errOpen);
    }
  }

  return {
    ok: true,
    data: {
      activeSheetId: activeId,
      activeSheetName: activeName,
      propertySheetId: propSheetId,
      propertyOpenByIdOk: openByIdOk,
      propertyOpenByIdError: openByIdError
    }
  };
}

function menuSheetBindingDebug_() {
  var result = handleSheetBindingDebug_();
  var data = result.data || {};
  var ui = SpreadsheetApp.getUi();
  var message =
    'activeSheetId: ' + (data.activeSheetId || '(none)') + '\n' +
    'activeSheetName: ' + (data.activeSheetName || '(none)') + '\n' +
    'propertySheetId: ' + (data.propertySheetId || '(none)') + '\n' +
    'propertyOpenByIdOk: ' + String(!!data.propertyOpenByIdOk);

  if (!data.propertyOpenByIdOk && data.propertyOpenByIdError) {
    message += '\nopenByIdError: ' + data.propertyOpenByIdError;
  }
  ui.alert('시트 바인딩 점검', message, ui.ButtonSet.OK);
}

function handleBindSheetIdToActive_() {
  var ss = getActiveSpreadsheetOrNull_();
  if (!ss) {
    return { ok: false, error: '활성 스프레드시트 컨텍스트가 없습니다.' };
  }

  var sheetId = ss.getId();
  PropertiesService.getScriptProperties().setProperty('SHEET_ID', sheetId);
  return {
    ok: true,
    data: {
      sheetId: sheetId,
      name: ss.getName()
    }
  };
}

function menuBindSheetIdToActive_() {
  notifyMenuResult_('SHEET_ID 현재 시트로 바인딩', handleBindSheetIdToActive_());
}

function menuWriteOpsGuide_() {
  notifyMenuResult_('운영 가이드 시트 작성', handleOpsGuide_({ overwrite: true }));
}

function menuWriteOpsInlineGuide_() {
  notifyMenuResult_('시트별 인라인 가이드 작성', handleOpsInlineGuide_({ overwrite: true }));
}

function menuWriteOpsBeginnerGuide_() {
  notifyMenuResult_('운영 시작 가이드 시트 작성', handleOpsBeginnerGuide_({ overwrite: true }));
}

function menuOpsFirstTimeSetup_() {
  var ui = SpreadsheetApp.getUi();
  var button = ui.alert(
    '처음 운영 세팅을 시작할까요?',
    '초기 탭/서식/운영 가이드/인라인 가이드를 한 번에 준비합니다.',
    ui.ButtonSet.YES_NO
  );
  if (button !== ui.Button.YES) return;

  notifyMenuResult_(
    '운영 시작 세팅(원클릭)',
    handleOpsFirstTimeSetup_({ initAll: true, overwriteGuide: true })
  );
}

function menuOpsRoundClosePrompt_() {
  var ui = SpreadsheetApp.getUi();

  var regionRes = ui.prompt(
    '스위스 라운드 종료',
    'region 입력 (seoul/daejeon/gwangju/busan)',
    ui.ButtonSet.OK_CANCEL
  );
  if (regionRes.getSelectedButton() !== ui.Button.OK) return;
  var region = trim_(regionRes.getResponseText()).toLowerCase();

  var seasonRes = ui.prompt(
    '스위스 라운드 종료',
    'season 입력 (기본값: 2026)',
    ui.ButtonSet.OK_CANCEL
  );
  if (seasonRes.getSelectedButton() !== ui.Button.OK) return;
  var season = trim_(seasonRes.getResponseText()) || '2026';

  var roundRes = ui.prompt(
    '스위스 라운드 종료',
    'round 입력 (비우면 다음 라운드 자동)',
    ui.ButtonSet.OK_CANCEL
  );
  if (roundRes.getSelectedButton() !== ui.Button.OK) return;

  var payload = {
    season: season,
    region: region,
    exportArchive: true
  };
  var roundText = trim_(roundRes.getResponseText());
  if (roundText) payload.round = toNumber_(roundText, null);

  notifyMenuResult_('스위스 라운드 종료', handleOpsRoundClose_(payload));
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('TKC2026 도구')
    .addItem('시트 바인딩 점검', 'menuSheetBindingDebug_')
    .addItem('전체 탭 초기화+서식', 'menuInitAllTabs_')
    .addItem('아카이브 탭 초기화+서식', 'menuInitArchiveTabs_')
    .addSeparator()
    .addItem('전체 탭 서식 적용', 'menuFormatAllTabs_')
    .addItem('아카이브 탭 서식 적용', 'menuFormatArchiveTabs_')
    .addSeparator()
    .addItem('2026 샘플 데이터 채우기', 'menuSeedArchiveSample_')
    .addItem('아카이브 행 비우기', 'menuClearArchiveRows_')
    .addSeparator()
    .addItem('API 캐시 비우기', 'menuPurgeApiCache_')
    .addItem('SHEET_ID 현재 시트로 바인딩', 'menuBindSheetIdToActive_')
    .addSeparator()
    .addItem('운영 시작 세팅(원클릭)', 'menuOpsFirstTimeSetup_')
    .addItem('운영 시작 가이드 시트 작성', 'menuWriteOpsBeginnerGuide_')
    .addItem('운영 가이드 시트 작성', 'menuWriteOpsGuide_')
    .addItem('시트별 인라인 가이드 작성', 'menuWriteOpsInlineGuide_')
    .addItem('스위스 라운드 종료(자동 대진+내보내기)', 'menuOpsRoundClosePrompt_')
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
  var knownHeaders = getKnownHeadersForSheet_(sheetName);
  var width = knownHeaders ? knownHeaders.length : sh.getLastColumn();
  width = Math.max(1, Math.min(width, sh.getMaxColumns()));
  var lastRow = Math.max(sh.getLastRow(), 1);
  var values = sh.getRange(1, 1, lastRow, width).getValues();
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

  var knownHeaders = getKnownHeadersForSheet_(sheetName);
  var width = knownHeaders ? knownHeaders.length : sh.getLastColumn();
  width = Math.max(1, Math.min(width, sh.getMaxColumns()));
  var lastRow = Math.max(sh.getLastRow(), 1);
  var values = sh.getRange(1, 1, lastRow, width).getValues();
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

function normalizeDifficulty_(value) {
  var s = String(value || '').trim().toLowerCase();
  if (s === 'oni' || s === 'おに' || s === '귀신') return 'oni';
  if (s === 'ura' || s === '裏おに' || s === '裏' || s === '뒷보면') return 'ura';
  return '';
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
    songs: ARCADE_SONGS_,
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

function handleSongPools_() {
  function readPool(sheetName, division) {
    var table = readOptionalTable_(sheetName);
    if (!table) return [];
    return table.rows
      .sort(function(a,b){ return toNumber_(a.order, 0) - toNumber_(b.order, 0); })
      .map(function(r){
        return {
          division: division,
          title: String(r.title||'').trim(),
          difficulty: normalizeDifficulty_(r.difficulty),
          level: toNumber_(r.level, null),
          note: String(r.note||'').trim()
        };
      })
      .filter(function(r){ return r.title && r.difficulty; });
  }
  var consoleFinals = readPool('song_pool_console_finals', 'console');
  var arcadeFinals = readPool('song_pool_arcade_finals', 'arcade');
  var arcadeSwiss = readPool('song_pool_arcade_swiss', 'arcade');
  return { ok: true, data: { consoleFinals: consoleFinals, arcadeFinals: arcadeFinals, arcadeSwiss: arcadeSwiss } };
}

function handleShowcaseSongs_() {
  var rows = readTable_('showcase_songs').rows
    .sort(function(a,b){ return Number(a.order||0) - Number(b.order||0); })
    .map(function(r){
      var revealed = toBool_(r.revealed);
      return {
        division: String(r.division||'').trim(),
        stageKey: String(r.stageKey||'').trim(),
        stageLabel: String(r.stageLabel||'').trim(),
        order: Number(r.order||0),
        revealed: revealed,
        songTitle: revealed ? String(r.songTitle||'').trim() : '',
        difficulty: revealed ? normalizeDifficulty_(r.difficulty) : '',
        level: revealed ? (r.level ? Number(r.level) : null) : null,
        descriptionMd: revealed ? String(r.descriptionMd||'') : ''
      };
    });
  return { ok:true, data:{ songs:rows } };
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
  if (!p || typeof p !== 'object') return 'payload 형식이 올바르지 않습니다.';
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
      return json_({ ok:false, error:'postData가 없습니다.' });
    }

    var body = JSON.parse(e.postData.contents);

    if (!requireApiKey_(body.apiKey)) {
      return json_({ ok:false, error:'인증에 실패했습니다.' });
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
    if (action === 'showcaseSongs') {
      return json_(executeCachedAction_('showcaseSongs', params, function(){
        return handleShowcaseSongs_();
      }));
    }
    if (action === 'songPools') {
      return json_(executeCachedAction_('songPools', params, function(){
        return handleSongPools_();
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
    if (action === 'opsInlineGuide') return json_(handleOpsInlineGuide_(params));
    if (action === 'opsBeginnerGuide') return json_(handleOpsBeginnerGuide_(params));
    if (action === 'opsFirstTimeSetup') return json_(handleOpsFirstTimeSetup_(payload || params));
    if (action === 'opsUpsert') {
      var upsertResult = handleOpsUpsert_(payload);
      if (upsertResult.ok) { purgeApiCache_(); purgeOpsFeedCache_(); }
      return json_(upsertResult);
    }
    if (action === 'opsSwissRebuildStandings') {
      var rebuildStResult = handleOpsSwissRebuildStandings_(payload || params);
      if (rebuildStResult.ok) { purgeApiCache_(); purgeOpsFeedCache_(); }
      return json_(rebuildStResult);
    }
    if (action === 'opsExport') {
      var exportResult = handleOpsExport_(payload || params);
      if (exportResult.ok) purgeOpsFeedCache_();
      return json_(exportResult);
    }
    if (action === 'opsFeed') return json_(executeCachedAction_('opsFeed', params, function() { return handleOpsFeed_(params); }));
    if (action === 'opsSwissNextRound') {
      var nextRoundResult = handleOpsSwissNextRound_(payload || params);
      if (nextRoundResult.ok) { purgeApiCache_(); purgeOpsFeedCache_(); }
      return json_(nextRoundResult);
    }
    if (action === 'opsRoundClose') {
      var roundCloseResult = handleOpsRoundClose_(payload || params);
      if (roundCloseResult.ok) purgeOpsFeedCache_();
      return json_(roundCloseResult);
    }
    if (action === 'purgeCache') return json_(purgeApiCache_());
    if (action === 'register') return json_(handleRegister_(payload));

    return json_({ ok:false, error:'알 수 없는 action입니다.' });
  } catch (err) {
    return json_({ ok:false, error:String(err) });
  }
}

/**
 * TKC2026 Ops Extension (append to existing Code.gs)
 *
 * Adds actions:
 * - opsInit   : create ops_db_* tabs
 * - opsBeginnerGuide : write a beginner-friendly runbook sheet
 * - opsFirstTimeSetup : one-click setup for first operators
 * - opsUpsert : write/update one row into ops_db_*  → purgeApiCache_ + purgeOpsFeedCache_
 * - opsSwissRebuildStandings : rebuild swiss_standings → purgeApiCache_ + purgeOpsFeedCache_
 * - opsExport : copy ops_db_* -> arcade_archive_*   → purgeApiCache_ (내부) + purgeOpsFeedCache_
 * - opsFeed   : build archive payload (executeCachedAction_ 래핑, 15s TTL, season:region 키)
 * - opsSwissNextRound : generate next swiss round    → purgeApiCache_ + purgeOpsFeedCache_
 * - opsRoundClose     : rebuild + nextRound + export → purgeOpsFeedCache_ (내부 + doPost)
 *
 * Cache invalidation:
 * - purgeApiCache_()      : 전체 캐시(site/content/schedule/results/opsFeed) 정적 키 삭제
 * - purgeOpsFeedCache_(season, region) : opsFeed 캐시만 시즌/지역 기준 타겟 삭제
 * - 모든 mutation 성공 시 두 함수를 함께 호출하여 캐시 정합성 보장
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

function getOpsBeginnerGuideSchema_(sheetName) {
  var name = trim_(sheetName) || 'ops_beginner_guide';
  return {
    name: name,
    headers: ['순서', '작업', '실행위치', '설명', '완료']
  };
}

function buildOpsBeginnerGuideRows_() {
  return [
    {
      '순서': 1,
      '작업': '처음 1회 세팅',
      '실행위치': '메뉴 > TKC2026 도구',
      '설명': '\'운영 시작 세팅(원클릭)\'을 1회 실행해 탭/서식/가이드를 자동 준비합니다.',
      '완료': false
    },
    {
      '순서': 2,
      '작업': '오늘 운영 지역 확인',
      '실행위치': 'ops_db_online, ops_db_swiss_standings',
      '설명': 'season/region 값이 맞는지, 선수 ID/닉네임/seed가 채워졌는지 확인합니다.',
      '완료': false
    },
    {
      '순서': 3,
      '작업': '경기 중 점수 입력',
      '실행위치': 'ops_db_swiss_matches',
      '설명': '매치별로 점수와 winnerEntryId를 입력합니다. 부전승은 bye=TRUE로 처리합니다.',
      '완료': false
    },
    {
      '순서': 4,
      '작업': '라운드 종료 처리',
      '실행위치': '메뉴 > 스위스 라운드 종료(자동 대진+내보내기)',
      '설명': 'standings 재계산 + 다음 라운드 자동 대진 + archive 내보내기를 한 번에 실행합니다.',
      '완료': false
    },
    {
      '순서': 5,
      '작업': '송출 확인',
      '실행위치': 'opsFeed / results API',
      '설명': '대진/순위/승자 데이터가 화면에 반영되었는지 확인합니다.',
      '완료': false
    },
    {
      '순서': 6,
      '작업': '문제 발생 시 복구',
      '실행위치': 'opsSwissRebuildStandings',
      '설명': '매치 결과가 맞다면 standings를 재생성한 뒤 다시 라운드 종료를 실행합니다.',
      '완료': false
    }
  ];
}

function handleOpsBeginnerGuide_(params) {
  params = params || {};
  var overwrite = params.overwrite === undefined ? true : toBool_(params.overwrite);
  var schema = getOpsBeginnerGuideSchema_(params.sheetName);
  var rows = buildOpsBeginnerGuideRows_();

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
    sh.getRange(2, 5, values.length, 1).insertCheckboxes();
  }

  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, schema.headers.length);

  appendOpsEvent_('beginnerGuide', '', '', '', 'beginner rows=' + values.length + ', sheet=' + schema.name);

  return {
    ok: true,
    data: {
      sheet: schema.name,
      rows: values.length,
      overwrite: overwrite
    }
  };
}

function getOpsInlineGuideMap_() {
  return {
    ops_db_online: [
      { item: '입력 단위', desc: '선수 1명 = 1행입니다.' },
      { item: '핵심 컬럼', desc: 'season, region, rank, entryId, nickname, score1, score2, advanced' },
      { item: 'region 입력값', desc: 'seoul / daejeon / gwangju / busan 권장 (한글 지역명도 일부 정규화됨).' },
      { item: 'total 처리', desc: 'opsUpsert 경유 시 score1+score2 자동 계산됩니다. 수동 입력도 가능.' },
      { item: 'advanced', desc: 'TRUE/FALSE로 입력합니다. 지역 본선 진출 여부 표시입니다.' },
      { item: '운영 흐름', desc: '지역 시작 전 선수명단/시드 입력 -> 온라인 점수 확정 후 갱신 -> export 실행.' }
    ],
    ops_db_swiss_matches: [
      { item: '입력 단위', desc: '매치(테이블) 1개 = 1행입니다.' },
      { item: '라운드 시작 전', desc: 'round/table/p1/p2/highSeed/song1/song2를 먼저 채워 대진표를 선공개합니다.' },
      { item: '경기 종료 후', desc: 'p1Score1/p2Score1, p1Score2/p2Score2, winnerEntryId를 즉시 입력합니다.' },
      { item: '타이브레이커', desc: '동점이면 song3/level3/p1Score3/p2Score3 및 tieBreakerSong을 입력합니다.' },
      { item: '부전승', desc: 'bye=TRUE, p2 관련 컬럼은 비우고 winnerEntryId는 p1EntryId로 입력합니다.' },
      { item: '중복 키 주의', desc: 'season+region+round+table 조합은 유일해야 합니다.' }
    ],
    ops_db_swiss_standings: [
      { item: '입력 단위', desc: '선수 1명 = 1행입니다.' },
      { item: '핵심 컬럼', desc: 'seed, wins, losses, status를 반드시 관리합니다.' },
      { item: 'status 권장값', desc: 'qualified / decider / eliminated / alive' },
      { item: '갱신 시점', desc: '라운드 종료 후 일괄 업데이트(실시간 송출 정확도 향상).' },
      { item: '정렬 기준', desc: 'wins 내림차순, losses 오름차순, seed 오름차순으로 맞추면 검수에 유리합니다.' }
    ],
    ops_db_decider: [
      { item: '입력 단위', desc: '선수 1명 = 1행입니다.' },
      { item: '핵심 컬럼', desc: 'rank, entryId, score, winner를 반드시 입력합니다.' },
      { item: 'winner 규칙', desc: '최종 승자 행만 winner=TRUE로 입력합니다.' },
      { item: '자동 보정', desc: 'winner=TRUE이고 winnerEntryId 비었으면 entryId로 자동 보정됩니다.' },
      { item: '갱신 시점', desc: '데시더 종료 직후 즉시 입력 후 export 실행 권장.' }
    ],
    ops_db_seeding: [
      { item: '입력 단위', desc: '지역별 시드 대상자 1명 = 1행입니다.' },
      { item: '핵심 컬럼', desc: 'rank, entryId, score를 기준으로 그룹 시드 산정에 사용됩니다.' },
      { item: '운영 규칙', desc: '일반적으로 rank 1 -> A그룹, rank 2 -> B그룹으로 사용합니다.' },
      { item: '갱신 시점', desc: '지역 대표 확정 직후 입력합니다.' }
    ],
    ops_db_qualifiers: [
      { item: '입력 단위', desc: '지역+그룹(A/B) 1개 = 1행입니다.' },
      { item: '핵심 컬럼', desc: 'group, entryId, nickname, seed' },
      { item: 'group 값', desc: 'A 또는 B만 허용됩니다(소문자 입력 시 업서트에서 대문자 보정).' },
      { item: '갱신 시점', desc: '그룹 배정이 확정되는 즉시 입력합니다.' }
    ],
    ops_db_finals_a: [
      { item: '입력 단위', desc: '시드 1개 = 1행입니다.' },
      { item: '핵심 컬럼', desc: 'season, seed, region, entryId, nickname' },
      { item: '운영 팁', desc: 'regionLabel을 같이 넣으면 방송/현장 송출 가독성이 좋아집니다.' }
    ],
    ops_db_finals_b: [
      { item: '입력 단위', desc: '시드 1개 = 1행입니다.' },
      { item: '핵심 컬럼', desc: 'season, seed, region, entryId, nickname' },
      { item: '운영 팁', desc: 'A/B 시드 번호 중복 여부를 눈으로 한번 더 검수하세요.' }
    ],
    ops_db_finals_matches: [
      { item: '입력 단위', desc: '본선 매치 1개 = 1행입니다.' },
      { item: '핵심 컬럼', desc: 'matchNo, leftEntryId, rightEntryId, winnerEntryId' },
      { item: '사전 입력', desc: '경기 전 left/right seed/region/entryId를 먼저 채워 송출 준비합니다.' },
      { item: '사후 입력', desc: '경기 종료 즉시 winnerEntryId 업데이트 후 export 실행합니다.' },
      { item: '운영 팁', desc: 'left/right 닉네임/지역 라벨도 함께 입력하면 화면 품질이 좋아집니다.' }
    ],
    ops_db_events: [
      { item: '시트 성격', desc: '자동 이벤트 로그 전용 시트입니다.' },
      { item: '수정 여부', desc: '수동 수정/삭제를 권장하지 않습니다.' },
      { item: '기록 시점', desc: 'opsUpsert / opsExport / opsGuide / opsInlineGuide 실행 시 자동 누적됩니다.' }
    ]
  };
}

function writeOpsInlineGuideBlock_(sheet, schema, rows, overwrite) {
  var baseCol = schema.headers.length + 2;
  var rowCount = Math.max((rows ? rows.length : 0) + 4, 16);
  var requiredCols = baseCol + 1; // two guide columns: baseCol and baseCol+1
  if (sheet.getMaxColumns() < requiredCols) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), requiredCols - sheet.getMaxColumns());
  }
  var block = sheet.getRange(1, baseCol, rowCount, 2);

  if (!overwrite) {
    var currentTitle = trim_(sheet.getRange(1, baseCol).getValue());
    if (currentTitle) {
      return { sheet: schema.name, rows: 0, skipped: true };
    }
  }

  block.breakApart();
  block.clearContent();
  block.clearFormat();

  var titleRange = sheet.getRange(1, baseCol, 1, 2);
  titleRange
    .merge()
    .setValue('입력 가이드 - ' + schema.name)
    .setBackground('#111827')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('left')
    .setVerticalAlignment('middle');

  var headerRange = sheet.getRange(2, baseCol, 1, 2);
  headerRange
    .setValues([['항목', '설명']])
    .setBackground('#e5e7eb')
    .setFontWeight('bold')
    .setHorizontalAlignment('left');

  if (rows && rows.length > 0) {
    var values = rows.map(function(r){
      return [r.item || '', r.desc || ''];
    });
    sheet.getRange(3, baseCol, values.length, 2).setValues(values);
  }

  var usedRows = Math.max((rows ? rows.length : 0) + 2, 2);
  sheet.getRange(1, baseCol, usedRows + 1, 2)
    .setWrap(true)
    .setVerticalAlignment('top')
    .setHorizontalAlignment('left');

  sheet.setColumnWidth(baseCol, 170);
  sheet.setColumnWidth(baseCol + 1, 560);

  return { sheet: schema.name, rows: rows ? rows.length : 0, skipped: false };
}

function handleOpsInlineGuide_(params) {
  params = params || {};
  var overwrite = params.overwrite === undefined ? true : toBool_(params.overwrite);
  var targetSheet = trim_(params.sheetName);

  var map = getOpsInlineGuideMap_();
  var schemas = getOpsSheetSchemas_().filter(function(schema){
    if (!targetSheet) return true;
    return schema.name === targetSheet;
  });

  if (schemas.length === 0) {
    return { ok: false, error: 'sheetName에 해당하는 ops_db_* 시트를 찾을 수 없습니다: ' + targetSheet };
  }

  var ss = getSs_();
  var results = [];
  for (var i = 0; i < schemas.length; i++) {
    var schema = schemas[i];
    ensureSheetSchema_(ss, schema.name, schema.headers);
    var sh = ss.getSheetByName(schema.name);
    var rows = map[schema.name] || [{ item: '안내', desc: '이 시트용 가이드가 아직 등록되지 않았습니다.' }];
    results.push(writeOpsInlineGuideBlock_(sh, schema, rows, overwrite));
  }

  appendOpsEvent_('inlineGuide', '', '', '', 'inline guide sheets=' + results.length);

  return {
    ok: true,
    data: {
      total: results.length,
      overwrite: overwrite,
      sheets: results
    }
  };
}

function handleFormatOpsTabs_() {
  var ss = getSs_();
  var schemas = getOpsSheetSchemas_();
  var sheets = schemas.map(function(schema){
    return applyReadableSheetStyle_(ss, schema.name, schema.headers);
  });

  return {
    ok: true,
    data: {
      total: sheets.length,
      sheets: sheets
    }
  };
}

function handleOpsFirstTimeSetup_(params) {
  params = params || {};
  var initAll = params.initAll === undefined ? true : toBool_(params.initAll);
  var overwriteGuide = params.overwriteGuide === undefined ? true : toBool_(params.overwriteGuide);

  var baseInit = null;
  if (initAll) {
    baseInit = handleInitAndFormat_({ scope: 'all' });
    if (!baseInit.ok) return baseInit;
  }

  var opsInit = handleOpsInit_({});
  if (!opsInit.ok) return opsInit;

  var opsFormatted = handleFormatOpsTabs_();
  if (!opsFormatted.ok) return opsFormatted;

  var guide = handleOpsGuide_({ overwrite: overwriteGuide });
  if (!guide.ok) return guide;

  var inlineGuide = handleOpsInlineGuide_({ overwrite: overwriteGuide });
  if (!inlineGuide.ok) return inlineGuide;

  var beginnerGuide = handleOpsBeginnerGuide_({ overwrite: overwriteGuide });
  if (!beginnerGuide.ok) return beginnerGuide;

  if (typeof purgeApiCache_ === 'function') {
    try { purgeApiCache_(); } catch (err) {}
  }

  appendOpsEvent_(
    'firstSetup',
    '',
    '',
    '',
    'initAll=' + String(initAll) +
    ', opsTabs=' + (opsInit.data ? opsInit.data.total : 0) +
    ', inline=' + (inlineGuide.data ? inlineGuide.data.total : 0)
  );

  return {
    ok: true,
    data: {
      total: baseInit && baseInit.data ? toNumber_(baseInit.data.total, 0) : 0,
      created: baseInit && baseInit.data ? toNumber_(baseInit.data.created, 0) : 0,
      headerUpdated: baseInit && baseInit.data ? toNumber_(baseInit.data.headerUpdated, 0) : 0,
      formatted: baseInit && baseInit.data ? toNumber_(baseInit.data.formatted, 0) : 0,
      opsTabs: opsInit.data ? toNumber_(opsInit.data.total, 0) : 0,
      opsFormatted: opsFormatted.data ? toNumber_(opsFormatted.data.total, 0) : 0,
      guideRows: guide.data ? toNumber_(guide.data.rows, 0) : 0,
      inlineSheets: inlineGuide.data ? toNumber_(inlineGuide.data.total, 0) : 0,
      beginnerGuideRows: beginnerGuide.data ? toNumber_(beginnerGuide.data.rows, 0) : 0,
      beginnerGuideSheet: beginnerGuide.data ? beginnerGuide.data.sheet : ''
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
    return { ok: false, error: 'payload 형식이 올바르지 않습니다.' };
  }

  var stage = trim_(payload.stage);
  var stageConfig = getOpsStageConfig_()[stage];
  if (!stageConfig) {
    return { ok: false, error: '알 수 없는 stage입니다: ' + stage };
  }

  var row = payload.row;
  if (!row || typeof row !== 'object') {
    return { ok: false, error: 'payload.row는 필수입니다.' };
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
  if (!schema) return { ok: false, error: 'stage에 해당하는 스키마를 찾을 수 없습니다.' };

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
      return { ok: false, error: 'qualifier.group은 A 또는 B여야 합니다.' };
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

function getOpsSchemaByName_(sheetName) {
  var schemas = getOpsSheetSchemas_();
  for (var i = 0; i < schemas.length; i++) {
    if (schemas[i].name === sheetName) return schemas[i];
  }
  return null;
}

function getOpsRowsBySeasonRegion_(sheetName, season, region) {
  return readOptionalTable_(sheetName).rows.filter(function(r){
    var rowSeason = trim_(r.season);
    if (season && rowSeason && rowSeason !== season) return false;
    return normalizeRegionKey_(r.region) === region;
  });
}

function normalizeSwissStandingStatus_(value) {
  var status = trim_(value).toLowerCase();
  if (status === 'qualified' || status === 'decider' || status === 'eliminated' || status === 'alive') {
    return status;
  }
  return 'alive';
}

function clearOpsRowsBySeasonRegion_(sheet, headers, season, region) {
  var seasonIdx = headers.indexOf('season');
  var regionIdx = headers.indexOf('region');
  if (seasonIdx < 0 || regionIdx < 0) return 0;

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var cleared = 0;

  for (var i = data.length - 1; i >= 0; i--) {
    var rowSeason = trim_(data[i][seasonIdx]);
    var rowRegion = normalizeRegionKey_(data[i][regionIdx]);

    if (season && rowSeason && rowSeason !== season) continue;
    if (region && rowRegion !== region) continue;

    sheet.getRange(i + 2, 1, 1, headers.length).clearContent();
    cleared++;
  }

  return cleared;
}

function clearRowsBySeason_(sheet, headers, season) {
  var seasonIdx = headers.indexOf('season');
  if (seasonIdx < 0) return 0;

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var cleared = 0;

  for (var i = data.length - 1; i >= 0; i--) {
    if (trim_(data[i][seasonIdx]) === season) {
      sheet.getRange(i + 2, 1, 1, headers.length).clearContent();
      cleared++;
    }
  }

  return cleared;
}

function buildSwissSeedNicknameStatusMap_(season, region) {
  var map = {};
  var standingsRows = getOpsRowsBySeasonRegion_('ops_db_swiss_standings', season, region);

  for (var i = 0; i < standingsRows.length; i++) {
    var standing = standingsRows[i];
    var entryId = trim_(standing.entryId);
    if (!entryId) continue;

    var meta = map[entryId] || { seed: null, nickname: '', status: 'alive' };
    var seed = toNumber_(standing.seed, null);
    if (seed !== null && (meta.seed === null || seed < meta.seed)) meta.seed = seed;

    var nickname = trim_(standing.nickname);
    if (!meta.nickname && nickname) meta.nickname = nickname;

    meta.status = normalizeSwissStandingStatus_(standing.status || meta.status);
    map[entryId] = meta;
  }

  var onlineRows = getOpsRowsBySeasonRegion_('ops_db_online', season, region).sort(function(a, b){
    return toNumber_(a.rank, 9999) - toNumber_(b.rank, 9999);
  });

  for (var j = 0; j < onlineRows.length; j++) {
    var online = onlineRows[j];
    var onlineEntryId = trim_(online.entryId);
    if (!onlineEntryId) continue;

    var onlineMeta = map[onlineEntryId] || { seed: null, nickname: '', status: 'alive' };
    var rank = toNumber_(online.rank, null);
    if (rank !== null && (onlineMeta.seed === null || rank < onlineMeta.seed)) {
      onlineMeta.seed = rank;
    }

    var onlineNickname = trim_(online.nickname);
    if (!onlineMeta.nickname && onlineNickname) onlineMeta.nickname = onlineNickname;
    if (!onlineMeta.status) onlineMeta.status = 'alive';

    map[onlineEntryId] = onlineMeta;
  }

  return map;
}

function ensureSwissStatsParticipant_(statsMap, metaMap, entryId, nickname, seed) {
  var id = trim_(entryId);
  if (!id) return '';

  var meta = metaMap[id] || { seed: null, nickname: '', status: 'alive' };
  var parsedSeed = toNumber_(seed, null);
  if (parsedSeed !== null && (meta.seed === null || parsedSeed < meta.seed)) {
    meta.seed = parsedSeed;
  }

  var parsedNickname = trim_(nickname);
  if (!meta.nickname && parsedNickname) meta.nickname = parsedNickname;
  if (!meta.status) meta.status = 'alive';
  metaMap[id] = meta;

  if (!statsMap[id]) {
    statsMap[id] = {
      entryId: id,
      wins: 0,
      losses: 0
    };
  }

  return id;
}

function buildSwissStandingRowsFromMatches_(payload) {
  payload = payload || {};

  var season = trim_(payload.season) || '2026';
  var region = normalizeRegionKey_(payload.region);
  if (!region) {
    return { ok: false, error: 'region은 seoul/daejeon/gwangju/busan 중 하나여야 합니다.' };
  }

  var strict = toBool_(payload.strict);
  var matchRows = getOpsRowsBySeasonRegion_('ops_db_swiss_matches', season, region);
  var maxRound = 0;
  for (var i = 0; i < matchRows.length; i++) {
    maxRound = Math.max(maxRound, toNumber_(matchRows[i].round, 0));
  }

  var untilRound = toNumber_(payload.untilRound, null);
  if (untilRound === null) untilRound = maxRound;
  untilRound = Math.floor(untilRound);
  if (untilRound < 0) {
    return { ok: false, error: 'untilRound는 0 이상이어야 합니다.' };
  }

  var metaMap = buildSwissSeedNicknameStatusMap_(season, region);
  var statsMap = {};
  Object.keys(metaMap).forEach(function(entryId){
    statsMap[entryId] = {
      entryId: entryId,
      wins: 0,
      losses: 0
    };
  });

  var unresolved = 0;

  for (var m = 0; m < matchRows.length; m++) {
    var match = matchRows[m];
    var round = toNumber_(match.round, 0);
    if (round > untilRound) continue;

    var p1Id = ensureSwissStatsParticipant_(
      statsMap,
      metaMap,
      match.p1EntryId,
      match.p1Nickname,
      match.p1Seed
    );
    var p2Id = ensureSwissStatsParticipant_(
      statsMap,
      metaMap,
      match.p2EntryId,
      match.p2Nickname,
      match.p2Seed
    );

    var bye = toBool_(match.bye) || (!trim_(match.p2EntryId) && !trim_(match.p2Nickname));
    var winnerId = trim_(match.winnerEntryId);

    if (bye) {
      var byeWinnerId = winnerId || p1Id || p2Id;
      if (!byeWinnerId) {
        unresolved++;
        continue;
      }
      ensureSwissStatsParticipant_(statsMap, metaMap, byeWinnerId, '', '');
      statsMap[byeWinnerId].wins += 1;
      continue;
    }

    if (!p1Id || !p2Id || !winnerId) {
      unresolved++;
      continue;
    }

    if (winnerId === p1Id) {
      statsMap[p1Id].wins += 1;
      statsMap[p2Id].losses += 1;
    } else if (winnerId === p2Id) {
      statsMap[p2Id].wins += 1;
      statsMap[p1Id].losses += 1;
    } else {
      unresolved++;
    }
  }

  if (strict && unresolved > 0) {
    return {
      ok: false,
      error: '미확정 매치가 있어 standings를 재계산할 수 없습니다. winnerEntryId 누락/불일치=' + unresolved
    };
  }

  var rows = Object.keys(statsMap).map(function(entryId){
    var meta = metaMap[entryId] || {};
    var stats = statsMap[entryId] || { wins: 0, losses: 0 };
    return {
      season: season,
      region: region,
      entryId: entryId,
      nickname: meta.nickname || entryId,
      seed: meta.seed !== null && meta.seed !== undefined ? meta.seed : '',
      wins: toNumber_(stats.wins, 0),
      losses: toNumber_(stats.losses, 0),
      status: normalizeSwissStandingStatus_(meta.status)
    };
  });

  rows.sort(function(a, b){
    if (b.wins !== a.wins) return b.wins - a.wins;
    if (a.losses !== b.losses) return a.losses - b.losses;
    var aSeed = toNumber_(a.seed, 9999);
    var bSeed = toNumber_(b.seed, 9999);
    if (aSeed !== bSeed) return aSeed - bSeed;
    return String(a.entryId).localeCompare(String(b.entryId));
  });

  return {
    ok: true,
    data: {
      season: season,
      region: region,
      maxRound: maxRound,
      untilRound: untilRound,
      unresolved: unresolved,
      rows: rows
    }
  };
}

function handleOpsSwissRebuildStandings_(payload) {
  payload = payload || {};

  var built = buildSwissStandingRowsFromMatches_(payload);
  if (!built.ok) return built;

  var rows = built.data.rows || [];
  var season = built.data.season;
  var region = built.data.region;
  var overwrite = payload.overwrite === undefined ? true : toBool_(payload.overwrite);

  var schema = getOpsSchemaByName_('ops_db_swiss_standings');
  if (!schema) return { ok: false, error: 'ops_db_swiss_standings 스키마를 찾을 수 없습니다.' };

  var ss = getSs_();
  ensureSheetSchema_(ss, schema.name, schema.headers);
  var sh = ss.getSheetByName(schema.name);

  var clearedRows = 0;
  if (overwrite) {
    clearedRows = clearOpsRowsBySeasonRegion_(sh, schema.headers, season, region);
  }

  for (var i = 0; i < rows.length; i++) {
    upsertSheetRow_(sh, schema.headers, ['season', 'region', 'entryId'], rows[i]);
  }

  appendOpsEvent_(
    'swissRebuild',
    season,
    region,
    '',
    'rows=' + rows.length + ', unresolved=' + built.data.unresolved + ', untilRound=' + built.data.untilRound
  );

  return {
    ok: true,
    data: {
      season: season,
      region: region,
      writtenRows: rows.length,
      clearedRows: clearedRows,
      unresolved: built.data.unresolved,
      maxRound: built.data.maxRound,
      untilRound: built.data.untilRound
    }
  };
}

function buildSwissPairableParticipants_(season, region) {
  var source = getOpsRowsBySeasonRegion_('ops_db_swiss_standings', season, region);

  function toParticipants_(rows, excludeFinalized) {
    var map = {};
    var list = [];

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var entryId = trim_(row.entryId);
      if (!entryId || map[entryId]) continue;

      var status = trim_(row.status).toLowerCase();
      if (excludeFinalized && (status === 'eliminated' || status === 'qualified')) {
        continue;
      }

      map[entryId] = true;
      list.push({
        entryId: entryId,
        nickname: trim_(row.nickname) || entryId,
        seed: toNumber_(row.seed, list.length + 1),
        wins: toNumber_(row.wins, 0),
        losses: toNumber_(row.losses, 0),
        status: status
      });
    }

    list.sort(function(a, b){
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      if (a.seed !== b.seed) return a.seed - b.seed;
      return String(a.entryId).localeCompare(String(b.entryId));
    });

    return list;
  }

  var pairable = toParticipants_(source, true);
  if (pairable.length === 0) pairable = toParticipants_(source, false);
  return pairable;
}

function buildSwissOpponentHistory_(matchRows, maxRoundExclusive) {
  var history = {};

  for (var i = 0; i < matchRows.length; i++) {
    var row = matchRows[i];
    var round = toNumber_(row.round, 0);
    if (maxRoundExclusive && round >= maxRoundExclusive) continue;

    if (toBool_(row.bye)) continue;

    var p1 = trim_(row.p1EntryId);
    var p2 = trim_(row.p2EntryId);
    if (!p1 || !p2) continue;

    if (!history[p1]) history[p1] = {};
    if (!history[p2]) history[p2] = {};
    history[p1][p2] = true;
    history[p2][p1] = true;
  }

  return history;
}

function hasSwissByeBefore_(entryId, matchRows, maxRoundExclusive) {
  for (var i = 0; i < matchRows.length; i++) {
    var row = matchRows[i];
    var round = toNumber_(row.round, 0);
    if (maxRoundExclusive && round >= maxRoundExclusive) continue;
    if (!toBool_(row.bye)) continue;

    if (trim_(row.p1EntryId) === entryId || trim_(row.p2EntryId) === entryId) {
      return true;
    }
  }
  return false;
}

function pickSwissByeParticipant_(participants, matchRows, maxRoundExclusive) {
  if (participants.length % 2 === 0) return null;

  for (var i = participants.length - 1; i >= 0; i--) {
    if (!hasSwissByeBefore_(participants[i].entryId, matchRows, maxRoundExclusive)) {
      return participants.splice(i, 1)[0];
    }
  }

  return participants.pop();
}

function pickSwissOpponentIndex_(base, pool, history) {
  var i;

  for (i = 0; i < pool.length; i++) {
    var c1 = pool[i];
    var rematch1 = !!(history[base.entryId] && history[base.entryId][c1.entryId]);
    if (!rematch1 && c1.wins === base.wins) return i;
  }

  for (i = 0; i < pool.length; i++) {
    var c2 = pool[i];
    var rematch2 = !!(history[base.entryId] && history[base.entryId][c2.entryId]);
    if (!rematch2) return i;
  }

  for (i = 0; i < pool.length; i++) {
    if (pool[i].wins === base.wins) return i;
  }

  return 0;
}

function buildSwissPairs_(participants, history) {
  var pending = participants.slice();
  var pairs = [];

  while (pending.length >= 2) {
    var base = pending.shift();
    var oppIndex = pickSwissOpponentIndex_(base, pending, history);
    var opp = pending.splice(oppIndex, 1)[0];

    var rematch = !!(history[base.entryId] && history[base.entryId][opp.entryId]);
    var p1 = base.seed <= opp.seed ? base : opp;
    var p2 = base.seed <= opp.seed ? opp : base;

    pairs.push({
      p1: p1,
      p2: p2,
      rematch: rematch
    });

    if (!history[base.entryId]) history[base.entryId] = {};
    if (!history[opp.entryId]) history[opp.entryId] = {};
    history[base.entryId][opp.entryId] = true;
    history[opp.entryId][base.entryId] = true;
  }

  return pairs;
}

function clearOpsSwissRoundRows_(sheet, headers, season, region, round) {
  var seasonIdx = headers.indexOf('season');
  var regionIdx = headers.indexOf('region');
  var roundIdx = headers.indexOf('round');
  if (seasonIdx < 0 || regionIdx < 0 || roundIdx < 0) return 0;

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return 0;

  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getValues();
  var cleared = 0;

  for (var i = data.length - 1; i >= 0; i--) {
    var rowSeason = trim_(data[i][seasonIdx]);
    var rowRegion = normalizeRegionKey_(data[i][regionIdx]);
    var rowRound = toNumber_(data[i][roundIdx], 0);

    if (season && rowSeason && rowSeason !== season) continue;
    if (rowRegion !== region) continue;
    if (rowRound !== round) continue;

    sheet.getRange(i + 2, 1, 1, headers.length).clearContent();
    cleared++;
  }

  return cleared;
}

function buildSwissMatchRow_(season, region, round, tableNo, p1, p2, note) {
  var row = {
    season: season,
    region: region,
    round: round,
    table: tableNo,
    highSeedEntryId: '',
    p1EntryId: '',
    p1Nickname: '',
    p1Seed: '',
    p2EntryId: '',
    p2Nickname: '',
    p2Seed: '',
    song1: '',
    level1: '',
    p1Score1: '',
    p2Score1: '',
    song2: '',
    level2: '',
    p1Score2: '',
    p2Score2: '',
    song3: '',
    level3: '',
    p1Score3: '',
    p2Score3: '',
    winnerEntryId: '',
    tieBreakerSong: '',
    bye: false,
    note: note || ''
  };

  if (p1) {
    row.p1EntryId = p1.entryId;
    row.p1Nickname = p1.nickname || p1.entryId;
    row.p1Seed = p1.seed;
  }

  if (p2) {
    row.p2EntryId = p2.entryId;
    row.p2Nickname = p2.nickname || p2.entryId;
    row.p2Seed = p2.seed;
  }

  if (p1 && p2) {
    row.highSeedEntryId = p1.seed <= p2.seed ? p1.entryId : p2.entryId;
  } else if (p1) {
    row.highSeedEntryId = p1.entryId;
    row.bye = true;
    row.winnerEntryId = p1.entryId;
    if (!row.note) row.note = 'AUTO-BYE';
  }

  return row;
}

function handleOpsSwissNextRound_(payload) {
  payload = payload || {};

  var season = trim_(payload.season) || '2026';
  var region = normalizeRegionKey_(payload.region);
  if (!region) {
    return { ok: false, error: 'region은 seoul/daejeon/gwangju/busan 중 하나여야 합니다.' };
  }

  var existingMatches = getOpsRowsBySeasonRegion_('ops_db_swiss_matches', season, region);
  var maxRound = 0;
  for (var i = 0; i < existingMatches.length; i++) {
    var rr = toNumber_(existingMatches[i].round, 0);
    if (rr > maxRound) maxRound = rr;
  }

  var requestedRound = toNumber_(payload.round, null);
  var round = requestedRound === null ? (maxRound + 1) : Math.floor(requestedRound);
  if (round < 1) return { ok: false, error: 'round는 1 이상이어야 합니다.' };

  var existingTargetRows = existingMatches.filter(function(row){
    return toNumber_(row.round, 0) === round;
  });
  var overwrite = toBool_(payload.overwrite);
  var force = toBool_(payload.force);
  if (existingTargetRows.length > 0 && !overwrite) {
    return {
      ok: false,
      error: '대상 라운드에 이미 행이 있습니다. 다시 생성하려면 overwrite=true를 사용하세요.',
      data: { season: season, region: region, round: round, existingRows: existingTargetRows.length }
    };
  }

  var prevRound = round - 1;
  if (!force && prevRound >= 1) {
    var prevRows = existingMatches.filter(function(row){
      return toNumber_(row.round, 0) === prevRound;
    });
    var incomplete = 0;
    for (var pr = 0; pr < prevRows.length; pr++) {
      var prev = prevRows[pr];
      var bye = toBool_(prev.bye);
      var winnerEntryId = trim_(prev.winnerEntryId);
      if (!bye && !winnerEntryId) incomplete++;
    }
    if (incomplete > 0) {
      return {
        ok: false,
        error: '이전 라운드가 완료되지 않았습니다. winnerEntryId 누락=' + incomplete + ', 강행하려면 force=true를 사용하세요.',
        data: { season: season, region: region, round: round, previousRound: prevRound, incomplete: incomplete }
      };
    }
  }

  var participants = buildSwissPairableParticipants_(season, region);
  if (participants.length === 0) {
    return { ok: false, error: '스위스 매칭 생성에 사용할 standings 데이터가 없습니다.' };
  }

  var history = buildSwissOpponentHistory_(existingMatches, round);
  var byeParticipant = pickSwissByeParticipant_(participants, existingMatches, round);
  var pairs = buildSwissPairs_(participants, history);

  var rowsToWrite = [];
  var summary = [];
  var tableNo = 1;

  for (var p = 0; p < pairs.length; p++) {
    var pair = pairs[p];
    var note = pair.rematch ? 'AUTO(rematch fallback)' : 'AUTO';
    var row = buildSwissMatchRow_(season, region, round, tableNo, pair.p1, pair.p2, note);
    rowsToWrite.push(row);
    summary.push({
      table: tableNo,
      p1EntryId: row.p1EntryId,
      p2EntryId: row.p2EntryId,
      rematchFallback: pair.rematch
    });
    tableNo++;
  }

  if (byeParticipant) {
    var byeRow = buildSwissMatchRow_(season, region, round, tableNo, byeParticipant, null, 'AUTO-BYE');
    rowsToWrite.push(byeRow);
    summary.push({
      table: tableNo,
      p1EntryId: byeRow.p1EntryId,
      p2EntryId: '',
      bye: true
    });
  }

  var schema = getOpsSchemaByName_('ops_db_swiss_matches');
  if (!schema) return { ok: false, error: 'ops_db_swiss_matches 스키마를 찾을 수 없습니다.' };

  var ss = getSs_();
  ensureSheetSchema_(ss, schema.name, schema.headers);
  var sh = ss.getSheetByName(schema.name);

  var clearedRows = 0;
  if (overwrite && existingTargetRows.length > 0) {
    clearedRows = clearOpsSwissRoundRows_(sh, schema.headers, season, region, round);
  }

  for (var w = 0; w < rowsToWrite.length; w++) {
    upsertSheetRow_(sh, schema.headers, ['season', 'region', 'round', 'table'], rowsToWrite[w]);
  }

  appendOpsEvent_(
    'swissNextRound',
    season,
    region,
    '',
    'round=' + round + ', rows=' + rowsToWrite.length + ', bye=' + (byeParticipant ? byeParticipant.entryId : '')
  );

  return {
    ok: true,
    data: {
      season: season,
      region: region,
      round: round,
      generatedRows: rowsToWrite.length,
      clearedRows: clearedRows,
      byeEntryId: byeParticipant ? byeParticipant.entryId : '',
      pairs: summary
    }
  };
}

function handleOpsRoundClose_(payload) {
  payload = payload || {};

  var season = trim_(payload.season) || '2026';
  var region = normalizeRegionKey_(payload.region);
  if (!region) {
    return { ok: false, error: 'region은 seoul/daejeon/gwangju/busan 중 하나여야 합니다.' };
  }

  var requestedRound = toNumber_(payload.round, null);
  if (requestedRound !== null) requestedRound = Math.floor(requestedRound);

  var rebuildPayload = {
    season: season,
    region: region,
    strict: true,
    overwrite: true
  };
  if (requestedRound !== null) {
    rebuildPayload.untilRound = Math.max(requestedRound - 1, 0);
  }

  var rebuildResult = handleOpsSwissRebuildStandings_(rebuildPayload);
  if (!rebuildResult.ok) return rebuildResult;

  payload.season = season;
  payload.region = region;
  if (requestedRound !== null) payload.round = requestedRound;

  var swissResult = handleOpsSwissNextRound_(payload);
  if (!swissResult.ok) return swissResult;

  var exportArchive = payload.exportArchive === undefined ? true : toBool_(payload.exportArchive);
  var exportResult = null;

  if (exportArchive) {
    exportResult = handleOpsExport_({
      season: swissResult.data.season,
      region: swissResult.data.region
    });
    if (!exportResult.ok) {
      return {
        ok: false,
        error: '스위스 라운드 생성 후 export에 실패했습니다: ' + String(exportResult.error || '알 수 없는 오류'),
        data: {
          rebuild: rebuildResult.data,
          swiss: swissResult.data,
          export: exportResult
        }
      };
    }
  }

  // exportArchive=false 경로에서도 opsFeed 캐시 무효화 보장
  purgeOpsFeedCache_(season, region);

  appendOpsEvent_(
    'roundClose',
    swissResult.data.season,
    swissResult.data.region,
    '',
    'round=' + swissResult.data.round +
    ', rebuilt=' + (rebuildResult.data ? rebuildResult.data.writtenRows : 0) +
    ', export=' + (exportArchive ? 'true' : 'false')
  );

  return {
    ok: true,
    data: {
      season: swissResult.data.season,
      region: swissResult.data.region,
      round: swissResult.data.round,
      rebuiltRows: rebuildResult.data ? toNumber_(rebuildResult.data.writtenRows, 0) : 0,
      generatedRows: swissResult.data.generatedRows,
      totalRows: exportResult && exportResult.data ? toNumber_(exportResult.data.totalRows, 0) : 0
    }
  };
}

function handleOpsExport_(payload) {
  payload = payload || {};

  var season = trim_(payload.season) || '2026';
  var region = trim_(payload.region || 'all').toLowerCase();
  if (region !== 'all') {
    region = normalizeRegionKey_(region);
    if (!region) return { ok: false, error: 'region 값이 올바르지 않습니다.' };
  }

  var mode = trim_(payload.mode || 'upsert').toLowerCase();
  if (mode !== 'replace') mode = 'upsert';

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
  var totalCleared = 0;

  for (var i = 0; i < exportDefs.length; i++) {
    var def = exportDefs[i];
    var source = readOptionalTable_(def.from);
    var rows = filterOpsRows_(source.rows, season, region, def.regionScoped);

    var targetSchema = archiveSchemas[def.to];
    if (!targetSchema) continue;

    ensureSheetSchema_(ss, targetSchema.name, targetSchema.headers);
    var targetSheet = ss.getSheetByName(targetSchema.name);

    // 지역 단위 replace는 지역 스코프 시트만 정리, 결선 시트는 유지
    if (mode === 'replace') {
      var cleared = 0;
      if (region !== 'all') {
        // 지역 replace: regionScoped 시트만 정리, finals(regionScoped=false)는 건드리지 않음
        if (def.regionScoped) {
          cleared = clearOpsRowsBySeasonRegion_(targetSheet, targetSchema.headers, season, region);
        }
      } else {
        // 전체 replace: 모든 시트(region-scoped + finals) 시즌 행 정리
        if (def.regionScoped) {
          cleared = clearOpsRowsBySeasonRegion_(targetSheet, targetSchema.headers, season, '');
        } else {
          cleared = clearRowsBySeason_(targetSheet, targetSchema.headers, season);
        }
      }
      totalCleared += cleared;
    }

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

  var clearedScope = mode === 'replace'
    ? (region !== 'all' ? 'regionScopedOnly' : 'seasonAll')
    : 'none';

  appendOpsEvent_(
    'export',
    season,
    region,
    '',
    'mode=' + mode + ', scope=' + clearedScope + ', exported rows=' + totalWritten + (mode === 'replace' ? ', cleared=' + totalCleared : '')
  );

  return {
    ok: true,
    data: {
      season: season,
      region: region,
      mode: mode,
      clearedScope: clearedScope,
      totalSheets: resultSheets.length,
      totalRows: totalWritten,
      totalCleared: totalCleared,
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
    songs: ARCADE_SONGS_,
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
 * if (action === 'opsInlineGuide') return json_(handleOpsInlineGuide_(params));
 * if (action === 'opsBeginnerGuide') return json_(handleOpsBeginnerGuide_(params));
 * if (action === 'opsFirstTimeSetup') return json_(handleOpsFirstTimeSetup_(payload || params));
 * if (action === 'opsUpsert') return json_(handleOpsUpsert_(payload));
 * if (action === 'opsSwissRebuildStandings') return json_(handleOpsSwissRebuildStandings_(payload || params));
 * if (action === 'opsExport') return json_(handleOpsExport_(payload || params));
 * if (action === 'opsFeed') return json_(handleOpsFeed_(params));
 * if (action === 'opsSwissNextRound') return json_(handleOpsSwissNextRound_(payload || params));
 * if (action === 'opsRoundClose') return json_(handleOpsRoundClose_(payload || params));
 */

