import { QUESTIONS } from './data.js';
import { playSound, toggleSound, isSoundEnabled } from './audio.js';
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
  stopSpeedRun
} from './state.js';

const LEVEL_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  advance: 'Advance'
};

const SECRET_CODES = ['tense', '88mph'];
const ADVANCE_DELAY_MS = 850;

// Fisher–Yates shuffle. rng is injectable (defaults to Math.random) so tests
// can drive deterministic orders. Returns a new array; input is untouched.
let rng = Math.random;

// Test-only hook to make shuffle deterministic. Not used in production.
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

// Per-level shuffled question list and per-question option permutation.
let activeQuestions = [];
let activeOptionOrder = [];

const buildActiveQuestions = (level) => {
  const base = QUESTIONS.filter((question) => question.level === level);
  activeQuestions = shuffle(base);
  activeOptionOrder = activeQuestions.map(() => shuffle([0, 1, 2]));
};

const getQuestionsForCurrentLevel = () => activeQuestions;

const pluralize = (count, singular) => `${count} ${singular}${count === 1 ? '' : 's'}`;

let pendingAdvanceTimer = null;
let speedRunInterval = null;
let eventsController = null;
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

  if (bestEasy) bestEasy.textContent = String(state.bestStreaks.easy || 0);
  if (bestMed) bestMed.textContent = String(state.bestStreaks.medium || 0);
  if (bestAdv) bestAdv.textContent = String(state.bestStreaks.advance || 0);
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
  const displayIndex = Math.min(state.currentIndex + 1, questions.length);

  if (levelLabelEl) {
    levelLabelEl.textContent = state.speedRunActive
      ? `Mode: Speed Run (${LEVEL_LABELS[state.currentLevel]})`
      : `Level: ${LEVEL_LABELS[state.currentLevel]}`;
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

  gameCard?.classList.remove('game--correct', 'game--incorrect');
  feedbackEl?.classList.remove('feedback--success', 'feedback--error');
  replayBtn?.classList.add('panel--hidden');
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
    button.style.opacity = '0.65';
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

  const state = getState();
  const questions = getQuestionsForCurrentLevel();
  const question = questions[state.currentIndex];

  if (!question) {
    if (state.speedRunActive) {
      // Loop questions during speed run
      buildActiveQuestions(state.currentLevel);
      resetIndex();
      renderQuestion();
      return;
    }
    playSound('milestone');
    if (sentenceEl) sentenceEl.textContent = `Great work! You completed the ${LEVEL_LABELS[state.currentLevel]} level.`;
    if (feedbackEl) feedbackEl.textContent = 'Practice again or pick another level to keep going.';
    answerButtons.forEach((button) => {
      button.disabled = true;
      button.style.opacity = '0.65';
    });
    // Reveal replay so the learner can loop the same level immediately.
    replayBtn?.classList.remove('panel--hidden');
    changeLevelBtn?.focus();
    updateHud();
    return;
  }

  renderSentenceWithBlank(question.sentence);
  if (feedbackEl) feedbackEl.textContent = '';
  const order = activeOptionOrder[state.currentIndex] || [0, 1, 2];
  answerButtons.forEach((button, index) => {
    const option = question.options[order[index]];
    button.textContent = option || '';
    button.dataset.option = option || '';
    button.disabled = false;
    button.style.opacity = '1';
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
  const levelSelect = document.getElementById('level-select');
  const game = document.getElementById('game');

  game?.classList.add('panel--hidden');
  levelSelect?.classList.remove('panel--hidden');
  updateLeaderboardStats();
};

const checkMilestoneEasterEgg = (streak, score) => {
  if (streak === 10) {
    playSound('milestone');
    return ' 🌌 [Chronomancer: Unstoppable 10-Streak Master!]';
  }
  if (streak === 7) {
    playSound('milestone');
    return ' ⏳ [Time Lord: 7 Streak Achieved!]';
  }
  if (score === 42) {
    playSound('milestone');
    return ' ✨ [Easter Egg: 42 is the Answer to All Tenses!]';
  }
  return '';
};

const handleAnswer = (selectedOption) => {
  playSound('click');
  const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
  const gameCard = document.getElementById('game-card');
  const feedbackEl = document.getElementById('feedback');

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

  if (selectedOption === question.correct) {
    playSound('correct');
    const reward = addPoint();
    gameCard?.classList.add('game--correct');
    feedbackEl?.classList.add('feedback--success');
    const bonusText = reward.bonus ? ` including ${reward.bonus} bonus point` : '';
    const multText = reward.multiplier > 1 ? ` (${reward.multiplier}x Multiplier!)` : '';
    const milestoneEgg = checkMilestoneEasterEgg(reward.streak, getState().scores[state.currentLevel]);
    if (feedbackEl) {
      feedbackEl.textContent = `Correct! "${question.correct}" fits the sentence. +${pluralize(reward.earned, 'point')}${bonusText}${multText} (streak ${reward.streak}).${milestoneEgg}`;
    }
  } else {
    playSound('incorrect');
    resetStreak();
    gameCard?.classList.add('game--incorrect');
    feedbackEl?.classList.add('feedback--error');
    if (feedbackEl) {
      feedbackEl.textContent = `Not quite. The correct missing word is "${question.correct}".`;
    }
  }

  if (!state.speedRunActive) {
    // Persist progress for standard mode
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
  eventsController?.abort();
  stopSpeedRunTimer();
  const Controller = (typeof window !== 'undefined' && window.AbortController) || AbortController;
  eventsController = new Controller();
  const { signal } = eventsController;
  keyBuffer = '';
  footerClicks = 0;

  const welcomeModal = document.getElementById('welcome-modal');
  const startBtn = document.getElementById('start-btn');
  const levelSelect = document.getElementById('level-select');
  const levelButtons = Array.from(document.querySelectorAll('[data-level]'));
  const speedrunBtn = document.getElementById('speedrun-btn');
  const soundToggleBtn = document.getElementById('sound-toggle-btn');
  const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
  const changeLevelBtn = document.getElementById('change-level-btn');
  const resetScoresBtn = document.getElementById('reset-scores-btn');
  const replayBtn = document.getElementById('replay-btn');
  const feedbackEl = document.getElementById('feedback');
  const footer = document.querySelector('.modal__footer');

  startBtn?.addEventListener('click', () => {
    playSound('click');
    welcomeModal?.classList.remove('modal--visible');
    levelSelect?.classList.remove('panel--hidden');
    updateLeaderboardStats();
    levelButtons[0]?.focus();
  }, { signal });

  levelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      playSound('click');
      const level = button.dataset.level;
      buildActiveQuestions(level);
      setLevel(level);
      showGame();
    }, { signal });
  });

  speedrunBtn?.addEventListener('click', () => {
    playSound('click');
    startSpeedRunLoop();
  }, { signal });

  soundToggleBtn?.addEventListener('click', () => {
    toggleSound();
    playSound('click');
    updateHud();
  }, { signal });

  answerButtons.forEach((button) => {
    button.addEventListener('click', () => handleAnswer(button.dataset.option), { signal });
  });

  changeLevelBtn?.addEventListener('click', () => {
    playSound('click');
    cancelPendingAdvance();
    stopSpeedRunTimer();
    stopSpeedRun();
    resetIndex();
    showLevelSelect();
    if (feedbackEl) feedbackEl.textContent = '';
    levelButtons[0]?.focus();
  }, { signal });

  resetScoresBtn?.addEventListener('click', () => {
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
  }, { signal });

  replayBtn?.addEventListener('click', () => {
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
  }, { signal });

  // Easter Egg 1: 5x click on footer credit
  footer?.addEventListener('click', () => {
    footerClicks += 1;
    playSound('click');
    if (footerClicks >= 5) {
      playSound('milestone');
      footer.textContent = "🍎 Teacher Evan's Honor Roll: 'Time flies like an arrow; fruit flies like a banana!'";
      document.body.classList.add('easter--scholar');
    }
  }, { signal });

  // Easter Egg 2: Secret keyboard sequence ("tense" or "88mph")
  window.addEventListener('keydown', (event) => {
    if (typeof event.key !== 'string' || event.key.length !== 1) return;
    keyBuffer = (keyBuffer + event.key.toLowerCase()).slice(-8);
    if (SECRET_CODES.some((code) => keyBuffer.endsWith(code))) {
      keyBuffer = '';
      playSound('warp');
      document.body.classList.add('easter--chrono-warp');
      const currentFeedback = document.getElementById('feedback');
      if (currentFeedback) {
        currentFeedback.textContent = '⚡ 1.21 GIGAWATTS! Past, Present & Future timelines synchronized!';
      }
    }
  }, { signal });
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

document.addEventListener('DOMContentLoaded', init);

