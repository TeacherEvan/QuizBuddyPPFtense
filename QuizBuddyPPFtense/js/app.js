import { QUESTIONS } from './data.js';
import { playSound, toggleSound, isSoundEnabled, getSoundTheme, setSoundTheme } from './audio.js';
import {
  addPoint,
  decrementSpeedRunTimer,
  getState,
  incrementIndex,
  loadScores,
  resetIndex,
  resetScores,
  resetStreak,
  setLevel,
  setProgress,
  startSpeedRun,
  stopSpeedRun,
  recordMistake,
  resolveMistake,
  startReviewMode,
  exitReviewMode,
  setCategoryFilter,
  toggleHighContrast
} from './state.js';

const LEVEL_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  advance: 'Advance'
};

const SECRET_CODES = ['tense', '88mph'];
const ADVANCE_DELAY_MS = 1100;

// Fisher–Yates shuffle with injectable rng for deterministic test execution
let rng = Math.random;

export const __setRng = (fn) => {
  rng = fn;
};

const shuffle = (arr) => {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

let activeQuestions = [];
let activeOptionOrder = [];

const buildActiveQuestions = (level) => {
  const state = getState();
  if (state.reviewMode) {
    activeQuestions = [...state.mistakes];
    activeOptionOrder = activeQuestions.map(() => [0, 1, 2]);
    return;
  }

  let base = QUESTIONS.filter((question) => question.level === level);
  if (state.activeCategoryFilter && state.activeCategoryFilter !== 'all') {
    base = base.filter((q) => q.tenseCategory === state.activeCategoryFilter);
    if (base.length === 0) {
      base = QUESTIONS.filter((question) => question.level === level);
    }
  }

  activeQuestions = shuffle(base);
  activeOptionOrder = activeQuestions.map(() => shuffle([0, 1, 2]));
};

const getQuestionsForCurrentLevel = () => activeQuestions;

const pluralize = (count, singular) => `${count} ${singular}${count === 1 ? '' : 's'}`;

let pendingAdvanceTimer = null;
let speedRunInterval = null;
let eventsController = null;
// Every controller this module instance has ever created. Abort ALL of them on
// teardown: a single leaked controller keeps a stale keydown listener on
// `window`, and a stale instance answers with its own question bank.
const eventsControllers = new Set();
let keyBuffer = '';
let footerClicks = 0;

const cancelPendingAdvance = () => {
  if (pendingAdvanceTimer !== null) {
    window.clearTimeout(pendingAdvanceTimer);
    pendingAdvanceTimer = null;
  }
};

const stopSpeedRunTimer = () => {
  if (speedRunInterval !== null) {
    window.clearInterval(speedRunInterval);
    speedRunInterval = null;
  }
};

const getStreakTier = (streak) => {
  if (streak >= 10) return '3';
  if (streak >= 6) return '2';
  if (streak >= 3) return '1';
  return '0';
};

const updateLeaderboardStats = () => {
  const state = getState();
  const bestEasy = document.getElementById('best-easy');
  const bestMed = document.getElementById('best-medium');
  const bestAdv = document.getElementById('best-advance');
  const reviewMistakesBtn = document.getElementById('review-mistakes-btn');
  const mistakesCount = document.getElementById('mistakes-count');
  const contrastBtn = document.getElementById('contrast-toggle-btn');
  const audioThemeBtn = document.getElementById('audio-theme-btn');

  if (bestEasy) bestEasy.textContent = String(state.bestStreaks.easy || 0);
  if (bestMed) bestMed.textContent = String(state.bestStreaks.medium || 0);
  if (bestAdv) bestAdv.textContent = String(state.bestStreaks.advance || 0);

  if (reviewMistakesBtn && mistakesCount) {
    mistakesCount.textContent = String(state.mistakes.length);
    if (state.mistakes.length > 0) {
      reviewMistakesBtn.classList.remove('panel--hidden');
    } else {
      reviewMistakesBtn.classList.add('panel--hidden');
    }
  }

  if (contrastBtn) {
    contrastBtn.textContent = state.highContrast ? '👁️ Contrast: High' : '👁️ Contrast: Normal';
  }

  if (audioThemeBtn) {
    audioThemeBtn.textContent = `🎵 Theme: ${getSoundTheme() === '8bit' ? '8-Bit' : 'Neo'}`;
  }

  document.body.classList.toggle('theme-high-contrast', state.highContrast);
};

const updateHud = () => {
  const levelLabelEl = document.getElementById('level-label');
  const questionCounterEl = document.getElementById('question-counter');
  const scoreCounterEl = document.getElementById('score-counter');
  const streakCounterEl = document.getElementById('streak-counter');
  const bestStreakCounterEl = document.getElementById('best-streak-counter');
  const timerCounterEl = document.getElementById('timer-counter');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const gameCard = document.getElementById('game-card');

  const state = getState();
  const questions = getQuestionsForCurrentLevel();
  const displayIndex = Math.min(state.currentIndex + 1, Math.max(1, questions.length));

  if (levelLabelEl) {
    if (state.reviewMode) {
      levelLabelEl.textContent = 'Mode: Review';
    } else if (state.speedRunActive) {
      levelLabelEl.textContent = `Mode: Speed Run (${LEVEL_LABELS[state.currentLevel]})`;
    } else {
      const catSuffix = state.activeCategoryFilter !== 'all' ? ` [${state.activeCategoryFilter.toUpperCase()}]` : '';
      levelLabelEl.textContent = `Level: ${LEVEL_LABELS[state.currentLevel]}${catSuffix}`;
    }
  }

  if (questionCounterEl) {
    questionCounterEl.textContent = state.speedRunActive
      ? `Speed Score: ${state.speedRunScore}`
      : `Question: ${displayIndex}/${questions.length}`;
  }

  if (scoreCounterEl) {
    scoreCounterEl.textContent = state.speedRunActive
      ? `Score: ${state.speedRunScore}`
      : `Score: ${state.scores[state.currentLevel]}`;
  }

  if (streakCounterEl) streakCounterEl.textContent = `Streak: ${state.currentStreak}`;
  if (bestStreakCounterEl) {
    const levelBest = state.bestStreaks[state.currentLevel] || 0;
    bestStreakCounterEl.textContent = `Best Streak: ${levelBest} (Global: ${state.bestStreak})`;
  }

  if (timerCounterEl) {
    if (state.speedRunActive) {
      timerCounterEl.classList.remove('panel--hidden');
      timerCounterEl.textContent = `Time: ${state.speedRunTimeLeft}s`;
    } else {
      timerCounterEl.classList.add('panel--hidden');
    }
  }

  if (soundToggleBtn) {
    soundToggleBtn.textContent = isSoundEnabled() ? '🔊 Audio' : '🔇 Muted';
    soundToggleBtn.classList.toggle('sound--muted', !isSoundEnabled());
  }

  if (gameCard) {
    gameCard.dataset.streakTier = getStreakTier(state.currentStreak);
  }

  updateLeaderboardStats();
};

const clearFeedbackState = () => {
  const gameCard = document.getElementById('game-card');
  const feedbackEl = document.getElementById('feedback');
  const replayBtn = document.getElementById('replay-btn');
  const explContainer = document.getElementById('explanation-container');
  const explText = document.getElementById('explanation-text');

  gameCard?.classList.remove('game--correct', 'game--incorrect');
  feedbackEl?.classList.remove('feedback--success', 'feedback--error');
  explContainer?.classList.add('panel--hidden');
  // Drop the previous insight so the reserved slot never shows stale text.
  explText?.replaceChildren();
  replayBtn?.classList.add('panel--hidden');
  document.querySelectorAll('[data-option]').forEach((button) => {
    button.classList.remove('btn--is-correct', 'btn--is-wrong', 'btn--is-locked');
  });
};

const renderSentenceWithBlank = (sentence) => {
  const sentenceEl = document.getElementById('sentence');
  if (sentenceEl) sentenceEl.textContent = sentence;
};

const handleSpeedRunComplete = () => {
  stopSpeedRunTimer();
  const finalScore = stopSpeedRun();
  playSound('milestone');

  const sentenceEl = document.getElementById('sentence');
  const feedbackEl = document.getElementById('feedback');
  const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
  const replayBtn = document.getElementById('replay-btn');

  if (sentenceEl) sentenceEl.textContent = '⏱️ Time is UP! Speed Run Complete!';
  if (feedbackEl) {
    feedbackEl.textContent = `Spectacular sprint! Final Speed Run Score: ${finalScore} points.`;
    feedbackEl.classList.add('feedback--success');
  }
  answerButtons.forEach((button) => {
    button.disabled = true;
    button.classList.add('btn--is-locked');
  });
  replayBtn?.classList.remove('panel--hidden');
  updateHud();
};

const renderQuestion = () => {
  clearFeedbackState();

  const sentenceEl = document.getElementById('sentence');
  const feedbackEl = document.getElementById('feedback');
  const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
  const replayBtn = document.getElementById('replay-btn');
  const changeLevelBtn = document.getElementById('change-level-btn');
  const tenseBadge = document.getElementById('tense-badge');

  const state = getState();
  const questions = getQuestionsForCurrentLevel();
  const question = questions[state.currentIndex];

  if (!question) {
    if (state.speedRunActive) {
      buildActiveQuestions(state.currentLevel);
      resetIndex();
      renderQuestion();
      return;
    }
    playSound('milestone');
    if (sentenceEl) {
      sentenceEl.textContent = state.reviewMode
        ? '🎉 Excellent work! All recorded mistakes have been reviewed!'
        : `Great work! You completed the ${LEVEL_LABELS[state.currentLevel]} level.`;
    }
    if (feedbackEl) feedbackEl.textContent = 'Practice again or pick another level to keep going.';
    answerButtons.forEach((button) => {
      button.disabled = true;
      button.classList.add('btn--is-locked');
    });
    replayBtn?.classList.remove('panel--hidden');
    changeLevelBtn?.focus();
    updateHud();
    return;
  }

  if (tenseBadge) {
    const cat = question.tenseCategory ? question.tenseCategory.toUpperCase() : 'TENSE';
    tenseBadge.textContent = `${cat} TENSE`;
  }

  renderSentenceWithBlank(question.sentence);
  if (feedbackEl) feedbackEl.textContent = '';
  const order = activeOptionOrder[state.currentIndex] || [0, 1, 2];
  answerButtons.forEach((button, index) => {
    const option = question.options[order[index]];
    button.textContent = option || '';
    button.dataset.option = option || '';
    // The keycap pseudo-element is decorative: keep the accessible name
    // equal to the visible option text.
    if (option) {
      button.setAttribute('aria-label', option);
    } else {
      button.removeAttribute('aria-label');
    }
    button.disabled = false;
    button.classList.remove('btn--is-correct', 'btn--is-wrong', 'btn--is-locked');
  });

  updateHud();
};

const showGame = () => {
  const levelSelect = document.getElementById('level-select');
  const game = document.getElementById('game');
  const answerButtons = Array.from(document.querySelectorAll('[data-option]'));

  levelSelect?.classList.add('panel--hidden');
  game?.classList.remove('panel--hidden');
  renderQuestion();
  answerButtons[0]?.focus();
};

const showLevelSelect = () => {
  stopSpeedRunTimer();
  stopSpeedRun();
  exitReviewMode();
  const levelSelect = document.getElementById('level-select');
  const game = document.getElementById('game');

  game?.classList.add('panel--hidden');
  levelSelect?.classList.remove('panel--hidden');
  updateLeaderboardStats();
};

const checkMilestoneEasterEgg = (streak, score) => {
  if (streak === 10) {
    playSound('milestone');
    return ' 🌌 [10-Streak Master!]';
  }
  if (streak === 7) {
    playSound('milestone');
    return ' ⏳ [7-Streak Achieved!]';
  }
  if (score === 42) {
    playSound('milestone');
    return ' ✨ [42 is the Answer!]';
  }
  return '';
};

const handleAnswer = (selectedOption) => {
  playSound('click');
  const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
  const gameCard = document.getElementById('game-card');
  const feedbackEl = document.getElementById('feedback');
  const explContainer = document.getElementById('explanation-container');
  const explText = document.getElementById('explanation-text');

  answerButtons.forEach((button) => {
    button.disabled = true;
  });
  const state = getState();
  const questions = getQuestionsForCurrentLevel();
  const question = questions[state.currentIndex];

  if (!question) {
    return;
  }

  cancelPendingAdvance();
  clearFeedbackState();
  if (gameCard) void gameCard.offsetWidth;

  if (question.explanation && explContainer && explText) {
    // Reveal the slot first so the live region announces the new insight.
    explContainer.classList.remove('panel--hidden');
    explText.textContent = `💡 Grammar Insight: ${question.explanation}`;
  }

  const revealAnswer = (wrongOption = null) => {
    answerButtons.forEach((button) => {
      if (button.dataset.option === question.correct) {
        button.classList.add('btn--is-correct');
      } else if (wrongOption !== null && button.dataset.option === wrongOption) {
        button.classList.add('btn--is-wrong');
      }
    });
  };

  if (selectedOption === question.correct) {
    playSound('correct');
    const reward = addPoint();
    gameCard?.classList.add('game--correct');
    feedbackEl?.classList.add('feedback--success');
    revealAnswer();
    // Compact detail string: every modifier still lands, but the line stays
    // short enough to fit the reserved feedback box on narrow screens.
    const details = [`${pluralize(reward.earned, 'point')}`];
    if (reward.bonus) details.push('1 bonus');
    if (reward.multiplier > 1) details.push(`${reward.multiplier}x multiplier`);
    const milestoneEgg = checkMilestoneEasterEgg(reward.streak, getState().scores[state.currentLevel]);
    if (feedbackEl) {
      feedbackEl.textContent = `Correct! "${question.correct}" fits the sentence. (${details.join(', ')}) Streak ${
        reward.streak
      }.${milestoneEgg}`;
    }
    if (state.reviewMode) {
      resolveMistake(question.sentence);
    }
  } else {
    playSound('incorrect');
    resetStreak();
    recordMistake(question);
    gameCard?.classList.add('game--incorrect');
    feedbackEl?.classList.add('feedback--error');
    revealAnswer(selectedOption);
    if (feedbackEl) {
      feedbackEl.textContent = `Not quite. The correct missing word is "${question.correct}".`;
    }
  }

  if (!state.speedRunActive && !state.reviewMode) {
    const nextIndex = state.currentIndex + 1;
    const progressToSave = nextIndex >= questions.length ? 0 : nextIndex;
    setProgress(state.currentLevel, progressToSave);
  }

  pendingAdvanceTimer = window.setTimeout(() => {
    pendingAdvanceTimer = null;
    incrementIndex();
    renderQuestion();
  }, ADVANCE_DELAY_MS);
};

const startSpeedRunLoop = () => {
  stopSpeedRunTimer();
  startSpeedRun();
  buildActiveQuestions(getState().currentLevel);
  showGame();
  updateHud();

  speedRunInterval = window.setInterval(() => {
    const timeLeft = decrementSpeedRunTimer();
    if (timeLeft <= 5 && timeLeft > 0) {
      playSound('countdown');
    }
    updateHud();
    if (timeLeft <= 0) {
      handleSpeedRunComplete();
    }
  }, 1000);
};

const setupEvents = () => {
  eventsControllers.forEach((controller) => controller.abort());
  eventsControllers.clear();
  stopSpeedRunTimer();
  const Controller = (typeof window !== 'undefined' && window.AbortController) || AbortController;
  eventsController = new Controller();
  eventsControllers.add(eventsController);
  const { signal } = eventsController;
  keyBuffer = '';
  footerClicks = 0;

  const welcomeModal = document.getElementById('welcome-modal');
  const startBtn = document.getElementById('start-btn');
  const levelSelect = document.getElementById('level-select');
  const levelButtons = Array.from(document.querySelectorAll('[data-level]'));
  const speedrunBtn = document.getElementById('speedrun-btn');
  const reviewMistakesBtn = document.getElementById('review-mistakes-btn');
  const chipButtons = Array.from(document.querySelectorAll('[data-category]'));
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const contrastToggleBtn = document.getElementById('contrast-toggle-btn');
  const audioThemeBtn = document.getElementById('audio-theme-btn');
  const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
  const changeLevelBtn = document.getElementById('change-level-btn');
  const resetScoresBtn = document.getElementById('reset-scores-btn');
  const replayBtn = document.getElementById('replay-btn');
  const feedbackEl = document.getElementById('feedback');
  const footer = document.querySelector('.modal__footer');

  startBtn?.addEventListener(
    'click',
    () => {
      playSound('click');
      welcomeModal?.classList.remove('modal--visible');
      levelSelect?.classList.remove('panel--hidden');
      updateLeaderboardStats();
      levelButtons[0]?.focus();
    },
    { signal }
  );

  levelButtons.forEach((button) => {
    button.addEventListener(
      'click',
      () => {
        playSound('click');
        const level = button.dataset.level;
        setLevel(level);
        buildActiveQuestions(level);
        showGame();
      },
      { signal }
    );
  });

  chipButtons.forEach((chip) => {
    chip.addEventListener(
      'click',
      () => {
        playSound('click');
        const cat = chip.dataset.category;
        setCategoryFilter(cat);
        chipButtons.forEach((c) => c.classList.remove('btn--chip-active'));
        chip.classList.add('btn--chip-active');
      },
      { signal }
    );
  });

  speedrunBtn?.addEventListener(
    'click',
    () => {
      playSound('click');
      startSpeedRunLoop();
    },
    { signal }
  );

  reviewMistakesBtn?.addEventListener(
    'click',
    () => {
      playSound('click');
      if (startReviewMode()) {
        buildActiveQuestions(getState().currentLevel);
        showGame();
      }
    },
    { signal }
  );

  contrastToggleBtn?.addEventListener(
    'click',
    () => {
      playSound('click');
      toggleHighContrast();
      updateLeaderboardStats();
    },
    { signal }
  );

  audioThemeBtn?.addEventListener(
    'click',
    () => {
      playSound('click');
      const newTheme = getSoundTheme() === 'neo' ? '8bit' : 'neo';
      setSoundTheme(newTheme);
      playSound('milestone');
      updateLeaderboardStats();
    },
    { signal }
  );

  soundToggleBtn?.addEventListener(
    'click',
    () => {
      toggleSound();
      playSound('click');
      updateHud();
    },
    { signal }
  );

  answerButtons.forEach((button) => {
    button.addEventListener('click', () => handleAnswer(button.dataset.option), { signal });
  });

  changeLevelBtn?.addEventListener(
    'click',
    () => {
      playSound('click');
      cancelPendingAdvance();
      stopSpeedRunTimer();
      stopSpeedRun();
      resetIndex();
      showLevelSelect();
      if (feedbackEl) feedbackEl.textContent = '';
      levelButtons[0]?.focus();
    },
    { signal }
  );

  resetScoresBtn?.addEventListener(
    'click',
    () => {
      playSound('click');
      cancelPendingAdvance();
      stopSpeedRunTimer();
      const level = getState().currentLevel;
      resetScores();
      buildActiveQuestions(level);
      renderQuestion();
      if (feedbackEl) {
        feedbackEl.textContent = 'Scores have been reset.';
        feedbackEl.classList.remove('feedback--error');
        feedbackEl.classList.add('feedback--success');
      }
    },
    { signal }
  );

  replayBtn?.addEventListener(
    'click',
    () => {
      playSound('click');
      cancelPendingAdvance();
      if (getState().speedRunActive) {
        startSpeedRunLoop();
      } else {
        const level = getState().currentLevel;
        buildActiveQuestions(level);
        setLevel(level);
        showGame();
      }
    },
    { signal }
  );

  footer?.addEventListener(
    'click',
    () => {
      footerClicks += 1;
      playSound('click');
      if (footerClicks >= 5) {
        playSound('milestone');
        footer.textContent = "🍎 Teacher Evan's Honor Roll: 'Time flies like an arrow; fruit flies like a banana!'";
        document.body.classList.add('easter--scholar');
      }
    },
    { signal }
  );

  window.addEventListener(
    'keydown',
    (event) => {
      const key = event.key;
      const game = document.getElementById('game');
      const isGameActive = game && !game.classList.contains('panel--hidden');

      if (isGameActive) {
        const buttons = Array.from(document.querySelectorAll('[data-option]'));
        if (['1', '2', '3'].includes(key)) {
          const idx = parseInt(key, 10) - 1;
          if (buttons[idx] && !buttons[idx].disabled) {
            event.preventDefault();
            handleAnswer(buttons[idx].dataset.option);
            return;
          }
        } else if (['a', 'b', 'c', 'A', 'B', 'C'].includes(key)) {
          const map = { a: 0, b: 1, c: 2 };
          const idx = map[key.toLowerCase()];
          if (buttons[idx] && !buttons[idx].disabled) {
            event.preventDefault();
            handleAnswer(buttons[idx].dataset.option);
            return;
          }
        }
      }

      if (typeof key !== 'string' || key.length !== 1) return;
      keyBuffer = (keyBuffer + key.toLowerCase()).slice(-8);
      if (SECRET_CODES.some((code) => keyBuffer.endsWith(code))) {
        keyBuffer = '';
        playSound('warp');
        document.body.classList.add('easter--chrono-warp');
        const currentFeedback = document.getElementById('feedback');
        if (currentFeedback) {
          currentFeedback.textContent = '⚡ 1.21 GIGAWATTS! Past, Present & Future timelines synchronized!';
        }
      }
    },
    { signal }
  );
};

const init = () => {
  loadScores();
  setupEvents();
  updateHud();
  const state = getState();
  if (state.currentIndex > 0) {
    buildActiveQuestions(state.currentLevel);
    if (state.currentIndex < activeQuestions.length) {
      const welcomeModal = document.getElementById('welcome-modal');
      welcomeModal?.classList.remove('modal--visible');
      showGame();
    } else {
      resetIndex();
    }
  }
};

/**
 * Test-support hook: fully detach this module instance.
 *
 * Every test re-imports app.js, which leaves the previous instance's
 * window listeners (and its pending advance timer) attached to the shared
 * document. A stale instance would then answer the current question with
 * its own question bank, which made the keyboard-shortcut test flaky.
 * `__teardown()` guarantees a clean slate between test cases.
 */
export const __teardown = () => {
  cancelPendingAdvance();
  stopSpeedRunTimer();
  eventsControllers.forEach((controller) => controller.abort());
  eventsControllers.clear();
  eventsController = null;
  document.removeEventListener('DOMContentLoaded', init);
};

document.addEventListener('DOMContentLoaded', init, { once: true });
