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
 * if (action === 'opsUpsert') return json_(handleOpsUpsert_(payload));
 * if (action === 'opsExport') return json_(handleOpsExport_(payload || params));
 * if (action === 'opsFeed') return json_(handleOpsFeed_(params));
 */
