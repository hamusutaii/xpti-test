var SHEETS = {
  events: "Events",
  completions: "Completions",
  overview: "Overview",
  archetypes: "ArchetypeStats",
  questions: "QuestionStats"
};

var DIMENSION_KEYS = [
  "dominance",
  "attachment",
  "novelty",
  "boundary",
  "control",
  "expression",
  "security",
  "pace"
];

var QUESTION_COUNT = 20;

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Quiz Analytics")
    .addItem("Setup Sheets", "setupSheets")
    .addItem("Rebuild Dashboard", "rebuildDashboard")
    .addToUi();
}

function doGet() {
  setupSheets();
  return jsonResponse_({
    ok: true,
    message: "Quiz analytics endpoint is running.",
    spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl()
  });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    setupSheets();

    var request = parseRequestBody_(e);
    var siteId = request.siteId || "xpti-test";
    var events = Array.isArray(request.events) ? request.events : [];

    if (!events.length) {
      return jsonResponse_({ ok: true, received: 0 });
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var eventRows = [];
    var completionRows = [];

    events.forEach(function (eventItem) {
      eventRows.push(buildEventRow_(siteId, eventItem));

      if (eventItem.event === "quiz_completed") {
        completionRows.push(buildCompletionRow_(siteId, eventItem));
      }
    });

    appendRows_(spreadsheet.getSheetByName(SHEETS.events), eventRows);

    if (completionRows.length) {
      appendRows_(spreadsheet.getSheetByName(SHEETS.completions), completionRows);
    }

    rebuildDashboard();

    return jsonResponse_({
      ok: true,
      received: events.length,
      completionRows: completionRows.length
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      error: error && error.message ? error.message : String(error)
    });
  } finally {
    lock.releaseLock();
  }
}

function setupSheets() {
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  ensureSheet_(spreadsheet, SHEETS.events, buildEventHeaders_());
  ensureSheet_(spreadsheet, SHEETS.completions, buildCompletionHeaders_());
  ensureSheet_(spreadsheet, SHEETS.overview, ["指标", "数值"]);
  ensureSheet_(spreadsheet, SHEETS.archetypes, ["类型 ID", "类型名称", "完成人数", "占比"]);
  ensureSheet_(spreadsheet, SHEETS.questions, ["题号", "选项", "标签", "人数", "占比"]);
}

function rebuildDashboard() {
  setupSheets();

  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var eventsSheet = spreadsheet.getSheetByName(SHEETS.events);
  var completionsSheet = spreadsheet.getSheetByName(SHEETS.completions);

  var eventRows = readSheetObjects_(eventsSheet);
  var completionRows = readSheetObjects_(completionsSheet);

  writeOverview_(spreadsheet.getSheetByName(SHEETS.overview), eventRows, completionRows);
  writeArchetypeStats_(spreadsheet.getSheetByName(SHEETS.archetypes), completionRows);
  writeQuestionStats_(spreadsheet.getSheetByName(SHEETS.questions), completionRows);
}

function buildEventHeaders_() {
  return [
    "timestamp",
    "site_id",
    "event_id",
    "event_name",
    "session_id",
    "page",
    "url",
    "payload_json"
  ];
}

function buildCompletionHeaders_() {
  var headers = [
    "timestamp",
    "site_id",
    "session_id",
    "main_type",
    "main_name",
    "main_score",
    "match_1",
    "match_1_score",
    "match_2",
    "match_2_score"
  ];

  DIMENSION_KEYS.forEach(function (key) {
    headers.push("dim_" + key);
  });

  for (var i = 1; i <= QUESTION_COUNT; i += 1) {
    headers.push("q" + pad2_(i));
  }

  return headers;
}

function parseRequestBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return {};
  }

  return JSON.parse(e.postData.contents);
}

function buildEventRow_(siteId, eventItem) {
  return [
    eventItem.timestamp || new Date().toISOString(),
    siteId,
    eventItem.id || "",
    eventItem.event || "",
    eventItem.sessionId || "",
    eventItem.page || "",
    eventItem.url || "",
    JSON.stringify(eventItem.payload || {})
  ];
}

function buildCompletionRow_(siteId, eventItem) {
  var payload = eventItem.payload || {};
  var matches = Array.isArray(payload.matches) ? payload.matches : [];
  var dimensions = payload.dimensions || {};
  var answers = Array.isArray(payload.answers) ? payload.answers : [];
  var row = [
    eventItem.timestamp || new Date().toISOString(),
    siteId,
    eventItem.sessionId || "",
    payload.mainType || "",
    payload.mainName || "",
    payload.mainScore || "",
    matches[0] ? matches[0].name : "",
    matches[0] ? matches[0].score : "",
    matches[1] ? matches[1].name : "",
    matches[1] ? matches[1].score : ""
  ];

  DIMENSION_KEYS.forEach(function (key) {
    row.push(typeof dimensions[key] === "number" ? dimensions[key] : "");
  });

  for (var i = 0; i < QUESTION_COUNT; i += 1) {
    row.push(typeof answers[i] === "number" ? answers[i] + 1 : "");
  }

  return row;
}

function ensureSheet_(spreadsheet, sheetName, headers) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  var currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var isHeaderMissing = headers.some(function (header, index) {
    return currentHeaders[index] !== header;
  });

  if (sheet.getLastRow() === 0 || isHeaderMissing) {
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function appendRows_(sheet, rows) {
  if (!rows.length) {
    return;
  }

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function readSheetObjects_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastColumn = sheet.getLastColumn();

  if (lastRow < 2 || lastColumn === 0) {
    return [];
  }

  var values = sheet.getRange(1, 1, lastRow, lastColumn).getValues();
  var headers = values[0];

  return values.slice(1).map(function (row) {
    var item = {};
    headers.forEach(function (header, index) {
      item[header] = row[index];
    });
    return item;
  });
}

function writeOverview_(sheet, eventRows, completionRows) {
  var quizStartedSessions = uniqueCount_(
    eventRows
      .filter(function (row) { return row.event_name === "quiz_started"; })
      .map(function (row) { return row.session_id; })
  );

  var completionSessions = uniqueCount_(
    completionRows.map(function (row) { return row.session_id; })
  );

  var summaryCopied = eventRows.filter(function (row) {
    return row.event_name === "result_summary_copied";
  }).length;

  var imageGenerated = eventRows.filter(function (row) {
    return row.event_name === "result_image_generated";
  }).length;

  var imageDownloaded = eventRows.filter(function (row) {
    return row.event_name === "result_image_downloaded";
  }).length;

  var rows = [
    ["指标", "数值"],
    ["最近刷新", new Date()],
    ["开始答题人数", quizStartedSessions],
    ["完成答题人数", completionSessions],
    ["完成率", quizStartedSessions ? completionSessions / quizStartedSessions : 0],
    ["复制结果次数", summaryCopied],
    ["生成结果图次数", imageGenerated],
    ["下载结果图次数", imageDownloaded]
  ];

  sheet.clear();
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.setFrozenRows(1);
  sheet.getRange("B5").setNumberFormat("0.0%");
  sheet.autoResizeColumns(1, 2);
}

function writeArchetypeStats_(sheet, completionRows) {
  var counts = {};
  var names = {};
  var total = completionRows.length;

  completionRows.forEach(function (row) {
    var typeId = row.main_type || "unknown";
    counts[typeId] = (counts[typeId] || 0) + 1;
    names[typeId] = row.main_name || typeId;
  });

  var rows = [["类型 ID", "类型名称", "完成人数", "占比"]];

  Object.keys(counts)
    .sort(function (left, right) { return counts[right] - counts[left]; })
    .forEach(function (typeId) {
      rows.push([
        typeId,
        names[typeId],
        counts[typeId],
        total ? counts[typeId] / total : 0
      ]);
    });

  sheet.clear();
  sheet.getRange(1, 1, rows.length, 4).setValues(rows);
  sheet.setFrozenRows(1);
  if (rows.length > 1) {
    sheet.getRange(2, 4, rows.length - 1, 1).setNumberFormat("0.0%");
  }
  sheet.autoResizeColumns(1, 4);
}

function writeQuestionStats_(sheet, completionRows) {
  var rows = [["题号", "选项", "标签", "人数", "占比"]];
  var total = completionRows.length;

  for (var questionNumber = 1; questionNumber <= QUESTION_COUNT; questionNumber += 1) {
    var key = "q" + pad2_(questionNumber);
    var counts = { 1: 0, 2: 0, 3: 0, 4: 0 };

    completionRows.forEach(function (row) {
      var optionValue = Number(row[key]);
      if (counts[optionValue] !== undefined) {
        counts[optionValue] += 1;
      }
    });

    for (var optionIndex = 1; optionIndex <= 4; optionIndex += 1) {
      rows.push([
        questionNumber,
        optionIndex,
        optionLabel_(optionIndex),
        counts[optionIndex],
        total ? counts[optionIndex] / total : 0
      ]);
    }
  }

  sheet.clear();
  sheet.getRange(1, 1, rows.length, 5).setValues(rows);
  sheet.setFrozenRows(1);
  if (rows.length > 1) {
    sheet.getRange(2, 5, rows.length - 1, 1).setNumberFormat("0.0%");
  }
  sheet.autoResizeColumns(1, 5);
}

function uniqueCount_(list) {
  var seen = {};
  list.forEach(function (value) {
    if (value) {
      seen[String(value)] = true;
    }
  });
  return Object.keys(seen).length;
}

function optionLabel_(value) {
  return ["", "A", "B", "C", "D"][value] || "";
}

function pad2_(value) {
  return value < 10 ? "0" + value : String(value);
}

function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
