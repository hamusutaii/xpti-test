(function () {
  // The app keeps quiz state in memory/localStorage and recalculates all scores from answers.
  const quizData = window.QUIZ_DATA;
  const app = document.getElementById("app");
  const clearDataTopButton = document.getElementById("clear-data-top");
  const debugToggleButton = document.getElementById("debug-toggle");
  const statsLink = document.getElementById("stats-link");

  const STORAGE_KEY = "relationship-profile-state-v3";
  const DEBUG_KEY = "relationship-profile-debug-v3";
  const ANALYTICS_QUEUE_KEY = "relationship-profile-analytics-queue-v1";
  const analyticsConfig = quizData.analyticsConfig || {};
  const TOTAL_QUESTIONS = quizData.questions.length;
  const DIMENSION_IDS = quizData.dimensions.map(function (item) {
    return item.id;
  });
  const ARCHETYPE_MAP = Object.fromEntries(
    quizData.archetypes.map(function (item) {
      return [item.id, item];
    })
  );
  const dimensionBounds = buildDimensionBounds();

  let debugTapCount = 0;
  let debugTapTimer = null;
  let exportPreviewUrl = "";
  let analyticsFlushTimer = null;
  let lastTrackedViewKey = "";
  const analyticsQueue = hydrateAnalyticsQueue();
  const sessionId = getOrCreateSessionId();
  const analyticsFlags = hydrateAnalyticsFlags();
  let state = hydrateState();

  const debugMode = {
    enabled: window.location.search.includes("debug=1") || localStorage.getItem(DEBUG_KEY) === "1"
  };

  window.quizDebug = {
    enable: function () {
      debugMode.enabled = true;
      localStorage.setItem(DEBUG_KEY, "1");
      showToast("Debug 模式已开启。");
      if (state.latestResult) {
        printDebugScores(state.latestResult);
      }
    },
    disable: function () {
      debugMode.enabled = false;
      localStorage.removeItem(DEBUG_KEY);
      showToast("Debug 模式已关闭。");
    },
    print: function () {
      if (state.latestResult) {
        printDebugScores(state.latestResult);
      }
    },
    state: function () {
      return JSON.parse(JSON.stringify(state));
    }
  };

  bindEvents();
  render();
  initAnalytics();

  function bindEvents() {
    document.addEventListener("click", handleDocumentClick);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("online", flushAnalyticsQueue);
    debugToggleButton.addEventListener("click", handleDebugToggleTap);
    clearDataTopButton.addEventListener("click", clearAllData);
    if (statsLink) {
      statsLink.addEventListener("click", function () {
        trackAnalytics("dashboard_opened", {
          hasDashboard: Boolean(analyticsConfig.dashboardUrl)
        }, { immediate: true });
      });
    }
  }

  function handleDocumentClick(event) {
    const optionButton = event.target.closest("[data-option-index]");
    if (optionButton) {
      selectAnswer(Number(optionButton.dataset.optionIndex));
      return;
    }

    const actionButton = event.target.closest("[data-action]");
    if (!actionButton) {
      return;
    }

    switch (actionButton.dataset.action) {
      case "start":
        beginQuiz({ resume: false, keepResult: true });
        break;
      case "resume":
        beginQuiz({ resume: true, keepResult: true });
        break;
      case "show-result":
        showLatestResult();
        break;
      case "go-home":
        state.phase = "home";
        persistState();
        render();
        break;
      case "previous":
        goToPreviousQuestion();
        break;
      case "next":
        goToNextStep();
        break;
      case "restart":
        if (window.confirm("重新开始会清空当前答题进度，但保留上一份结果。确定继续吗？")) {
          beginQuiz({ resume: false, keepResult: true });
        }
        break;
      case "copy-result":
        copyResultSummary();
        break;
      case "generate-image":
        generateResultImage();
        break;
      case "download-image":
        downloadResultImage();
        break;
      case "close-image":
        closeResultImage();
        break;
      case "clear-all":
        clearAllData();
        break;
      default:
        break;
    }
  }

  function handleDebugToggleTap() {
    debugTapCount += 1;

    window.clearTimeout(debugTapTimer);
    debugTapTimer = window.setTimeout(function () {
      debugTapCount = 0;
    }, 1500);

    if (debugTapCount >= 6) {
      debugTapCount = 0;
      if (debugMode.enabled) {
        window.quizDebug.disable();
      } else {
        window.quizDebug.enable();
      }
    }
  }

  function hydrateState() {
    const emptyState = {
      phase: "home",
      currentIndex: 0,
      answers: createEmptyAnswers(),
      latestResult: null
    };

    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    } catch (error) {
      parsed = null;
    }

    if (!parsed || typeof parsed !== "object") {
      return emptyState;
    }

    const answers = sanitizeAnswers(parsed.answers);
    const answeredCount = getAnsweredCount(answers);

    return {
      phase: ["home", "quiz", "result"].includes(parsed.phase) ? parsed.phase : "home",
      currentIndex: clamp(
        Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : findResumeIndex(answers),
        0,
        TOTAL_QUESTIONS - 1
      ),
      answers: answers,
      latestResult: answeredCount === TOTAL_QUESTIONS ? calculateResult(answers) : parsed.latestResult
    };
  }

  function sanitizeAnswers(input) {
    const fallback = createEmptyAnswers();
    if (!Array.isArray(input)) {
      return fallback;
    }

    return fallback.map(function (_, index) {
      return input[index] === 0 || input[index] === 1 || input[index] === 2 || input[index] === 3
        ? input[index]
        : null;
    });
  }

  function createEmptyAnswers() {
    return Array.from({ length: TOTAL_QUESTIONS }, function () {
      return null;
    });
  }

  function buildDimensionBounds() {
    const bounds = Object.fromEntries(
      DIMENSION_IDS.map(function (dimensionId) {
        return [dimensionId, 0];
      })
    );

    quizData.questions.forEach(function (question) {
      DIMENSION_IDS.forEach(function (dimensionId) {
        const strongest = question.options.reduce(function (maxValue, option) {
          return Math.max(maxValue, Math.abs(Number(option.scores[dimensionId] || 0)));
        }, 0);
        bounds[dimensionId] += strongest;
      });
    });

    return bounds;
  }

  function getAnsweredCount(answers) {
    return answers.filter(function (answer) {
      return answer !== null;
    }).length;
  }

  function findResumeIndex(answers) {
    const index = answers.findIndex(function (answer) {
      return answer === null;
    });

    return index === -1 ? TOTAL_QUESTIONS - 1 : index;
  }

  function persistState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function render() {
    normalizePhase();
    updateTopAction();
    updateDocumentTitle();

    if (state.phase === "quiz") {
      app.innerHTML = renderQuiz();
    } else if (state.phase === "result" && state.latestResult) {
      app.innerHTML = renderResult(state.latestResult);
      if (debugMode.enabled) {
        printDebugScores(state.latestResult);
      }
    } else {
      app.innerHTML = renderHome();
    }

    scrollToTop();
    maybeTrackPhaseView();
  }

  function normalizePhase() {
    const answeredCount = getAnsweredCount(state.answers);

    if (state.phase === "result" && !state.latestResult) {
      state.phase = answeredCount > 0 ? "quiz" : "home";
    }

    if (state.phase === "quiz" && answeredCount === TOTAL_QUESTIONS && state.latestResult) {
      state.phase = "result";
    }
  }

  function updateTopAction() {
    clearDataTopButton.hidden = !(getAnsweredCount(state.answers) > 0 || state.latestResult);
    if (statsLink) {
      const showDashboard = shouldExposeDashboard();
      statsLink.hidden = !showDashboard;
      if (showDashboard) {
        statsLink.href = analyticsConfig.dashboardUrl;
      }
    }
  }

  function updateDocumentTitle() {
    if (state.phase === "result" && state.latestResult) {
      document.title = state.latestResult.main.name + "｜关系风格评估";
      return;
    }

    document.title = "关系风格评估";
  }

  function renderHome() {
    const answeredCount = getAnsweredCount(state.answers);
    const hasPartialProgress = answeredCount > 0 && answeredCount < TOTAL_QUESTIONS;
    const startAction = hasPartialProgress ? "resume" : "start";
    const startLabel = hasPartialProgress ? "继续答题" : state.latestResult ? "重新测一遍" : "开始评估";
    const showDashboard = shouldExposeDashboard();

    return [
      '<section class="panel">',
      '  <div class="panel-inner">',
      '    <p class="eyebrow">RELATION ASSESSMENT</p>',
      '    <h1 class="hero-title">20 个关系场景，<br>拆出你靠近、推进和留白的真实习惯。</h1>',
      '    <p class="hero-subtitle">这不是一眼能看穿答案的测试，更像一份适合放到手机里慢慢读完的关系侧写。它会从你处理边界、节奏、确认感和表达方式的细节里，看出你真正的相处结构。</p>',
      '    <div class="pill-row">',
      '      <span class="pill">20 道题</span>',
      '      <span class="pill">每题 4 个选项</span>',
      '      <span class="pill">8 个维度</span>',
      '      <span class="pill">10 类原型</span>',
      "    </div>",
      hasPartialProgress
        ? '    <section class="status-card"><h2 class="fact-title">你上次停在一半</h2><p class="muted-text">已经完成 ' +
          answeredCount +
          "/" +
          TOTAL_QUESTIONS +
          ' 题，进度已经保存在本地。</p></section>'
        : "",
      '    <div class="action-stack">',
      '      <button class="primary-button" type="button" data-action="' + startAction + '">' + startLabel + "</button>",
      state.latestResult
        ? '      <button class="secondary-button" type="button" data-action="show-result">查看上次结果</button>'
        : "",
      getAnsweredCount(state.answers) > 0 || state.latestResult
        ? '      <button class="tertiary-button" type="button" data-action="clear-all">清空记录</button>'
        : "",
      "    </div>",
      '    <div class="overview-grid">',
      '      <article class="overview-card"><h2 class="fact-title">它会看什么</h2><p class="muted-text">不是只看你主不主动，而是同时看你的推进倾向、依附浓度、边界收口、表达方式、控制感、确认需求、升温速度和新鲜偏好。</p></article>',
      '      <article class="overview-card"><h2 class="fact-title">结果会给出什么</h2><p class="muted-text">主型与副型、八维分布、关系盲区、建议，以及最容易跟你合拍的 2 个类型和原因。</p></article>',
      showDashboard
        ? '      <article class="overview-card"><h2 class="fact-title">统计后台</h2><p class="muted-text">当前站点已经接入统计入口。带着当前页面的 <code>?admin=1</code> 参数打开时，可以直接从右上角进入后台。</p></article>'
        : "",
      "    </div>",
      "  </div>",
      "</section>"
    ].join("");
  }

  function renderQuiz() {
    const question = quizData.questions[state.currentIndex];
    const currentAnswer = state.answers[state.currentIndex];
    const answeredCount = getAnsweredCount(state.answers);
    const progress = Math.round(((state.currentIndex + 1) / TOTAL_QUESTIONS) * 100);

    return [
      '<section class="panel">',
      '  <div class="panel-inner">',
      '    <div class="question-header">',
      '      <p class="eyebrow">QUESTION ' + String(state.currentIndex + 1).padStart(2, "0") + " / " + TOTAL_QUESTIONS + "</p>",
      '      <span class="meta-pill">已答 ' + answeredCount + "/" + TOTAL_QUESTIONS + "</span>",
      "    </div>",
      '    <div class="progress-track"><div class="progress-fill" style="width:' + progress + '%"></div></div>',
      '    <p class="progress-caption">选更接近你默认反应的一项。没有标准答案，只有更像你的答案。</p>',
      '    <h1 class="question-title">' + question.text + "</h1>",
      '    <div class="option-list">',
      question.options
        .map(function (option, optionIndex) {
          const selected = currentAnswer === optionIndex;
          return [
            '<button class="option-button' + (selected ? " is-selected" : "") + '" type="button" data-option-index="' + optionIndex + '" aria-pressed="' + String(selected) + '">',
            '  <div class="option-top"><span class="option-mark">' + String.fromCharCode(65 + optionIndex) + "</span></div>",
            '  <p class="option-copy">' + option.text + "</p>",
            "</button>"
          ].join("");
        })
        .join(""),
      "    </div>",
      '    <div class="question-footer">',
      '      <span class="support-text">' + (currentAnswer === null ? "先选一个最接近你的选项。" : "你可以返回修改，分数会自动更新。") + "</span>",
      '      <button class="inline-link" type="button" data-action="restart">重新开始</button>',
      "    </div>",
      '    <div class="question-actions">',
      '      <button class="nav-button" type="button" data-action="previous"' + (state.currentIndex === 0 ? " disabled" : "") + ">上一题</button>",
      '      <button class="nav-button nav-button--primary" type="button" data-action="next"' + (currentAnswer === null ? " disabled" : "") + ">" + (state.currentIndex === TOTAL_QUESTIONS - 1 ? "查看结果" : "下一题") + "</button>",
      "    </div>",
      "  </div>",
      "</section>"
    ].join("");
  }

  function renderResult(result) {
    const secondary = result.rankings.slice(1, 3);
    const dimensionCards = quizData.dimensions
      .map(function (dimension) {
        const value = result.dimensionScores[dimension.id];
        return [
          '<article class="dimension-card">',
          '  <div class="dimension-head">',
          '    <h3 class="dimension-title">' + dimension.label + "</h3>",
          '    <span class="dimension-score">' + value + "%</span>",
          "  </div>",
          '  <div class="bar-track"><div class="bar-fill" style="width:' + value + '%"></div></div>',
          '  <div class="bar-endpoints"><span>' + dimension.leftLabel + "</span><span>" + dimension.rightLabel + "</span></div>",
          "</article>"
        ].join("");
      })
      .join("");

    const secondaryCards = secondary
      .map(function (item) {
        return [
          '<article class="secondary-card">',
          '  <span class="secondary-score">' + item.emoji + " " + item.name + " · " + item.score + "%</span>",
          '  <h3 class="secondary-title">' + item.nickname + "</h3>",
          '  <p class="secondary-note">' + item.summary + "</p>",
          "</article>"
        ].join("");
      })
      .join("");

    const matchCards = result.matches
      .map(function (item, index) {
        return [
          '<article class="secondary-card">',
          '  <span class="secondary-score">匹配 ' + (index + 1) + " · " + item.score + "%</span>",
          '  <h3 class="secondary-title">' + item.emoji + " " + item.name + "</h3>",
          '  <p class="secondary-note">' + item.reason + "</p>",
          "</article>"
        ].join("");
      })
      .join("");

    const shareCards = [
      { label: "随意版", text: result.shareTexts.casual },
      { label: "带点挑衅版", text: result.shareTexts.provocative },
      { label: "中性版", text: result.shareTexts.neutral }
    ]
      .map(function (item) {
        return [
          '<article class="share-card">',
          '  <h3 class="share-title">' + item.label + "</h3>",
          '  <p class="share-text">' + item.text + "</p>",
          "</article>"
        ].join("");
      })
      .join("");

    return [
      '<section class="panel">',
      '  <div class="panel-inner">',
      '    <div class="report-hero">',
      '      <div>',
      '        <p class="eyebrow">ASSESSMENT REPORT</p>',
      '        <h1 class="result-title">' + result.main.emoji + " " + result.main.name + "</h1>",
      '        <p class="report-meta">主型匹配度 ' + result.main.score + "% · " + result.main.nickname + "</p>",
      '        <p class="result-summary">' + result.main.summary + "</p>",
      "      </div>",
      '      <div class="summary-grid">',
      '        <article class="summary-card summary-card--quote"><span class="summary-label">一句看透你的话</span><strong class="summary-value">' + result.main.summary + "</strong></article>",
      '        <article class="summary-card"><span class="summary-label">次级倾向</span><strong class="summary-value">' + secondary.map(function (item) { return item.name; }).join(" / ") + "</strong></article>",
      '        <article class="summary-card"><span class="summary-label">关系底色</span><strong class="summary-value">' + result.reportTone + "</strong></article>",
      "      </div>",
      '      <div class="report-tags">' + result.topDimensions.map(function (tag) { return '<span class="report-tag">' + tag + "</span>"; }).join("") + "</div>",
      "    </div>",
      '    <div class="section-block">',
      '      <h2 class="section-title">这份结果像什么</h2>',
      '      <p class="section-intro">不是标签，更像你在关系里最稳定会露出来的那一面。</p>',
      '      <div class="report-card"><p class="muted-text">' + result.main.interpretation + "</p></div>",
      "    </div>",
      '    <div class="section-block">',
      '      <h2 class="section-title">你的结构</h2>',
      '      <p class="section-intro">八个维度里，哪几条最像你的默认设置，一眼就能看出来。</p>',
      '      <div class="dimension-grid">' + dimensionCards + "</div>",
      "    </div>",
      '    <div class="section-block">',
      '      <h2 class="section-title">你不只一种样子</h2>',
      '      <p class="section-intro">主型之外，你身上最容易浮出来的另外两层气质。</p>',
      '      <div class="secondary-grid">' + secondaryCards + "</div>",
      "    </div>",
      '    <div class="section-block">',
      '      <h2 class="section-title">最容易合拍的人</h2>',
      '      <p class="section-intro">按推进平衡、情感浓度、边界理解和升温速度算出来的前两名。</p>',
      '      <div class="secondary-grid">' + matchCards + "</div>",
      "    </div>",
      '    <div class="section-block">',
      '      <h2 class="section-title">关系侧写</h2>',
      '      <p class="section-intro">你最容易被谁吸引、最可能在哪一步卡住，以及该怎么把关系做得更顺。</p>',
      '      <div class="report-grid">',
      '        <article class="detail-card"><h3 class="detail-title">你吸引的人</h3><p class="detail-copy">' + result.main.attracts + "</p></article>",
      '        <article class="detail-card"><h3 class="detail-title">你的风险点</h3><p class="detail-copy">' + result.main.risk + "</p></article>",
      "      </div>",
      '      <div class="section-block">',
      '        <article class="detail-card"><h3 class="detail-title">给你的建议</h3><p class="detail-copy">' + result.main.advice + "</p></article>",
      "      </div>",
      "    </div>",
      '    <div class="section-block">',
      '      <h2 class="section-title">适合转发出去的话</h2>',
      '      <p class="section-intro">给朋友、朋友圈或群聊都不尴尬，语气也各不一样。</p>',
      '      <div class="share-grid">' + shareCards + "</div>",
      "    </div>",
      '    <div class="result-actions">',
      '      <button class="primary-button" type="button" data-action="generate-image">生成 JPG 结果图</button>',
      '      <button class="secondary-button" type="button" data-action="copy-result">复制结果摘要</button>',
      '      <button class="secondary-button" type="button" data-action="restart">重新测一遍</button>',
      '      <button class="tertiary-button" type="button" data-action="go-home">返回首页</button>',
      '      <button class="tertiary-button" type="button" data-action="clear-all">清空记录</button>',
      "    </div>",
      "  </div>",
      "</section>",
      renderImageModal()
    ].join("");
  }

  function renderImageModal() {
    if (!exportPreviewUrl) {
      return "";
    }

    return [
      '<section class="poster-modal" role="dialog" aria-modal="true" aria-label="结果图预览">',
      '  <div class="poster-backdrop" data-action="close-image"></div>',
      '  <div class="poster-sheet">',
      '    <div class="poster-sheet__header">',
      '      <div><p class="eyebrow">JPG PREVIEW</p><p class="poster-note">适合直接转发到微信或保存到手机。</p></div>',
      '      <button class="inline-link" type="button" data-action="close-image">关闭</button>',
      "    </div>",
      '    <div class="poster-sheet__body">',
      '      <img class="poster-image" src="' + exportPreviewUrl + '" alt="关系风格 JPG 结果图">',
      "    </div>",
      '    <div class="poster-toolbar">',
      '      <button class="primary-button" type="button" data-action="download-image">下载 JPG</button>',
      '      <button class="secondary-button" type="button" data-action="close-image">返回结果页</button>',
      "    </div>",
      "  </div>",
      "</section>"
    ].join("");
  }

  function beginQuiz(options) {
    const existingAnswers = sanitizeAnswers(state.answers);
    const hasProgress = getAnsweredCount(existingAnswers) > 0;
    const answeredBeforeReset = getAnsweredCount(state.answers);

    state.phase = "quiz";

    if (options.resume && hasProgress) {
      state.answers = existingAnswers;
      state.currentIndex = findResumeIndex(existingAnswers);
    } else {
      state.answers = createEmptyAnswers();
      state.currentIndex = 0;
    }

    persistState();
    render();
    trackAnalytics("quiz_started", {
      resumed: Boolean(options.resume && hasProgress),
      previousAnsweredCount: answeredBeforeReset
    }, { immediate: true });
  }

  function showLatestResult() {
    if (!state.latestResult) {
      showToast("还没有可查看的结果。");
      return;
    }

    state.phase = "result";
    persistState();
    render();
    trackAnalytics("result_reopened", {
      mainType: state.latestResult.main.id,
      mainName: state.latestResult.main.name
    });
  }

  function selectAnswer(optionIndex) {
    const previousAnswer = state.answers[state.currentIndex];
    state.answers[state.currentIndex] = optionIndex;
    persistState();
    render();
    trackAnalytics("question_answered", {
      questionId: quizData.questions[state.currentIndex].id,
      questionNumber: state.currentIndex + 1,
      optionIndex: optionIndex,
      replaced: previousAnswer !== null && previousAnswer !== optionIndex,
      answeredCount: getAnsweredCount(state.answers)
    });
  }

  function goToPreviousQuestion() {
    if (state.currentIndex === 0) {
      return;
    }

    state.currentIndex -= 1;
    persistState();
    render();
  }

  function goToNextStep() {
    if (state.answers[state.currentIndex] === null) {
      showToast("先选一个更像你的选项。");
      return;
    }

    if (state.currentIndex === TOTAL_QUESTIONS - 1) {
      finishQuiz();
      return;
    }

    state.currentIndex += 1;
    persistState();
    render();
  }

  function finishQuiz() {
    const firstMissing = state.answers.findIndex(function (answer) {
      return answer === null;
    });

    if (firstMissing !== -1) {
      state.currentIndex = firstMissing;
      persistState();
      render();
      showToast("还有题没做完，已经帮你跳过去了。");
      return;
    }

    state.latestResult = calculateResult(state.answers);
    state.phase = "result";
    persistState();
    render();
    trackAnalytics("quiz_completed", buildCompletionPayload(state.latestResult), { immediate: true });
  }

  function calculateResult(answers) {
    const rawTotals = Object.fromEntries(
      DIMENSION_IDS.map(function (dimensionId) {
        return [dimensionId, 0];
      })
    );

    quizData.questions.forEach(function (question, questionIndex) {
      const answerIndex = answers[questionIndex];
      const scores = question.options[answerIndex].scores;

      DIMENSION_IDS.forEach(function (dimensionId) {
        rawTotals[dimensionId] += Number(scores[dimensionId] || 0);
      });
    });

    const dimensionScores = Object.fromEntries(
      DIMENSION_IDS.map(function (dimensionId) {
        return [dimensionId, normalizeDimension(rawTotals[dimensionId], dimensionBounds[dimensionId])];
      })
    );

    const regularRankings = quizData.archetypes
      .filter(function (archetype) {
        return archetype.id !== "chaos";
      })
      .map(function (archetype) {
        return Object.assign({}, archetype, {
          score: scoreRegularArchetype(archetype, dimensionScores)
        });
      })
      .sort(function (left, right) {
        return right.score - left.score;
      });

    const chaosMeta = measureChaos(dimensionScores, regularRankings);
    const chaosArchetype = Object.assign({}, ARCHETYPE_MAP.chaos, {
      score: scoreChaosArchetype(chaosMeta)
    });

    const rankings = regularRankings
      .concat(chaosArchetype)
      .sort(function (left, right) {
        return right.score - left.score;
      });

    const main = rankings[0];

    return {
      createdAt: new Date().toISOString(),
      rawTotals: rawTotals,
      dimensionScores: dimensionScores,
      rankings: rankings,
      main: main,
      matches: buildMatches(main.id, dimensionScores),
      signalTags: buildSignalTags(dimensionScores),
      topDimensions: buildTopDimensionLabels(dimensionScores),
      reportTone: buildReportTone(main, dimensionScores),
      shareTexts: buildShareTexts(main, buildSignalTags(dimensionScores)),
      chaosMeta: chaosMeta
    };
  }

  function normalizeDimension(value, bound) {
    if (!bound) {
      return 50;
    }

    return clamp(Math.round(((value + bound) / (2 * bound)) * 100), 0, 100);
  }

  function scoreRegularArchetype(archetype, scores) {
    let weightedDistance = 0;
    let totalWeight = 0;

    DIMENSION_IDS.forEach(function (dimensionId) {
      const weight = Number(archetype.weights[dimensionId] || 1);
      totalWeight += weight;
      weightedDistance += Math.abs(scores[dimensionId] - archetype.profile[dimensionId]) * weight;
    });

    const averageDistance = weightedDistance / totalWeight;
    const baseScore = 100 - averageDistance * 1.08;
    const bonus = scoreArchetypeBonus(archetype.id, scores);

    return clamp(Math.round(baseScore + bonus), 18, 97);
  }

  function scoreArchetypeBonus(archetypeId, scores) {
    switch (archetypeId) {
      case "dog":
        return (
          (scores.attachment > 70 ? 7 : 0) +
          (scores.security > 68 ? 7 : 0) +
          (scores.dominance < 45 ? 5 : 0) -
          (scores.control > 70 ? 4 : 0)
        );
      case "hunter":
        return (
          (scores.dominance > 70 ? 8 : 0) +
          (scores.control > 72 ? 8 : 0) +
          (scores.pace > 64 ? 5 : 0) -
          (scores.security > 72 ? 3 : 0)
        );
      case "cat":
        return (
          (scores.attachment < 38 ? 8 : 0) +
          (scores.expression < 40 ? 8 : 0) +
          (scores.security < 42 ? 6 : 0)
        );
      case "explorer":
        return (
          (scores.novelty > 74 ? 10 : 0) +
          (scores.boundary < 42 ? 6 : 0) +
          (scores.pace > 58 ? 4 : 0)
        );
      case "observer":
        return (
          (scores.attachment < 34 ? 8 : 0) +
          (scores.expression < 36 ? 9 : 0) +
          (scores.pace < 40 ? 5 : 0)
        );
      case "binding":
        return (
          (scores.attachment > 78 ? 9 : 0) +
          (scores.boundary > 74 ? 9 : 0) +
          (scores.security > 70 ? 7 : 0)
        );
      case "reversal":
        return (
          (scores.dominance > 58 ? 5 : 0) +
          (scores.attachment > 64 ? 6 : 0) +
          (scores.security > 62 ? 5 : 0) +
          (scores.control > 64 ? 6 : 0)
        );
      case "steady":
        return (
          (scores.novelty < 34 ? 10 : 0) +
          (scores.pace < 38 ? 8 : 0) +
          (scores.boundary > 58 ? 5 : 0)
        );
      case "probing":
        return (
          (scores.pace < 34 ? 10 : 0) +
          (scores.security > 66 ? 8 : 0) +
          (scores.expression < 46 ? 6 : 0)
        );
      default:
        return 0;
    }
  }

  function measureChaos(scores, regularRankings) {
    const values = DIMENSION_IDS.map(function (dimensionId) {
      return scores[dimensionId];
    });
    const dispersion = standardDeviation(values);
    const highCount = values.filter(function (value) {
      return value >= 70;
    }).length;
    const lowCount = values.filter(function (value) {
      return value <= 30;
    }).length;
    const contradiction = average([
      Math.abs(scores.dominance - scores.attachment),
      Math.abs(scores.control - scores.expression),
      Math.abs(scores.novelty - scores.boundary),
      Math.abs(scores.security - scores.pace)
    ]);
    const topRegular = regularRankings[0] ? regularRankings[0].score : 60;
    const secondRegular = regularRankings[1] ? regularRankings[1].score : 54;

    return {
      dispersion: dispersion,
      highCount: highCount,
      lowCount: lowCount,
      contradiction: contradiction,
      gap: topRegular - secondRegular,
      topRegular: topRegular
    };
  }

  function scoreChaosArchetype(meta) {
    const strongConflict =
      meta.dispersion > 18 &&
      meta.highCount >= 2 &&
      meta.lowCount >= 2 &&
      meta.contradiction > 24 &&
      meta.gap < 7 &&
      meta.topRegular < 83;

    if (strongConflict) {
      return clamp(Math.round(64 + (meta.dispersion - 18) * 1.2 + (24 - meta.gap)), 60, 88);
    }

    return clamp(Math.round(22 + meta.dispersion * 0.45 + Math.min(meta.highCount, meta.lowCount) * 2), 14, 54);
  }

  function buildMatches(mainId, userScores) {
    return quizData.archetypes
      .filter(function (type) {
        return type.id !== mainId && type.id !== "chaos";
      })
      .map(function (type) {
        const score = scoreMatch(type.profile, userScores);
        return {
          id: type.id,
          name: type.name,
          emoji: type.emoji,
          score: score,
          reason: buildMatchReason(type, userScores, score)
        };
      })
      .sort(function (left, right) {
        return right.score - left.score;
      })
      .slice(0, 2);
  }

  function scoreMatch(profile, userScores) {
    const dominanceFit = 100 - Math.abs(userScores.dominance + profile.dominance - 100);
    const attachmentFit = 100 - Math.abs(userScores.attachment - profile.attachment);
    const boundaryFit = 100 - Math.abs(userScores.boundary - profile.boundary);
    const paceFit = 100 - Math.abs(userScores.pace - profile.pace);

    return clamp(
      Math.round(dominanceFit * 0.32 + attachmentFit * 0.28 + boundaryFit * 0.2 + paceFit * 0.2),
      38,
      96
    );
  }

  function buildMatchReason(type, userScores, score) {
    const dominanceFit = 100 - Math.abs(userScores.dominance + type.profile.dominance - 100);
    const attachmentFit = 100 - Math.abs(userScores.attachment - type.profile.attachment);
    const boundaryFit = 100 - Math.abs(userScores.boundary - type.profile.boundary);
    const paceFit = 100 - Math.abs(userScores.pace - type.profile.pace);

    const factors = [
      { label: "一方推进、一方接球，节奏不容易互相抢", value: dominanceFit },
      { label: "情感浓度接得上，不容易一热一冷", value: attachmentFit },
      { label: "对边界的理解接近，少很多误伤", value: boundaryFit },
      { label: "升温速度比较合拍，不必互相催或者互相等", value: paceFit }
    ].sort(function (left, right) {
      return right.value - left.value;
    });

    return "匹配度 " + score + "%。主要因为" + factors[0].label + "；同时" + factors[1].label + "。";
  }

  function buildSignalTags(scores) {
    return quizData.dimensions
      .map(function (dimension) {
        const score = scores[dimension.id];
        return {
          text: dimension.label + "偏" + (score >= 50 ? dimension.rightLabel : dimension.leftLabel),
          distance: Math.abs(score - 50)
        };
      })
      .sort(function (left, right) {
        return right.distance - left.distance;
      })
      .slice(0, 3)
      .map(function (item) {
        return item.text;
      });
  }

  function buildTopDimensionLabels(scores) {
    return quizData.dimensions
      .map(function (dimension) {
        const score = scores[dimension.id];
        return {
          text: dimension.label + "：" + (score >= 50 ? dimension.rightLabel : dimension.leftLabel),
          distance: Math.abs(score - 50)
        };
      })
      .sort(function (left, right) {
        return right.distance - left.distance;
      })
      .slice(0, 4)
      .map(function (item) {
        return item.text;
      });
  }

  function buildReportTone(main, scores) {
    const paceText = scores.pace > 58 ? "推进偏快" : "推进偏稳";
    const expressText = scores.expression > 50 ? "表达较直" : "表达较收";
    return main.id === "chaos"
      ? "内在信号切换明显，关系表现很看场景。"
      : paceText + "，" + expressText + "，风格辨识度较高。";
  }

  function buildShareTexts(main, signalTags) {
    return {
      casual: quizData.shareTemplates.casual
        .replace("{type}", main.name)
        .replace("{match}", String(main.score))
        .replace("{summary}", main.summary),
      provocative: quizData.shareTemplates.provocative
        .replace("{type}", main.name)
        .replace("{summary}", main.summary),
      neutral: quizData.shareTemplates.neutral
        .replace("{type}", main.name)
        .replace("{match}", String(main.score))
        .replace("{signal}", signalTags[0])
    };
  }

  function copyResultSummary() {
    if (!state.latestResult) {
      showToast("先完成测试，才能复制结果。");
      return;
    }

    const result = state.latestResult;
    const text = [
      "【关系风格评估结果】",
      result.main.name + " " + result.main.score + "%｜" + result.main.nickname,
      result.main.summary,
      "副类型：" + result.rankings.slice(1, 3).map(function (item) { return item.name + " " + item.score + "%"; }).join(" / "),
      "匹配类型：" + result.matches.map(function (item) { return item.name + " " + item.score + "%"; }).join(" / "),
      "高频信号：" + result.signalTags.join(" / "),
      "你吸引的人：" + result.main.attracts,
      "风险点：" + result.main.risk,
      "建议：" + result.main.advice
    ].join("\n");

    copyText(text).then(function (success) {
      if (success) {
        trackAnalytics("result_summary_copied", {
          mainType: result.main.id,
          mainName: result.main.name
        }, { immediate: true });
      }
      showToast(success ? "结果摘要已复制。" : "复制失败，请手动长按复制。");
    });
  }

  async function generateResultImage() {
    if (!state.latestResult) {
      showToast("先完成测试，才能生成结果图。");
      return;
    }

    showToast("正在生成 JPG 结果图…");

    try {
      exportPreviewUrl = await buildResultImage(state.latestResult);
      render();
      showToast("JPG 结果图已生成。");
      trackAnalytics("result_image_generated", {
        mainType: state.latestResult.main.id,
        mainName: state.latestResult.main.name
      });
    } catch (error) {
      showToast("结果图生成失败，请稍后再试。");
    }
  }

  async function buildResultImage(result) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1560;
    const ctx = canvas.getContext("2d");
    const qrImage = await loadShareQrImage();

    drawImageBackground(ctx, canvas.width, canvas.height);
    drawImageHeader(ctx, result);
    drawImageSummary(ctx, result);
    drawImageMetrics(ctx, result);
    drawImageMatches(ctx, result.matches);
    drawImageFooter(ctx, qrImage);

    return canvas.toDataURL("image/jpeg", 0.9);
  }

  function drawImageBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#f7f5ef");
    gradient.addColorStop(1, "#ece8df");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(104,114,104,0.06)";
    ctx.beginPath();
    ctx.arc(140, 130, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(138,119,100,0.08)";
    ctx.beginPath();
    ctx.arc(930, 250, 170, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawImageHeader(ctx, result) {
    fillRoundedRect(ctx, 56, 52, 968, 250, 32, "#fbf9f4", "rgba(44,49,46,0.08)");
    ctx.fillStyle = "#7a837f";
    ctx.font = "600 24px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("RELATION ASSESSMENT", 96, 104);

    ctx.fillStyle = "#1f2422";
    ctx.font = "700 72px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(result.main.emoji + " " + result.main.name, 96, 190);

    ctx.fillStyle = "#58605c";
    ctx.font = "500 32px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(result.main.nickname + " · " + result.main.score + "%", 98, 238);

    ctx.fillStyle = "#2a302d";
    ctx.font = "500 28px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    drawWrappedText(ctx, result.main.summary, 96, 282, 870, 40, 2);
  }

  function drawImageSummary(ctx, result) {
    fillRoundedRect(ctx, 56, 328, 968, 248, 28, "#faf8f3", "rgba(44,49,46,0.08)");
    ctx.fillStyle = "#58605c";
    ctx.font = "600 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("副类型", 92, 374);

    ctx.fillStyle = "#1f2422";
    ctx.font = "600 26px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(
      result.rankings.slice(1, 3).map(function (item) { return item.emoji + " " + item.name + " " + item.score + "%"; }).join(" / "),
      92,
      418
    );

    ctx.fillStyle = "#58605c";
    ctx.font = "600 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("简化维度", 92, 470);

    ctx.fillStyle = "#1f2422";
    ctx.font = "500 24px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    drawWrappedText(ctx, result.topDimensions.join(" / "), 92, 510, 860, 34, 2);
  }

  function drawImageMetrics(ctx, result) {
    fillRoundedRect(ctx, 56, 604, 968, 364, 28, "#faf8f3", "rgba(44,49,46,0.08)");
    ctx.fillStyle = "#58605c";
    ctx.font = "600 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("高频信号", 92, 648);

    result.signalTags.forEach(function (tag, index) {
      fillRoundedRect(ctx, 92, 674 + index * 64, 420, 42, 18, "#f2eee7", "rgba(44,49,46,0.06)");
      ctx.fillStyle = "#1f2422";
      ctx.font = "500 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillText(tag, 108, 702 + index * 64);
    });

    ctx.fillStyle = "#58605c";
    ctx.font = "600 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("结果特征", 560, 648);

    ctx.fillStyle = "#1f2422";
    ctx.font = "500 24px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    drawWrappedText(ctx, result.reportTone, 560, 690, 392, 34, 2);

    ctx.fillStyle = "#58605c";
    ctx.font = "600 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("一句建议", 560, 790);

    ctx.fillStyle = "#1f2422";
    ctx.font = "500 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    drawWrappedText(ctx, truncateText(result.main.advice, 54), 560, 828, 392, 32, 3);
  }

  function drawImageMatches(ctx, matches) {
    fillRoundedRect(ctx, 56, 996, 968, 268, 28, "#faf8f3", "rgba(44,49,46,0.08)");
    ctx.fillStyle = "#58605c";
    ctx.font = "600 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("最匹配类型", 92, 1042);

    matches.forEach(function (item, index) {
      const x = 92 + index * 450;
      fillRoundedRect(ctx, x, 1070, 398, 150, 20, "#f2eee7", "rgba(44,49,46,0.06)");
      ctx.fillStyle = "#1f2422";
      ctx.font = "600 28px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillText(item.emoji + " " + item.name + " · " + item.score + "%", x + 18, 1116);
      ctx.fillStyle = "#58605c";
      ctx.font = "500 20px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
      drawWrappedText(ctx, truncateText(item.reason, 54), x + 18, 1150, 362, 28, 3);
    });
  }

  function drawImageFooter(ctx, qrImage) {
    fillRoundedRect(ctx, 56, 1296, 968, 208, 28, "#faf8f3", "rgba(44,49,46,0.08)");

    ctx.fillStyle = "#58605c";
    ctx.font = "600 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("扫码继续测试", 92, 1344);

    ctx.fillStyle = "#1f2422";
    ctx.font = "600 34px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("把这张图发出去，别人扫一下就能直接进入测试。", 92, 1394);

    ctx.fillStyle = "#58605c";
    ctx.font = "500 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    drawWrappedText(ctx, "测试地址：" + sanitizeShareUrl(quizData.shareConfig.testUrl), 92, 1436, 600, 30, 2);

    fillRoundedRect(ctx, 810, 1332, 154, 154, 22, "#ffffff", "rgba(44,49,46,0.08)");

    if (qrImage) {
      ctx.drawImage(qrImage, 824, 1346, 126, 126);
    } else {
      ctx.strokeStyle = "rgba(44,49,46,0.18)";
      ctx.lineWidth = 2;
      ctx.strokeRect(838, 1360, 98, 98);
      ctx.fillStyle = "#7a837f";
      ctx.font = "500 18px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillText("扫码测试", 842, 1494);
    }

    ctx.fillStyle = "#7a837f";
    ctx.font = "500 18px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("移动端分享图 · JPG", 92, 1482);
  }

  function fillRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle) {
    ctx.beginPath();
    roundedRectPath(ctx, x, y, width, height, radius);
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.fill();
    }
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  function roundedRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) {
    const lines = [];
    let current = "";

    String(text).split("").forEach(function (char) {
      const next = current + char;
      if (ctx.measureText(next).width > maxWidth && current) {
        lines.push(current);
        current = char;
      } else {
        current = next;
      }
    });

    if (current) {
      lines.push(current);
    }

    const visible = typeof maxLines === "number" ? lines.slice(0, maxLines) : lines;
    visible.forEach(function (line, index) {
      const clipped = typeof maxLines === "number" && lines.length > maxLines && index === visible.length - 1;
      ctx.fillText(clipped ? line.slice(0, Math.max(line.length - 1, 0)) + "…" : line, x, y + index * lineHeight);
    });
  }

  function truncateText(text, maxLength) {
    const source = String(text || "");
    return source.length <= maxLength ? source : source.slice(0, maxLength - 1) + "…";
  }

  function sanitizeShareUrl(url) {
    return String(url || "").replace(/^https?:\/\//, "").replace(/\/$/, "");
  }

  async function loadShareQrImage() {
    const testUrl = quizData.shareConfig && quizData.shareConfig.testUrl;
    if (!testUrl) {
      return null;
    }

    const qrApi = (quizData.shareConfig && quizData.shareConfig.qrApi) || "https://api.qrserver.com/v1/create-qr-code/";
    const qrUrl = qrApi + "?size=240x240&margin=0&data=" + encodeURIComponent(testUrl);

    try {
      const response = await fetch(qrUrl, {
        method: "GET",
        mode: "cors",
        cache: "force-cache"
      });

      if (!response.ok) {
        return null;
      }

      const blob = await response.blob();
      return await loadImageFromBlob(blob);
    } catch (error) {
      return null;
    }
  }

  function loadImageFromBlob(blob) {
    return new Promise(function (resolve, reject) {
      const objectUrl = URL.createObjectURL(blob);
      const image = new Image();

      image.onload = function () {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = function () {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("QR image failed to load."));
      };

      image.src = objectUrl;
    });
  }

  function downloadResultImage() {
    if (!exportPreviewUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = exportPreviewUrl;
    link.download = quizData.shareConfig.exportFileName || "relationship-profile.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    trackAnalytics("result_image_downloaded", {
      mainType: state.latestResult ? state.latestResult.main.id : ""
    }, { immediate: true });
  }

  function closeResultImage() {
    exportPreviewUrl = "";
    render();
  }

  function initAnalytics() {
    if (!analyticsEnabled()) {
      return;
    }

    if (!analyticsFlags.sessionStarted) {
      analyticsFlags.sessionStarted = true;
      persistAnalyticsFlags();
      trackAnalytics("session_started", {
        entryPhase: state.phase,
        language: navigator.language || "",
        referrer: document.referrer || "",
        screen: window.screen ? window.screen.width + "x" + window.screen.height : ""
      }, { immediate: true });
    }

    flushAnalyticsQueue();
  }

  function handleVisibilityChange() {
    if (document.visibilityState === "hidden") {
      flushAnalyticsQueue({ useBeacon: true });
    }
  }

  function maybeTrackPhaseView() {
    if (!analyticsEnabled()) {
      return;
    }

    const viewKey = state.phase === "quiz"
      ? "quiz:" + state.currentIndex
      : state.phase;

    if (viewKey === lastTrackedViewKey) {
      return;
    }

    lastTrackedViewKey = viewKey;

    trackAnalytics("page_view", {
      phase: state.phase,
      questionNumber: state.phase === "quiz" ? state.currentIndex + 1 : null,
      answeredCount: getAnsweredCount(state.answers),
      hasResult: Boolean(state.latestResult)
    });
  }

  function analyticsEnabled() {
    return Boolean(analyticsConfig && analyticsConfig.enabled && analyticsConfig.collectEndpoint);
  }

  function shouldExposeDashboard() {
    return Boolean(analyticsConfig && analyticsConfig.dashboardUrl && isAdminView());
  }

  function isAdminView() {
    const flag = analyticsConfig.adminQuery || "admin=1";
    return window.location.search.indexOf(flag) !== -1 || debugMode.enabled;
  }

  function hydrateAnalyticsQueue() {
    if (!analyticsEnabled()) {
      return [];
    }

    try {
      const parsed = JSON.parse(localStorage.getItem(ANALYTICS_QUEUE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function persistAnalyticsQueue() {
    if (!analyticsEnabled()) {
      localStorage.removeItem(ANALYTICS_QUEUE_KEY);
      return;
    }

    localStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(analyticsQueue.slice(-120)));
  }

  function hydrateAnalyticsFlags() {
    const store = getSessionStore();
    try {
      return JSON.parse(store.getItem(DEBUG_KEY + "-analytics-flags") || "{}");
    } catch (error) {
      return {};
    }
  }

  function persistAnalyticsFlags() {
    const store = getSessionStore();
    store.setItem(DEBUG_KEY + "-analytics-flags", JSON.stringify(analyticsFlags));
  }

  function getSessionStore() {
    try {
      return window.sessionStorage;
    } catch (error) {
      return localStorage;
    }
  }

  function getOrCreateSessionId() {
    const store = getSessionStore();
    const existing = store.getItem(STORAGE_KEY + "-session-id");
    if (existing) {
      return existing;
    }

    const created = "sess_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36);
    store.setItem(STORAGE_KEY + "-session-id", created);
    return created;
  }

  function trackAnalytics(eventName, payload, options) {
    if (!analyticsEnabled()) {
      return;
    }

    analyticsQueue.push(buildAnalyticsEnvelope(eventName, payload || {}));
    persistAnalyticsQueue();

    if (options && options.immediate) {
      flushAnalyticsQueue();
      return;
    }

    window.clearTimeout(analyticsFlushTimer);
    analyticsFlushTimer = window.setTimeout(function () {
      flushAnalyticsQueue();
    }, 900);
  }

  function flushAnalyticsQueue(options) {
    if (!analyticsEnabled() || !analyticsQueue.length) {
      return Promise.resolve(false);
    }

    const batch = analyticsQueue.slice(0, 20);
    return sendAnalyticsBatch(batch, options).then(function (sent) {
      if (!sent) {
        return false;
      }

      analyticsQueue.splice(0, batch.length);
      persistAnalyticsQueue();

      if (analyticsQueue.length) {
        return flushAnalyticsQueue();
      }

      return true;
    });
  }

  function sendAnalyticsBatch(batch, options) {
    const endpoint = analyticsConfig.collectEndpoint;
    const transport = analyticsConfig.transport || "json";
    const payload = JSON.stringify({
      siteId: analyticsConfig.siteId || "xpti-test",
      events: batch
    });

    if (options && options.useBeacon && navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], {
          type: transport === "apps-script" ? "text/plain;charset=utf-8" : "application/json"
        });
        return Promise.resolve(navigator.sendBeacon(endpoint, blob));
      } catch (error) {
        return Promise.resolve(false);
      }
    }

    if (transport === "apps-script") {
      return fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: payload,
        keepalive: true,
        mode: "no-cors"
      }).then(function () {
        return true;
      }).catch(function () {
        return false;
      });
    }

    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
      mode: "cors"
    }).then(function (response) {
      return response.ok;
    }).catch(function () {
      return false;
    });
  }

  function buildAnalyticsEnvelope(eventName, payload) {
    return {
      id: "evt_" + Math.random().toString(36).slice(2, 10) + "_" + Date.now().toString(36),
      event: eventName,
      timestamp: new Date().toISOString(),
      sessionId: sessionId,
      page: state.phase,
      url: window.location.href,
      payload: payload
    };
  }

  function buildCompletionPayload(result) {
    return {
      mainType: result.main.id,
      mainName: result.main.name,
      mainScore: result.main.score,
      topThree: result.rankings.slice(0, 3).map(function (item) {
        return {
          id: item.id,
          name: item.name,
          score: item.score
        };
      }),
      dimensions: result.dimensionScores,
      matches: result.matches.map(function (item) {
        return {
          id: item.id,
          name: item.name,
          score: item.score
        };
      }),
      answeredCount: getAnsweredCount(state.answers),
      answers: state.answers.slice()
    };
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () { return true; },
        function () { return fallbackCopy(text); }
      );
    }

    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "readonly");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();

    let success = false;
    try {
      success = document.execCommand("copy");
    } catch (error) {
      success = false;
    }

    document.body.removeChild(textarea);
    return success;
  }

  function clearAllData() {
    const hasData = getAnsweredCount(state.answers) > 0 || state.latestResult;
    if (!hasData) {
      return;
    }

    if (!window.confirm("这会清空当前进度和结果缓存，确定继续吗？")) {
      return;
    }

    const hadResult = Boolean(state.latestResult);
    state = {
      phase: "home",
      currentIndex: 0,
      answers: createEmptyAnswers(),
      latestResult: null
    };
    exportPreviewUrl = "";
    localStorage.removeItem(STORAGE_KEY);
    render();
    showToast("记录已清空。");
    trackAnalytics("local_progress_cleared", {
      hadResult: hadResult
    }, { immediate: true });
  }

  function printDebugScores(result) {
    console.group("Relationship Profile Debug");
    console.table(result.rawTotals);
    console.table(result.dimensionScores);
    console.table(result.rankings.map(function (item) {
      return { archetype: item.name, score: item.score };
    }));
    console.table(result.matches);
    console.groupEnd();
  }

  function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");

    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }

  function scrollToTop() {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      window.scrollTo(0, 0);
    }
  }

  function average(values) {
    if (!values.length) {
      return 0;
    }

    return values.reduce(function (sum, value) {
      return sum + value;
    }, 0) / values.length;
  }

  function standardDeviation(values) {
    if (!values.length) {
      return 0;
    }

    const mean = average(values);
    return Math.sqrt(
      average(values.map(function (value) {
        return Math.pow(value - mean, 2);
      }))
    );
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();
