(function () {
  // This controller renders the app, manages localStorage, and recalculates scores from answers.
  const quizData = window.QUIZ_DATA;
  const app = document.getElementById("app");
  const clearDataTopButton = document.getElementById("clear-data-top");
  const debugToggleButton = document.getElementById("debug-toggle");

  const STORAGE_KEY = "relationship-profile-state-v2";
  const DEBUG_KEY = "relationship-profile-debug-v2";
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
  let posterPreviewUrl = "";
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
      } else {
        console.info("No result yet.");
      }
    },
    state: function () {
      return JSON.parse(JSON.stringify(state));
    }
  };

  bindEvents();
  render();

  function bindEvents() {
    document.addEventListener("click", handleDocumentClick);
    debugToggleButton.addEventListener("click", handleDebugToggleTap);
    clearDataTopButton.addEventListener("click", clearAllData);
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
      case "generate-poster":
        generatePoster();
        break;
      case "close-poster":
        closePosterPreview();
        break;
      case "download-poster":
        downloadPosterPreview();
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
    const latestResult = isResultLike(parsed.latestResult) ? parsed.latestResult : null;

    return {
      phase: ["home", "quiz", "result"].includes(parsed.phase) ? parsed.phase : "home",
      currentIndex: clamp(
        Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : findResumeIndex(answers),
        0,
        TOTAL_QUESTIONS - 1
      ),
      answers: answers,
      latestResult: answeredCount === TOTAL_QUESTIONS ? calculateResult(answers) : latestResult
    };
  }

  function sanitizeAnswers(input) {
    const fallback = createEmptyAnswers();

    if (!Array.isArray(input)) {
      return fallback;
    }

    return fallback.map(function (_, index) {
      return input[index] === 0 || input[index] === 1 ? input[index] : null;
    });
  }

  function isResultLike(value) {
    return Boolean(
      value &&
      typeof value === "object" &&
      value.main &&
      value.dimensionScores &&
      Array.isArray(value.rankings)
    );
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
      return answer === 0 || answer === 1;
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

    return [
      '<section class="panel">',
      '  <div class="panel-inner">',
      '    <p class="eyebrow">RELATION ASSESSMENT</p>',
      '    <h1 class="hero-title">不是恋爱脑测试，<br>是你在关系里如何靠近、控场、要确认。</h1>',
      '    <p class="hero-subtitle">36 道情境题，从推进方式、边界感、安全来源到表达习惯，拆出你在成年人关系里的真实风格。它不会只给你一个可爱标签，而是给你一份更像报告的画像。</p>',
      '    <div class="pill-row">',
      '      <span class="pill">36 道情境题</span>',
      '      <span class="pill">8 个关系维度</span>',
      '      <span class="pill">7 类原型</span>',
      '    </div>',
      '    <div class="disclaimer">仅供娱乐与自我观察，内容基于成年人自愿关系中的互动偏好，不涉及露骨表达，也不代表任何医学或心理诊断。</div>',
      hasPartialProgress
        ? '    <section class="status-card"><h2 class="fact-title">你上次停在一半</h2><p class="muted-text">已经完成 ' +
          answeredCount +
          "/" +
          TOTAL_QUESTIONS +
          ' 题。进度已经保存在本地，继续即可。</p></section>'
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
      '      <article class="overview-card"><h2 class="fact-title">这次升级了什么</h2><p class="muted-text">问题不再是“你更主动还是更被动”这种一眼看穿的题，而是从你在具体情境里的默认反应，判断真正的关系结构。</p></article>',
      '      <article class="overview-card"><h2 class="fact-title">它会看哪些东西</h2><p class="muted-text">不仅看靠近或抽离，还会看你怎么推进、怎么收边界、怎么表达、怎么要安全感，以及你更依赖秩序还是刺激。</p></article>',
      "    </div>",
      '    <div class="home-facts">',
      '      <article class="fact-card"><h2 class="fact-title">结果会给出</h2><p class="muted-text">主型匹配度、次级原型、8 条维度分布，以及“你吸引的人”“你的风险点”“给你的建议”。</p></article>',
      '      <article class="fact-card"><h2 class="fact-title">更像什么体验</h2><p class="muted-text">它应该像一份安静但很准的关系侧写，而不是粉色恋爱小游戏。发给朋友看，也不会显得过分轻飘。</p></article>',
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
      '    <p class="progress-caption">选择更接近你默认反应的一项。你可以返回修改，分数会自动重算。</p>',
      '    <h1 class="question-title">' + question.text + "</h1>",
      '    <p class="question-guidance">没有标准答案，也没有“更成熟”的选项。真正有用的，是你在细节里会下意识怎么做。</p>',
      '    <div class="option-list">',
      question.options
        .map(function (option, optionIndex) {
          const selected = currentAnswer === optionIndex;
          return [
            '<button class="option-button' + (selected ? " is-selected" : "") + '" type="button" data-option-index="' + optionIndex + '" aria-pressed="' + String(selected) + '">',
            '  <div class="option-top"><span class="option-mark">' + (optionIndex === 0 ? "A" : "B") + "</span></div>",
            '  <p class="option-copy">' + option.text + "</p>",
            "</button>"
          ].join("");
        })
        .join(""),
      "    </div>",
      '    <div class="question-footer">',
      '      <span class="support-text">' + (currentAnswer === null ? "先选一个最像你的答案。" : "刷新页面也会保留当前进度。") + "</span>",
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

    const shareCards = result.shareSamples
      .map(function (text, index) {
        return [
          '<article class="share-card">',
          '  <h3 class="share-title">分享文案 ' + (index + 1) + "</h3>",
          '  <p class="share-text">' + text + "</p>",
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
      '        <article class="summary-card"><span class="summary-label">你的高频信号</span><strong class="summary-value">' + result.signalTags.join(" / ") + "</strong></article>",
      '        <article class="summary-card"><span class="summary-label">次级原型</span><strong class="summary-value">' + secondary.map(function (item) { return item.name; }).join(" / ") + "</strong></article>",
      '        <article class="summary-card"><span class="summary-label">结果特征</span><strong class="summary-value">' + result.reportTone + "</strong></article>",
      "      </div>",
      '      <div class="report-tags">' + result.topDimensions.map(function (tag) { return '<span class="report-tag">' + tag + "</span>"; }).join("") + "</div>",
      "    </div>",
      '    <div class="section-block">',
      '      <h2 class="section-title">详细解析</h2>',
      '      <div class="report-card"><p class="muted-text">' + result.main.interpretation + "</p></div>",
      "    </div>",
      '    <div class="section-block">',
      '      <h2 class="section-title">八维分布</h2>',
      '      <div class="dimension-grid">' + dimensionCards + "</div>",
      "    </div>",
      '    <div class="section-block">',
      '      <h2 class="section-title">你的次级原型</h2>',
      '      <div class="secondary-grid">' + secondaryCards + "</div>",
      "    </div>",
      '    <div class="section-block">',
      '      <h2 class="section-title">关系侧写</h2>',
      '      <div class="report-grid">',
      '        <article class="detail-card"><h3 class="detail-title">你吸引的人</h3><p class="detail-copy">' + result.main.attracts + "</p></article>",
      '        <article class="detail-card"><h3 class="detail-title">你的关系风险点</h3><p class="detail-copy">' + result.main.risk + "</p></article>",
      "      </div>",
      '      <div class="section-block">',
      '        <article class="detail-card"><h3 class="detail-title">给你的建议</h3><p class="detail-copy">' + result.main.advice + "</p></article>",
      "      </div>",
      "    </div>",
      '    <div class="section-block">',
      '      <h2 class="section-title">可直接分享的文案</h2>',
      '      <div class="share-grid">' + shareCards + "</div>",
      "    </div>",
      '    <div class="result-actions">',
      '      <button class="primary-button" type="button" data-action="generate-poster">生成分享海报</button>',
      '      <button class="secondary-button" type="button" data-action="copy-result">复制结果摘要</button>',
      '      <button class="secondary-button" type="button" data-action="restart">重新测一遍</button>',
      '      <button class="tertiary-button" type="button" data-action="go-home">返回首页</button>',
      '      <button class="tertiary-button" type="button" data-action="clear-all">清空记录</button>',
      "    </div>",
      '    <p class="tiny-note">海报内会自动带上测试二维码。若你还没有部署站点，请先把 <code>data.js</code> 里的 <code>shareConfig.testUrl</code> 换成正式地址。</p>',
      "  </div>",
      "</section>",
      renderPosterModal()
    ].join("");
  }

  function renderPosterModal() {
    if (!posterPreviewUrl) {
      return "";
    }

    return [
      '<section class="poster-modal" role="dialog" aria-modal="true" aria-label="分享海报预览">',
      '  <div class="poster-backdrop" data-action="close-poster"></div>',
      '  <div class="poster-sheet">',
      '    <div class="poster-sheet__header">',
      '      <div><p class="eyebrow">POSTER PREVIEW</p><p class="poster-note">长按图片或直接下载，即可转发给朋友。</p></div>',
      '      <button class="inline-link" type="button" data-action="close-poster">关闭</button>',
      "    </div>",
      '    <div class="poster-sheet__body">',
      '      <img class="poster-image" src="' + posterPreviewUrl + '" alt="关系风格评估分享海报">',
      "    </div>",
      '    <div class="poster-toolbar">',
      '      <button class="primary-button" type="button" data-action="download-poster">下载海报</button>',
      '      <button class="secondary-button" type="button" data-action="close-poster">返回结果页</button>',
      "    </div>",
      "  </div>",
      "</section>"
    ].join("");
  }

  function beginQuiz(options) {
    const existingAnswers = sanitizeAnswers(state.answers);
    const hasProgress = getAnsweredCount(existingAnswers) > 0;

    state.phase = "quiz";

    if (!options.keepResult) {
      state.latestResult = null;
    }

    if (options.resume && hasProgress) {
      state.answers = existingAnswers;
      state.currentIndex = findResumeIndex(existingAnswers);
    } else {
      state.answers = createEmptyAnswers();
      state.currentIndex = 0;
    }

    persistState();
    render();
  }

  function showLatestResult() {
    if (!state.latestResult) {
      showToast("还没有可查看的结果。");
      return;
    }

    state.phase = "result";
    persistState();
    render();
  }

  function selectAnswer(optionIndex) {
    state.answers[state.currentIndex] = optionIndex;
    persistState();
    render();
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
    state.phase = "quiz";
    persistState();
    render();
  }

  function finishQuiz() {
    const firstMissing = state.answers.findIndex(function (answer) {
      return answer === null;
    });

    if (firstMissing !== -1) {
      state.currentIndex = firstMissing;
      state.phase = "quiz";
      persistState();
      render();
      showToast("还有题目没完成，已经帮你跳过去了。");
      return;
    }

    state.latestResult = calculateResult(state.answers);
    state.phase = "result";
    persistState();
    render();
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
    const secondary = rankings.slice(1, 3);
    const signalTags = buildSignalTags(dimensionScores);
    const topDimensions = buildTopDimensionLabels(dimensionScores);
    const reportTone = buildReportTone(main, dimensionScores);
    const shareSamples = buildShareSamples(main, secondary, dimensionScores, signalTags);

    return {
      createdAt: new Date().toISOString(),
      rawTotals: rawTotals,
      dimensionScores: dimensionScores,
      rankings: rankings,
      main: main,
      signalTags: signalTags,
      topDimensions: topDimensions,
      reportTone: reportTone,
      shareSamples: shareSamples,
      chaosMeta: chaosMeta
    };
  }

  function normalizeDimension(value, bound) {
    if (!bound) {
      return 50;
    }

    return clamp(Math.round(((value + bound) / (2 * bound)) * 100), 0, 100);
  }

  function scoreRegularArchetype(archetype, dimensionScores) {
    let totalWeight = 0;
    let weightedDistance = 0;

    DIMENSION_IDS.forEach(function (dimensionId) {
      const weight = Number(archetype.weights[dimensionId] || 1);
      totalWeight += weight;
      weightedDistance += Math.abs(dimensionScores[dimensionId] - archetype.profile[dimensionId]) * weight;
    });

    const averageDistance = weightedDistance / totalWeight;
    const baseScore = 100 - averageDistance * 1.08;
    const ruleBonus = scoreArchetypeBonus(archetype.id, dimensionScores);

    return clamp(Math.round(baseScore + ruleBonus), 20, 97);
  }

  function scoreArchetypeBonus(archetypeId, scores) {
    switch (archetypeId) {
      case "dog":
        return (
          (scores.attachment > 72 ? 8 : 0) +
          (scores.security > 66 ? 8 : 0) +
          (scores.dominance < 44 ? 6 : 0) +
          (scores.expression > 54 ? 4 : 0) +
          (scores.control < 52 ? 3 : 0) -
          (scores.novelty > 72 ? 4 : 0)
        );
      case "hunter":
        return (
          (scores.dominance > 72 ? 8 : 0) +
          (scores.control > 72 ? 8 : 0) +
          (scores.pace > 66 ? 6 : 0) +
          (scores.expression > 56 ? 4 : 0) +
          (scores.security < 46 ? 3 : 0) -
          (scores.attachment > 76 ? 4 : 0)
        );
      case "cat":
        return (
          (scores.attachment < 38 ? 8 : 0) +
          (scores.security < 40 ? 7 : 0) +
          (scores.expression < 42 ? 7 : 0) +
          (scores.control > 54 ? 4 : 0) +
          (scores.pace < 54 ? 3 : 0) -
          (scores.boundary > 72 ? 4 : 0)
        );
      case "explorer":
        return (
          (scores.novelty > 74 ? 10 : 0) +
          (scores.boundary < 42 ? 6 : 0) +
          (scores.pace > 60 ? 5 : 0) +
          (scores.expression > 50 ? 3 : 0) +
          (scores.control < 60 ? 2 : 0) -
          (scores.attachment > 78 ? 4 : 0)
        );
      case "observer":
        return (
          (scores.attachment < 34 ? 9 : 0) +
          (scores.expression < 38 ? 9 : 0) +
          (scores.pace < 42 ? 6 : 0) +
          (scores.control > 56 ? 4 : 0) +
          (scores.security < 50 ? 3 : 0) -
          (scores.novelty > 70 ? 4 : 0)
        );
      case "binding":
        return (
          (scores.attachment > 76 ? 10 : 0) +
          (scores.boundary > 74 ? 9 : 0) +
          (scores.security > 68 ? 7 : 0) +
          (scores.control > 54 ? 3 : 0) +
          (scores.novelty < 44 ? 4 : 0)
        );
      default:
        return 0;
    }
  }

  function measureChaos(dimensionScores, regularRankings) {
    const values = DIMENSION_IDS.map(function (dimensionId) {
      return dimensionScores[dimensionId];
    });
    const highCount = values.filter(function (value) {
      return value >= 70;
    }).length;
    const lowCount = values.filter(function (value) {
      return value <= 30;
    }).length;
    const dispersion = standardDeviation(values);
    const contradiction =
      (
        Math.abs(dimensionScores.dominance - dimensionScores.expression) +
        Math.abs(dimensionScores.attachment - dimensionScores.security) +
        Math.abs(dimensionScores.novelty - dimensionScores.boundary) +
        Math.abs(dimensionScores.control - dimensionScores.pace)
      ) / 4;
    const topRegular = regularRankings[0] ? regularRankings[0].score : 60;
    const secondRegular = regularRankings[1] ? regularRankings[1].score : topRegular - 8;
    const gap = topRegular - secondRegular;

    return {
      dispersion: Number(dispersion.toFixed(2)),
      contradiction: Number(contradiction.toFixed(2)),
      highCount: highCount,
      lowCount: lowCount,
      mixedPolarity: Math.min(highCount, lowCount),
      topRegular: topRegular,
      gap: gap
    };
  }

  function scoreChaosArchetype(meta) {
    const trigger =
      meta.dispersion > 18 &&
      meta.mixedPolarity >= 3 &&
      meta.contradiction > 22 &&
      meta.topRegular < 82 &&
      meta.gap < 7;

    if (trigger) {
      return clamp(
        Math.round(
          62 +
          (meta.dispersion - 18) * 0.9 +
          meta.mixedPolarity * 3 +
          (22 - meta.gap)
        ),
        60,
        88
      );
    }

    return clamp(
      Math.round(
        28 +
        meta.dispersion * 0.32 +
        meta.mixedPolarity * 2 -
        Math.max(0, meta.topRegular - 72) * 0.6
      ),
      18,
      58
    );
  }

  function buildSignalTags(dimensionScores) {
    const ranked = quizData.dimensions
      .map(function (dimension) {
        const score = dimensionScores[dimension.id];
        const direction = score >= 50 ? dimension.rightLabel : dimension.leftLabel;
        return {
          text: dimension.label + "偏" + direction,
          distance: Math.abs(score - 50)
        };
      })
      .sort(function (left, right) {
        return right.distance - left.distance;
      });

    return ranked.slice(0, 3).map(function (item) {
      return item.text;
    });
  }

  function buildTopDimensionLabels(dimensionScores) {
    return quizData.dimensions
      .map(function (dimension) {
        const score = dimensionScores[dimension.id];
        const direction = score >= 50 ? dimension.rightLabel : dimension.leftLabel;
        return {
          label: dimension.label + "：" + direction,
          distance: Math.abs(score - 50)
        };
      })
      .sort(function (left, right) {
        return right.distance - left.distance;
      })
      .slice(0, 4)
      .map(function (item) {
        return item.label;
      });
  }

  function buildReportTone(main, dimensionScores) {
    if (main.id === "chaos") {
      return "你的内在需求切换速度比多数人更快。";
    }

    const fast = dimensionScores.pace > 60 ? "推进偏快" : "推进偏稳";
    const expression = dimensionScores.expression > 50 ? "表达更直" : "表达更收";
    return fast + "，" + expression + "，整体风格较为成形。";
  }

  function buildShareSamples(main, secondary, dimensionScores, signalTags) {
    const replacements = {
      "{type}": main.name,
      "{match}": String(main.score),
      "{summary}": main.summary,
      "{secondary}": secondary.map(function (item) {
        return item.name + " " + item.score + "%";
      }).join(" / "),
      "{dimensionHighlight}": signalTags[0] || buildSignalTags(dimensionScores)[0]
    };

    return quizData.shareTemplates.map(function (template) {
      return Object.keys(replacements).reduce(function (text, token) {
        return text.split(token).join(replacements[token]);
      }, template);
    });
  }

  function copyResultSummary() {
    if (!state.latestResult) {
      showToast("先完成测试，才能复制结果。");
      return;
    }

    const result = state.latestResult;
    const secondary = result.rankings
      .slice(1, 3)
      .map(function (item) {
        return item.name + " " + item.score + "%";
      })
      .join(" / ");

    const dimensionSummary = quizData.dimensions
      .map(function (dimension) {
        return dimension.label + " " + result.dimensionScores[dimension.id] + "%";
      })
      .join("｜");

    const text = [
      "【我的关系风格评估】",
      result.main.name + " " + result.main.score + "%｜" + result.main.nickname,
      result.main.summary,
      "高频信号：" + result.signalTags.join(" / "),
      "次级原型：" + secondary,
      "八维分布：" + dimensionSummary,
      "你吸引的人：" + result.main.attracts,
      "你的风险点：" + result.main.risk,
      "给你的建议：" + result.main.advice,
      "可分享文案：" + result.shareSamples[0]
    ].join("\n");

    copyText(text).then(function (success) {
      showToast(success ? "结果摘要已复制。" : "复制失败，请手动长按复制。");
    });
  }

  function generatePoster() {
    if (!state.latestResult) {
      showToast("先完成测试，才能生成海报。");
      return;
    }

    const shareUrl = getShareTestUrl();
    if (!shareUrl) {
      showToast("缺少可分享的测试地址。");
      return;
    }

    if (window.location.protocol === "file:" && isPlaceholderShareUrl(shareUrl)) {
      showToast("请先把 data.js 里的 shareConfig.testUrl 改成你的线上地址。");
    } else {
      showToast("正在生成海报…");
    }

    fetchQrDataUrl(shareUrl)
      .then(function (qrDataUrl) {
        return loadImage(qrDataUrl).then(function (qrImage) {
          const posterUrl = buildPosterDataUrl(state.latestResult, qrImage, shareUrl);
          posterPreviewUrl = posterUrl;
          render();
          showToast("海报已生成。");
        });
      })
      .catch(function (error) {
        console.error(error);
        showToast("海报生成失败，请稍后再试。");
      });
  }

  function getShareTestUrl() {
    if (/^https?:$/i.test(window.location.protocol)) {
      return window.location.origin + window.location.pathname;
    }

    if (quizData.shareConfig && quizData.shareConfig.testUrl) {
      return quizData.shareConfig.testUrl;
    }

    return "";
  }

  function isPlaceholderShareUrl(url) {
    return /your-domain\.com/i.test(url);
  }

  function fetchQrDataUrl(shareUrl) {
    const qrApi = (quizData.shareConfig && quizData.shareConfig.qrApi) || "https://quickchart.io/qr";
    const qrUrl =
      qrApi +
      "?size=260&margin=1&ecLevel=M&format=png&text=" +
      encodeURIComponent(shareUrl);

    return fetch(qrUrl, {
      mode: "cors",
      cache: "no-store"
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("QR request failed.");
        }

        return response.blob();
      })
      .then(blobToDataUrl);
  }

  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function loadImage(source) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () {
        resolve(image);
      };
      image.onerror = reject;
      image.src = source;
    });
  }

  function buildPosterDataUrl(result, qrImage, shareUrl) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1760;

    const ctx = canvas.getContext("2d");

    drawPosterBackground(ctx, canvas.width, canvas.height);
    drawPosterHeader(ctx, result);
    drawPosterSummary(ctx, result);
    drawPosterDimensions(ctx, result.dimensionScores);
    drawPosterSecondary(ctx, result.rankings.slice(1, 3));
    drawPosterInsights(ctx, result);
    drawPosterQrCard(ctx, qrImage, shareUrl);

    return canvas.toDataURL("image/png");
  }

  function drawPosterBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#f7f5ef");
    gradient.addColorStop(1, "#efebe2");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(104,114,104,0.05)";
    ctx.beginPath();
    ctx.arc(120, 140, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(138,119,100,0.07)";
    ctx.beginPath();
    ctx.arc(920, 260, 160, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawPosterHeader(ctx, result) {
    fillRoundedRect(ctx, 60, 56, 960, 286, 34, "#fbf9f4", "rgba(44,49,46,0.08)");

    ctx.fillStyle = "#7a837f";
    ctx.font = "600 26px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("RELATION PROFILE", 102, 116);

    ctx.fillStyle = "#1f2422";
    ctx.font = "700 72px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(result.main.emoji + " " + result.main.name, 100, 206);

    ctx.fillStyle = "#58605c";
    ctx.font = "500 34px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(result.main.nickname + " · 匹配度 " + result.main.score + "%", 102, 258);

    ctx.fillStyle = "#2a302d";
    ctx.font = "500 31px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    drawWrappedText(ctx, result.main.summary, 102, 306, 860, 45, 2);
  }

  function drawPosterSummary(ctx, result) {
    fillRoundedRect(ctx, 60, 372, 960, 252, 28, "#faf8f3", "rgba(44,49,46,0.08)");

    ctx.fillStyle = "#58605c";
    ctx.font = "600 24px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("核心侧写", 96, 422);

    ctx.fillStyle = "#1f2422";
    ctx.font = "500 28px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    drawWrappedText(ctx, truncateText(result.main.interpretation, 116), 96, 470, 888, 42, 4);
  }

  function drawPosterDimensions(ctx, dimensionScores) {
    fillRoundedRect(ctx, 60, 652, 960, 418, 28, "#faf8f3", "rgba(44,49,46,0.08)");

    ctx.fillStyle = "#58605c";
    ctx.font = "600 24px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("八维分布", 96, 700);

    quizData.dimensions.forEach(function (dimension, index) {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = 96 + column * 446;
      const y = 736 + row * 84;
      drawPosterMeter(ctx, x, y, 360, dimension, dimensionScores[dimension.id]);
    });
  }

  function drawPosterMeter(ctx, x, y, width, dimension, value) {
    ctx.fillStyle = "#1f2422";
    ctx.font = "600 24px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(dimension.label, x, y);

    ctx.fillStyle = "#58605c";
    ctx.font = "500 20px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(value + "%", x + width - 10, y);

    fillRoundedRect(ctx, x, y + 18, width, 10, 999, "rgba(31,36,34,0.08)");
    fillRoundedRect(ctx, x, y + 18, Math.round((width * value) / 100), 10, 999, "#6b756e");

    ctx.fillStyle = "#7a837f";
    ctx.font = "500 17px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(dimension.leftLabel, x, y + 52);
    ctx.textAlign = "right";
    ctx.fillText(dimension.rightLabel, x + width, y + 52);
    ctx.textAlign = "left";
  }

  function drawPosterSecondary(ctx, secondary) {
    fillRoundedRect(ctx, 60, 1102, 960, 194, 28, "#faf8f3", "rgba(44,49,46,0.08)");

    ctx.fillStyle = "#58605c";
    ctx.font = "600 24px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("次级原型", 96, 1150);

    secondary.forEach(function (item, index) {
      const x = 96 + index * 444;
      fillRoundedRect(ctx, x, 1176, 404, 84, 18, "#f4f1ea", "rgba(44,49,46,0.06)");
      ctx.fillStyle = "#1f2422";
      ctx.font = "600 28px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillText(item.emoji + " " + item.name, x + 18, 1226);
      ctx.fillStyle = "#58605c";
      ctx.font = "500 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
      ctx.fillText(item.nickname + " · " + item.score + "%", x + 18, 1254);
    });
  }

  function drawPosterInsights(ctx, result) {
    fillRoundedRect(ctx, 60, 1326, 960, 252, 28, "#faf8f3", "rgba(44,49,46,0.08)");

    ctx.fillStyle = "#58605c";
    ctx.font = "600 24px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText("关系提示", 96, 1374);

    drawPosterInsightBlock(ctx, 96, 1410, 278, "你吸引的人", truncateText(result.main.attracts, 38));
    drawPosterInsightBlock(ctx, 402, 1410, 278, "你的风险点", truncateText(result.main.risk, 38));
    drawPosterInsightBlock(ctx, 708, 1410, 278, "给你的建议", truncateText(result.main.advice, 38));
  }

  function drawPosterInsightBlock(ctx, x, y, width, title, content) {
    fillRoundedRect(ctx, x, y, width, 126, 18, "#f4f1ea", "rgba(44,49,46,0.06)");
    ctx.fillStyle = "#1f2422";
    ctx.font = "600 22px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText(title, x + 16, y + 32);
    ctx.fillStyle = "#58605c";
    ctx.font = "500 18px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    drawWrappedText(ctx, content, x + 16, y + 62, width - 32, 28, 3);
  }

  function drawPosterQrCard(ctx, qrImage, shareUrl) {
    fillRoundedRect(ctx, 60, 1588, 960, 132, 28, "#1f2422");
    fillRoundedRect(ctx, 760, 1604, 224, 102, 18, "#f7f5ef");
    ctx.drawImage(qrImage, 774, 1616, 78, 78);

    ctx.fillStyle = "#f7f5ef";
    ctx.font = "600 26px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText((quizData.shareConfig && quizData.shareConfig.posterTitle) || "关系风格评估", 96, 1638);

    ctx.fillStyle = "rgba(247,245,239,0.82)";
    ctx.font = "500 20px -apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif";
    ctx.fillText((quizData.shareConfig && quizData.shareConfig.posterSubtitle) || "扫描二维码，直接进入测试", 96, 1672);
    drawWrappedText(ctx, shortenUrlText(shareUrl), 866, 1642, 100, 22, 3);
  }

  function fillRoundedRect(ctx, x, y, width, height, radius, fillStyle, strokeStyle) {
    if (width <= 0 || height <= 0) {
      return;
    }

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
    const characters = String(text || "").split("");
    const lines = [];
    let currentLine = "";

    characters.forEach(function (character) {
      const nextLine = currentLine + character;
      if (ctx.measureText(nextLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = character;
      } else {
        currentLine = nextLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }

    const visibleLines = typeof maxLines === "number" ? lines.slice(0, maxLines) : lines;

    visibleLines.forEach(function (line, index) {
      const isLastLine = index === visibleLines.length - 1;
      const wasClipped = typeof maxLines === "number" && lines.length > maxLines && isLastLine;
      ctx.fillText((wasClipped ? line.slice(0, Math.max(line.length - 1, 0)) + "…" : line), x, y + index * lineHeight);
    });

    return y + visibleLines.length * lineHeight;
  }

  function truncateText(text, maxLength) {
    const source = String(text || "");
    if (source.length <= maxLength) {
      return source;
    }

    return source.slice(0, maxLength - 1) + "…";
  }

  function shortenUrlText(url) {
    const source = String(url || "");
    if (source.length <= 34) {
      return source;
    }

    return source.slice(0, 31) + "…";
  }

  function closePosterPreview() {
    if (!posterPreviewUrl) {
      return;
    }

    posterPreviewUrl = "";
    render();
  }

  function downloadPosterPreview() {
    if (!posterPreviewUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = posterPreviewUrl;
    link.download = "relationship-profile-poster.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(
        function () {
          return true;
        },
        function () {
          return fallbackCopy(text);
        }
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

    state = {
      phase: "home",
      currentIndex: 0,
      answers: createEmptyAnswers(),
      latestResult: null
    };

    localStorage.removeItem(STORAGE_KEY);
    render();
    showToast("记录已清空。");
  }

  function printDebugScores(result) {
    console.group("Relationship Profile Debug");
    console.table(result.rawTotals);
    console.table(result.dimensionScores);
    console.table(
      result.rankings.map(function (item) {
        return {
          archetype: item.name,
          score: item.score
        };
      })
    );
    console.log("signalTags", result.signalTags);
    console.log("chaosMeta", result.chaosMeta);
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
    const variance = average(
      values.map(function (value) {
        return Math.pow(value - mean, 2);
      })
    );

    return Math.sqrt(variance);
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();
