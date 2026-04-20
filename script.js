(function () {
  // Data lives in data.js; this controller keeps quiz state in memory and localStorage.
  const quizData = window.QUIZ_DATA;
  const app = document.getElementById("app");
  const clearDataTopButton = document.getElementById("clear-data-top");
  const debugToggleButton = document.getElementById("debug-toggle");

  const STORAGE_KEY = "relationship-archetype-quiz-state-v1";
  const DEBUG_KEY = "relationship-archetype-quiz-debug-v1";
  const TOTAL_QUESTIONS = quizData.questions.length;
  const DIMENSION_IDS = quizData.dimensions.map((item) => item.id);
  const archetypeMap = Object.fromEntries(quizData.archetypes.map((item) => [item.id, item]));
  const dimensionBounds = buildDimensionBounds();

  let debugTapCount = 0;
  let debugTapTimer = null;
  let state = hydrateState();

  const debugMode = {
    enabled: window.location.search.includes("debug=1") || localStorage.getItem(DEBUG_KEY) === "1"
  };

  window.quizDebug = {
    enable() {
      debugMode.enabled = true;
      localStorage.setItem(DEBUG_KEY, "1");
      showToast("Debug 模式已开启，结果会打印到控制台。");
      if (state.latestResult) {
        printDebugScores(state.latestResult);
      }
    },
    disable() {
      debugMode.enabled = false;
      localStorage.removeItem(DEBUG_KEY);
      showToast("Debug 模式已关闭。");
    },
    print() {
      if (state.latestResult) {
        printDebugScores(state.latestResult);
      } else {
        console.info("No result yet.");
      }
    },
    state() {
      return JSON.parse(JSON.stringify(state));
    }
  };

  bindGlobalEvents();
  render();

  function bindGlobalEvents() {
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

    const action = actionButton.dataset.action;

    switch (action) {
      case "start":
        beginQuiz({ keepResult: true, resume: false });
        break;
      case "resume":
        beginQuiz({ keepResult: true, resume: true });
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
        if (window.confirm("重新开始会清空当前答题进度，但会保留上一份已生成结果。确定继续吗？")) {
          beginQuiz({ keepResult: true, resume: false });
        }
        break;
      case "clear-all":
        clearAllData();
        break;
      case "copy-result":
        copyResultSummary();
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
    const phase = ["home", "quiz", "result"].includes(parsed.phase) ? parsed.phase : "home";
    const currentIndex = clamp(
      Number.isInteger(parsed.currentIndex) ? parsed.currentIndex : findResumeIndex(answers),
      0,
      TOTAL_QUESTIONS - 1
    );
    const latestResult = isResultLike(parsed.latestResult) ? parsed.latestResult : null;

    return {
      phase,
      currentIndex,
      answers,
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
    const bounds = Object.fromEntries(DIMENSION_IDS.map((dimensionId) => [dimensionId, 0]));

    quizData.questions.forEach(function (question) {
      DIMENSION_IDS.forEach(function (dimensionId) {
        const strongestContribution = question.options.reduce(function (maxValue, option) {
          const value = Math.abs(Number(option.scores[dimensionId] || 0));
          return Math.max(maxValue, value);
        }, 0);

        bounds[dimensionId] += strongestContribution;
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
    const nextIndex = answers.findIndex(function (answer) {
      return answer === null;
    });

    return nextIndex === -1 ? TOTAL_QUESTIONS - 1 : nextIndex;
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
      document.title = state.latestResult.main.name + " | 关系风格测试";
      return;
    }

    document.title = "关系风格测试";
  }

  function renderHome() {
    const answeredCount = getAnsweredCount(state.answers);
    const hasPartialProgress = answeredCount > 0 && answeredCount < TOTAL_QUESTIONS;
    const startLabel = hasPartialProgress ? "继续答题" : state.latestResult ? "再测一次" : "开始测试";

    return [
      '<section class="page-card">',
      '  <div class="hero-chip-row">',
      '    <span class="hero-chip">24 道题</span>',
      '    <span class="hero-chip">7 个原型</span>',
      '    <span class="hero-chip">4 条关系维度</span>',
      "  </div>",
      '  <h1 class="hero-title">你在关系里，究竟是哪种让人上头的动物？</h1>',
      '  <p class="hero-subtitle">不是简单的恋爱脑或高冷脸。24 道题，拆出你在节奏、依附、边界和新鲜感里的真实偏好。</p>',
      '  <div class="disclaimer">仅供娱乐与自我观察，内容基于成年人自愿关系中的互动风格，不涉及任何露骨或不适宜公开传播的表达。</div>',
      hasPartialProgress
        ? '  <section class="status-panel"><h2 class="status-title">你上次停在半路</h2><p class="caption">已完成 ' +
          answeredCount +
          "/" +
          TOTAL_QUESTIONS +
          ' 题。刷新不会丢，点一下就能接着答。</p></section>'
        : "",
      '  <div class="hero-actions">',
      '    <button class="primary-button" type="button" data-action="' +
        (hasPartialProgress ? "resume" : "start") +
        '">' +
        startLabel +
        "</button>",
      state.latestResult
        ? '    <button class="secondary-button" type="button" data-action="show-result">查看上次结果</button>'
        : "",
      getAnsweredCount(state.answers) > 0 || state.latestResult
        ? '    <button class="text-button" type="button" data-action="clear-all">清空记录</button>'
        : "",
      "  </div>",
      '  <div class="home-panels">',
      '    <article class="home-panel"><span class="panel-mark">✦</span><p class="panel-copy">题目会围绕谁来定节奏、你如何表达投入、你需要多少边界，以及你对新鲜感的依赖程度来判断原型。</p></article>',
      '    <article class="home-panel"><span class="panel-mark">⌁</span><p class="panel-copy">结果页不只告诉你一个标签，还会给出主型、副型、风险点、吸引对象和适合发给朋友的分享文案。</p></article>',
      '    <article class="home-panel"><span class="panel-mark">☽</span><p class="panel-copy">这类测试最好玩的地方，不是“准不准”，而是它把你平时没明说的关系习惯翻出来给你看。</p></article>',
      "  </div>",
      "</section>"
    ].join("");
  }

  function renderQuiz() {
    const question = quizData.questions[state.currentIndex];
    const currentAnswer = state.answers[state.currentIndex];
    const answeredCount = getAnsweredCount(state.answers);
    const progressPercentage = Math.round(((state.currentIndex + 1) / TOTAL_QUESTIONS) * 100);

    return [
      '<section class="page-card">',
      '  <div class="progress-head">',
      '    <p class="question-count">第 ' +
        (state.currentIndex + 1) +
        " / " +
        TOTAL_QUESTIONS +
        " 题</p>",
      '    <span class="meta-chip">已答 ' + answeredCount + "/" + TOTAL_QUESTIONS + "</span>",
      "  </div>",
      '  <div class="progress-track"><div class="progress-fill" style="width:' +
        progressPercentage +
        '%"></div></div>',
      '  <p class="progress-note">每次选择都会实时保存，本地刷新不会丢。</p>',
      '  <h1 class="question-title">' + question.text + "</h1>",
      '  <div class="option-list">',
      question.options
        .map(function (option, optionIndex) {
          const selected = currentAnswer === optionIndex;
          return (
            '<button class="option-button' +
            (selected ? " is-selected" : "") +
            '" type="button" data-option-index="' +
            optionIndex +
            '" aria-pressed="' +
            String(selected) +
            '">' +
            '<span class="option-tag">' +
            (optionIndex === 0 ? "A" : "B") +
            '</span><span class="option-copy">' +
            option.text +
            "</span></button>"
          );
        })
        .join(""),
      "  </div>",
      '  <div class="question-footer">',
      '    <span class="micro-copy">' +
        (currentAnswer === null ? "选一个更像你的答案。" : "你可以返回修改，分数会自动重算。") +
        "</span>",
      '    <button class="ghost-link" type="button" data-action="restart">重来</button>',
      "  </div>",
      '  <div class="nav-row">',
      '    <button class="nav-button nav-button--ghost" type="button" data-action="previous"' +
        (state.currentIndex === 0 ? " disabled" : "") +
        ">上一题</button>",
      '    <button class="nav-button nav-button--primary" type="button" data-action="next"' +
        (currentAnswer === null ? " disabled" : "") +
        ">" +
        (state.currentIndex === TOTAL_QUESTIONS - 1 ? "查看结果" : "下一题") +
        "</button>",
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
          '<article class="meter-card">',
          '  <div class="meter-top">',
          '    <h3 class="meter-label">' + dimension.label + "</h3>",
          '    <span class="meter-value">' + value + "%</span>",
          "  </div>",
          '  <div class="meter-track"><div class="meter-fill meter-fill--' +
            dimension.id +
            '" style="width:' +
            value +
            '%"></div></div>',
          '  <div class="meter-scale"><span>' +
            dimension.leftLabel +
            "</span><span>" +
            dimension.rightLabel +
            "</span></div>",
          "</article>"
        ].join("");
      })
      .join("");

    const secondaryCards = secondary
      .map(function (item) {
        return [
          '<article class="secondary-card">',
          '  <h3 class="secondary-name">' +
            item.emoji +
            " " +
            item.name +
            " · " +
            item.score +
            "%</h3>",
          '  <p class="secondary-note">' + item.summary + "</p>",
          "</article>"
        ].join("");
      })
      .join("");

    const sampleCards = result.shareSamples
      .map(function (text, index) {
        return [
          '<article class="sample-card">',
          '  <h3 class="sample-title">分享文案 ' + (index + 1) + "</h3>",
          '  <p class="sample-text">' + text + "</p>",
          "</article>"
        ].join("");
      })
      .join("");

    return [
      '<section class="page-card">',
      '  <div class="result-head">',
      '    <div>',
      '      <span class="result-badge">' + result.main.emoji + " 主型匹配 " + result.main.score + "%</span>",
      '      <h1 class="result-type">' + result.main.name + "</h1>",
      '      <p class="result-subtitle">' + result.main.nickname + "</p>",
      "    </div>",
      '    <span class="meta-chip">已生成结果</span>',
      "  </div>",
      '  <p class="result-summary">' + result.main.summary + "</p>",
      '  <div class="trait-grid">',
      '    <div class="trait-box"><span class="trait-key">一句气质</span><strong class="trait-value">' + result.main.nickname + "</strong></div>",
      '    <div class="trait-box"><span class="trait-key">副型提示</span><strong class="trait-value">' +
        secondary.map(function (item) {
          return item.name;
        }).join(" / ") +
        "</strong></div>",
      '    <div class="trait-box"><span class="trait-key">关系关键词</span><strong class="trait-value">' +
        getDimensionHighlight(result.dimensionScores) +
        "</strong></div>",
      '    <div class="trait-box"><span class="trait-key">分享热度</span><strong class="trait-value">很适合发给朋友点评你</strong></div>',
      "  </div>",
      '  <div class="result-sections">',
      '    <section class="glass-panel"><h2 class="section-title">你的关系画像</h2><p class="section-copy">' +
        result.main.interpretation +
        "</p></section>",
      '    <section><h2 class="section-title">四维分布</h2><div class="meter-list">' +
        dimensionCards +
        "</div></section>",
      '    <section class="insight-card"><h2 class="section-title">你吸引的人</h2><p class="section-copy">' +
        result.main.attracts +
        "</p></section>",
      '    <section class="insight-card"><h2 class="section-title">你的危险点</h2><p class="section-copy">' +
        result.main.risk +
        "</p></section>",
      '    <section class="insight-card"><h2 class="section-title">你的关系建议</h2><p class="section-copy">' +
        result.main.advice +
        "</p></section>",
      '    <section><h2 class="section-title">你的次级原型</h2><div class="secondary-grid">' +
        secondaryCards +
        "</div></section>",
      '    <section><h2 class="section-title">可直接分享的文案</h2><div class="sample-list">' +
        sampleCards +
        "</div></section>",
      "  </div>",
      '  <div class="result-actions">',
      '    <button class="primary-button" type="button" data-action="copy-result">复制结果文案</button>',
      '    <button class="secondary-button" type="button" data-action="restart">再测一次</button>',
      '    <button class="text-button" type="button" data-action="go-home">返回首页</button>',
      '    <button class="text-button" type="button" data-action="clear-all">清空记录</button>',
      "  </div>",
      '  <p class="tiny-note">这是基于你的选择偏好生成的娱乐化画像，不代表任何诊断或绝对结论。</p>',
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
      state.currentIndex = clamp(state.currentIndex, 0, TOTAL_QUESTIONS - 1);
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
      showToast("先选一个更像你的答案。");
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
    const firstMissingIndex = state.answers.findIndex(function (answer) {
      return answer === null;
    });

    if (firstMissingIndex !== -1) {
      state.currentIndex = firstMissingIndex;
      state.phase = "quiz";
      persistState();
      render();
      showToast("还有题没答完，已经帮你跳过去了。");
      return;
    }

    state.latestResult = calculateResult(state.answers);
    state.phase = "result";
    persistState();
    render();
  }

  function calculateResult(answers) {
    const rawTotals = Object.fromEntries(DIMENSION_IDS.map((dimensionId) => [dimensionId, 0]));
    const answerTrace = Object.fromEntries(DIMENSION_IDS.map((dimensionId) => [dimensionId, []]));

    quizData.questions.forEach(function (question, questionIndex) {
      const answerIndex = answers[questionIndex];
      if (answerIndex === null) {
        return;
      }

      const scores = question.options[answerIndex].scores;

      DIMENSION_IDS.forEach(function (dimensionId) {
        const value = Number(scores[dimensionId] || 0);
        rawTotals[dimensionId] += value;

        if (value !== 0) {
          answerTrace[dimensionId].push(value);
        }
      });
    });

    const dimensionScores = Object.fromEntries(
      DIMENSION_IDS.map(function (dimensionId) {
        return [dimensionId, normalizeDimension(rawTotals[dimensionId], dimensionBounds[dimensionId])];
      })
    );

    const rankings = quizData.archetypes
      .map(function (archetype) {
        const baseScore = scoreArchetype(archetype, dimensionScores);
        return Object.assign({}, archetype, {
          score: archetype.id === "chaos"
            ? scoreChaosArchetype(dimensionScores, answerTrace)
            : baseScore
        });
      })
      .sort(function (left, right) {
        return right.score - left.score;
      });

    const main = rankings[0];
    const shareSamples = buildShareSamples(main, rankings.slice(1, 3), dimensionScores);

    return {
      createdAt: new Date().toISOString(),
      rawTotals,
      dimensionScores,
      rankings,
      main,
      shareSamples
    };
  }

  function normalizeDimension(value, bound) {
    if (!bound) {
      return 50;
    }

    const normalized = ((value + bound) / (2 * bound)) * 100;
    return clamp(Math.round(normalized), 0, 100);
  }

  function scoreArchetype(archetype, dimensionScores) {
    if (archetype.id === "chaos") {
      return 0;
    }

    let totalWeight = 0;
    let weightedDistance = 0;

    DIMENSION_IDS.forEach(function (dimensionId) {
      const weight = archetype.weights[dimensionId] || 1;
      totalWeight += weight;
      weightedDistance += Math.abs(dimensionScores[dimensionId] - archetype.profile[dimensionId]) * weight;
    });

    const averageDistance = weightedDistance / totalWeight;
    const baseScore = 100 - averageDistance * 1.12;
    const bonus = scoreBonus(archetype.id, dimensionScores);

    return clamp(Math.round(baseScore + bonus), 12, 98);
  }

  function scoreBonus(archetypeId, dimensionScores) {
    switch (archetypeId) {
      case "dog":
        return (dimensionScores.attachment > 70 ? 8 : 0) + (dimensionScores.dominance < 45 ? 5 : 0);
      case "hunter":
        return (dimensionScores.dominance > 72 ? 8 : 0) + (dimensionScores.novelty > 56 ? 4 : 0);
      case "cat":
        return (dimensionScores.attachment < 38 ? 8 : 0) + (dimensionScores.boundary < 48 ? 5 : 0);
      case "explorer":
        return (dimensionScores.novelty > 74 ? 10 : 0) + (dimensionScores.boundary < 40 ? 4 : 0);
      case "observer":
        return (dimensionScores.attachment < 30 ? 8 : 0) + (dimensionScores.novelty < 44 ? 4 : 0);
      case "binding":
        return (dimensionScores.attachment > 78 ? 8 : 0) + (dimensionScores.boundary > 74 ? 8 : 0);
      default:
        return 0;
    }
  }

  function scoreChaosArchetype(dimensionScores, answerTrace) {
    const centeredness = average(
      DIMENSION_IDS.map(function (dimensionId) {
        return 100 - Math.abs(dimensionScores[dimensionId] - 50) * 2;
      })
    );

    const volatility = average(
      DIMENSION_IDS.map(function (dimensionId) {
        const trace = answerTrace[dimensionId];
        if (!trace.length) {
          return 0;
        }

        const positives = trace.filter(function (value) {
          return value > 0;
        }).length;
        const negatives = trace.filter(function (value) {
          return value < 0;
        }).length;
        const total = positives + negatives;

        if (!total) {
          return 0;
        }

        return (Math.min(positives, negatives) / total) * 200;
      })
    );

    const regularScores = quizData.archetypes
      .filter(function (archetype) {
        return archetype.id !== "chaos";
      })
      .map(function (archetype) {
        return scoreArchetype(archetype, dimensionScores);
      })
      .sort(function (left, right) {
        return right - left;
      });

    const ambiguity = regularScores.length > 1 ? clamp(100 - (regularScores[0] - regularScores[1]) * 8, 0, 100) : 30;
    const swingBonus = volatility > 52 && centeredness > 46 ? 8 : 0;

    return clamp(Math.round(centeredness * 0.35 + volatility * 0.45 + ambiguity * 0.2 + swingBonus), 18, 97);
  }

  function buildShareSamples(main, secondary, dimensionScores) {
    const replacements = {
      "{type}": main.name,
      "{match}": String(main.score),
      "{nickname}": main.nickname,
      "{summary}": main.summary,
      "{secondary}": secondary
        .map(function (item) {
          return item.name + " " + item.score + "%";
        })
        .join(" / "),
      "{dimensionHighlight}": getDimensionHighlight(dimensionScores)
    };

    return quizData.shareTemplates.map(function (template) {
      return Object.keys(replacements).reduce(function (text, token) {
        return text.replaceAll(token, replacements[token]);
      }, template);
    });
  }

  function getDimensionHighlight(dimensionScores) {
    const sorted = quizData.dimensions
      .map(function (dimension) {
        return {
          id: dimension.id,
          label: dimension.label,
          leftLabel: dimension.leftLabel,
          rightLabel: dimension.rightLabel,
          distance: Math.abs(dimensionScores[dimension.id] - 50),
          score: dimensionScores[dimension.id]
        };
      })
      .sort(function (left, right) {
        return right.distance - left.distance;
      });

    const strongest = sorted[0];
    const direction = strongest.score >= 50 ? strongest.rightLabel : strongest.leftLabel;

    return strongest.label + "偏" + direction;
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
      "【我的关系风格测试结果】",
      result.main.name + " " + result.main.score + "%｜" + result.main.nickname,
      result.main.summary,
      "副型：" + secondary,
      "四维：" + dimensionSummary,
      "你吸引的人：" + result.main.attracts,
      "你的危险点：" + result.main.risk,
      "你的关系建议：" + result.main.advice,
      "分享文案参考：" + result.shareSamples[0]
    ].join("\n");

    copyText(text).then(function (success) {
      showToast(success ? "结果文案已复制。" : "复制失败，请手动长按复制。");
    });
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

    if (!window.confirm("这会清空当前进度和已保存结果，确定要继续吗？")) {
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
    console.group("Relationship Quiz Debug");
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

    const total = values.reduce(function (sum, value) {
      return sum + value;
    }, 0);

    return total / values.length;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
})();
