import { QUESTIONS } from './data.js';
import {
  addPoint,
  getState,
  incrementIndex,
  loadScores,
  resetIndex,
  resetScores,
  resetStreak,
  setLevel
} from './state.js';
const LEVEL_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  advance: 'Advance'
};

const getQuestionsForCurrentLevel = () => {
  const { currentLevel } = getState();
  return QUESTIONS.filter((question) => question.level === currentLevel);
};

const welcomeModal = document.getElementById('welcome-modal');
const startBtn = document.getElementById('start-btn');
const levelSelect = document.getElementById('level-select');
const levelButtons = Array.from(document.querySelectorAll('[data-level]'));
const game = document.getElementById('game');
const gameCard = document.getElementById('game-card');
const sentenceEl = document.getElementById('sentence');
const feedbackEl = document.getElementById('feedback');
const levelLabelEl = document.getElementById('level-label');
const questionCounterEl = document.getElementById('question-counter');
const scoreCounterEl = document.getElementById('score-counter');
const streakCounterEl = document.getElementById('streak-counter');
const bestStreakCounterEl = document.getElementById('best-streak-counter');
const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
const changeLevelBtn = document.getElementById('change-level-btn');
const resetScoresBtn = document.getElementById('reset-scores-btn');
const pluralize = (count, singular) => `${count} ${singular}${count === 1 ? '' : 's'}`;

// Handle for the deferred question-advance timer so it can be cancelled if the
// user navigates away (change level / reset) before it fires. Without this, a
// pending advance would silently skip the first question of the new level.
let pendingAdvanceTimer = null;

const cancelPendingAdvance = () => {
  if (pendingAdvanceTimer !== null) {
    window.clearTimeout(pendingAdvanceTimer);
    pendingAdvanceTimer = null;
  }
};

const updateHud = () => {
  const state = getState();
  const questions = getQuestionsForCurrentLevel();
  const displayIndex = Math.min(state.currentIndex + 1, questions.length);

  levelLabelEl.textContent = `Level: ${LEVEL_LABELS[state.currentLevel]}`;
  questionCounterEl.textContent = `Question: ${displayIndex}/${questions.length}`;
  scoreCounterEl.textContent = `Score: ${state.scores[state.currentLevel]}`;
  streakCounterEl.textContent = `Streak: ${state.currentStreak}`;
  bestStreakCounterEl.textContent = `Best Streak: ${state.bestStreak}`;
};

const clearFeedbackState = () => {
  gameCard.classList.remove('game--correct', 'game--incorrect');
  feedbackEl.classList.remove('feedback--success', 'feedback--error');
};

const renderQuestion = () => {
  clearFeedbackState();

  const state = getState();
  const questions = getQuestionsForCurrentLevel();
  const question = questions[state.currentIndex];

  if (!question) {
    sentenceEl.textContent = `Great work! You completed the ${LEVEL_LABELS[state.currentLevel]} level.`;
    feedbackEl.textContent = 'Pick another level or reset your scores to continue practicing.';
    answerButtons.forEach((button) => {
      button.disabled = true;
      button.style.opacity = '0.65';
    });
    // Move focus to the change-level control so keyboard / screen-reader
    // users are not stranded on a now-disabled answer button.
    changeLevelBtn?.focus();
    updateHud();
    return;
  }

  sentenceEl.textContent = question.sentence;
  feedbackEl.textContent = '';
  answerButtons.forEach((button, index) => {
    const option = question.options[index];
    button.textContent = option || '';
    button.dataset.option = option || '';
    button.disabled = false;
    button.style.opacity = '1';
  });

  updateHud();
};

const showGame = () => {
  levelSelect.classList.add('panel--hidden');
  game.classList.remove('panel--hidden');
  renderQuestion();
  // Move focus to the first answer button for screen‑reader users
  answerButtons[0]?.focus();
};

const showLevelSelect = () => {
  game.classList.add('panel--hidden');
  levelSelect.classList.remove('panel--hidden');
};

const handleAnswer = (selectedOption) => {
  answerButtons.forEach((button) => {
    button.disabled = true;
  });
  const state = getState();
  const questions = getQuestionsForCurrentLevel();
  const question = questions[state.currentIndex];

  if (!question) {
    return;
  }

  clearFeedbackState();

  if (selectedOption === question.correct) {
    const reward = addPoint();
    gameCard.classList.add('game--correct');
    feedbackEl.classList.add('feedback--success');
    const bonusText = reward.bonus ? ` including ${reward.bonus} bonus point` : '';
    feedbackEl.textContent = `Correct! "${question.correct}" fits the sentence. +${pluralize(reward.earned, 'point')}${bonusText} (streak ${reward.streak}).`;
  } else {
    resetStreak();
    gameCard.classList.add('game--incorrect');
    feedbackEl.classList.add('feedback--error');
    feedbackEl.textContent = `Not quite. The correct missing word is "${question.correct}".`;
  }

  pendingAdvanceTimer = window.setTimeout(() => {
    pendingAdvanceTimer = null;
    incrementIndex();
    renderQuestion();
  }, 850);
};

const setupEvents = () => {
  startBtn.addEventListener('click', () => {
    welcomeModal.classList.remove('modal--visible');
    levelSelect.classList.remove('panel--hidden');
    levelButtons[0]?.focus();
  });

  levelButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const level = button.dataset.level;
      setLevel(level);
      showGame();
    });
  });

  answerButtons.forEach((button) => {
    button.addEventListener('click', () => handleAnswer(button.dataset.option));
  });

  changeLevelBtn.addEventListener('click', () => {
    cancelPendingAdvance();
    resetIndex();
    showLevelSelect();
    feedbackEl.textContent = '';
    // Return focus to the first level button
    levelButtons[0]?.focus();
  });

  resetScoresBtn.addEventListener('click', () => {
    cancelPendingAdvance();
    resetScores();
    updateHud();
    feedbackEl.textContent = 'Scores have been reset.';
    feedbackEl.classList.remove('feedback--error');
    feedbackEl.classList.add('feedback--success');
  });
};

const init = () => {
  loadScores();
  setupEvents();
  updateHud();
};

document.addEventListener('DOMContentLoaded', init);
