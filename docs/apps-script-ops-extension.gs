/**
 * TKC2026 Ops Extension (append to existing Code.gs)
 *
 * Adds actions:
 * - opsInit   : create ops_db_* tabs
 * - opsUpsert : write/update one row into ops_db_*
 * - opsSwissRebuildStandings : rebuild ops_db_swiss_standings from match results
 * - opsExport : copy ops_db_* -> arcade_archive_* (incremental upsert)
 * - opsFeed   : build archive payload from ops_db_* for broadcast/control pages
 * - opsSwissNextRound : generate next swiss round pairings (with BYE)
 * - opsRoundClose     : opsSwissNextRound + opsExport in one call
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
 * if (action === 'opsSwissRebuildStandings') return json_(handleOpsSwissRebuildStandings_(payload || params));
 * if (action === 'opsExport') return json_(handleOpsExport_(payload || params));
 * if (action === 'opsFeed') return json_(handleOpsFeed_(params));
 * if (action === 'opsSwissNextRound') return json_(handleOpsSwissNextRound_(payload || params));
 * if (action === 'opsRoundClose') return json_(handleOpsRoundClose_(payload || params));
 */
