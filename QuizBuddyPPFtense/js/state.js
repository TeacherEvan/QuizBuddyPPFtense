const STORAGE_KEY = 'quizbuddy_scores_v1';

const defaultScores = {
  easy: 0,
  medium: 0,
  advance: 0
};

const defaultProgress = {
  easy: 0,
  medium: 0,
  advance: 0
};

const defaultBestStreaks = {
  easy: 0,
  medium: 0,
  advance: 0
};

const LEVELS = ['easy', 'medium', 'advance'];
const VALID_CATEGORIES = ['all', 'past', 'present', 'future'];
const VALID_THEMES = ['neo', '8bit'];

const state = {
  currentLevel: 'easy',
  currentIndex: 0,
  currentStreak: 0,
  bestStreak: 0,
  bestStreaks: { ...defaultBestStreaks },
  speedRunActive: false,
  speedRunTimeLeft: 60,
  speedRunScore: 0,
  scores: { ...defaultScores },
  progress: { ...defaultProgress },
  mistakes: [],
  reviewMode: false,
  activeCategoryFilter: 'all',
  highContrast: false,
  soundTheme: 'neo',
  volume: 0.8
};

const isNonNegInt = (n) => typeof n === 'number' && Number.isInteger(n) && n >= 0;

const safeParse = (rawValue) => {
  try {
    const parsed = JSON.parse(rawValue);
    if (parsed && parsed.scores && LEVELS.every((lvl) => isNonNegInt(parsed.scores[lvl]))) {
      const progress =
        parsed.progress && LEVELS.every((lvl) => isNonNegInt(parsed.progress[lvl]))
          ? {
              easy: parsed.progress.easy,
              medium: parsed.progress.medium,
              advance: parsed.progress.advance
            }
          : { ...defaultProgress };

      const bestStreaks =
        parsed.bestStreaks && LEVELS.every((lvl) => isNonNegInt(parsed.bestStreaks[lvl]))
          ? {
              easy: parsed.bestStreaks.easy,
              medium: parsed.bestStreaks.medium,
              advance: parsed.bestStreaks.advance
            }
          : {
              easy: isNonNegInt(parsed.bestStreak) ? parsed.bestStreak : 0,
              medium: 0,
              advance: 0
            };

      const currentLevel = LEVELS.includes(parsed.currentLevel) ? parsed.currentLevel : 'easy';
      const globalBest = isNonNegInt(parsed.bestStreak)
        ? parsed.bestStreak
        : Math.max(bestStreaks.easy, bestStreaks.medium, bestStreaks.advance);

      const mistakes = Array.isArray(parsed.mistakes)
        ? parsed.mistakes.filter((m) => m && typeof m.id === 'string' && typeof m.sentence === 'string')
        : [];

      const activeCategoryFilter = VALID_CATEGORIES.includes(parsed.activeCategoryFilter)
        ? parsed.activeCategoryFilter
        : 'all';

      const highContrast = Boolean(parsed.highContrast);
      const soundTheme = VALID_THEMES.includes(parsed.soundTheme) ? parsed.soundTheme : 'neo';
      const volume =
        typeof parsed.volume === 'number' && parsed.volume >= 0 && parsed.volume <= 1 ? parsed.volume : 0.8;

      return {
        scores: {
          easy: parsed.scores.easy,
          medium: parsed.scores.medium,
          advance: parsed.scores.advance
        },
        bestStreak: globalBest,
        bestStreaks,
        progress,
        currentLevel,
        mistakes,
        activeCategoryFilter,
        highContrast,
        soundTheme,
        volume
      };
    }
  } catch {
    // malformed JSON — fall through to default below
  }
  return {
    scores: { ...defaultScores },
    bestStreak: 0,
    bestStreaks: { ...defaultBestStreaks },
    progress: { ...defaultProgress },
    currentLevel: 'easy',
    mistakes: [],
    activeCategoryFilter: 'all',
    highContrast: false,
    soundTheme: 'neo',
    volume: 0.8
  };
};

export const loadScores = () => {
  let stored = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // storage full / disabled (private mode or sandbox) — scores stay in memory
  }
  if (!stored) {
    state.scores = { ...defaultScores };
    state.progress = { ...defaultProgress };
    state.currentLevel = 'easy';
    state.currentIndex = 0;
    state.currentStreak = 0;
    state.bestStreak = 0;
    state.mistakes = [];
    state.reviewMode = false;
    state.activeCategoryFilter = 'all';
    state.highContrast = false;
    state.soundTheme = 'neo';
    state.volume = 0.8;
    return state.scores;
  }

  const parsed = safeParse(stored);
  state.scores = parsed.scores;
  state.progress = parsed.progress;
  state.bestStreaks = parsed.bestStreaks;
  state.currentLevel = parsed.currentLevel;
  // Resume at the saved question for the saved level (page reload behaviour).
  state.currentIndex = Math.max(0, state.progress[state.currentLevel] ?? 0);
  state.currentStreak = 0;
  state.bestStreak = parsed.bestStreak;
  state.mistakes = parsed.mistakes;
  state.reviewMode = false;
  state.activeCategoryFilter = parsed.activeCategoryFilter;
  state.highContrast = parsed.highContrast;
  state.soundTheme = parsed.soundTheme;
  state.volume = parsed.volume;
  return state.scores;
};

export const saveScores = () => {
  const payload = JSON.stringify({
    scores: state.scores,
    bestStreak: state.bestStreak,
    bestStreaks: state.bestStreaks,
    progress: state.progress,
    currentLevel: state.currentLevel,
    mistakes: state.mistakes,
    activeCategoryFilter: state.activeCategoryFilter,
    highContrast: state.highContrast,
    soundTheme: state.soundTheme,
    volume: state.volume
  });
  try {
    localStorage.setItem(STORAGE_KEY, payload);
  } catch {
    // storage full / disabled (private mode) — scores stay in memory
  }
};

export const getState = () => ({
  currentLevel: state.currentLevel,
  currentIndex: state.currentIndex,
  currentStreak: state.currentStreak,
  bestStreak: state.bestStreak,
  bestStreaks: { ...state.bestStreaks },
  speedRunActive: state.speedRunActive,
  speedRunTimeLeft: state.speedRunTimeLeft,
  speedRunScore: state.speedRunScore,
  scores: { ...state.scores },
  progress: { ...state.progress },
  mistakes: [...state.mistakes],
  reviewMode: state.reviewMode,
  activeCategoryFilter: state.activeCategoryFilter,
  highContrast: state.highContrast,
  soundTheme: state.soundTheme,
  volume: state.volume
});

export const setLevel = (level) => {
  if (!LEVELS.includes(level)) return;
  state.currentLevel = level;
  state.reviewMode = false;
  // Explicit level selection re-practices the level from the beginning.
  state.currentIndex = 0;
  state.currentStreak = 0;
  state.progress[level] = 0;
  saveScores();
};

export const incrementIndex = () => {
  state.currentIndex += 1;
};

export const resetIndex = () => {
  state.currentIndex = 0;
  state.progress[state.currentLevel] = 0;
  saveScores();
};

export const setProgress = (level, index) => {
  if (!LEVELS.includes(level) || !Number.isFinite(index)) return;
  state.progress[level] = Math.max(0, Math.floor(index));
  saveScores();
};

export const addPoint = () => {
  state.currentStreak += 1;
  const currentLvl = state.currentLevel;
  if (!state.bestStreaks[currentLvl]) {
    state.bestStreaks[currentLvl] = 0;
  }
  state.bestStreaks[currentLvl] = Math.max(state.bestStreaks[currentLvl], state.currentStreak);
  state.bestStreak = Math.max(state.bestStreak, state.currentStreak);

  const bonus = state.currentStreak % 3 === 0 ? 1 : 0;
  const multiplier = state.speedRunActive ? (state.currentStreak >= 5 ? 3 : state.currentStreak >= 3 ? 2 : 1) : 1;
  const earned = (1 + bonus) * multiplier;

  if (state.speedRunActive) {
    state.speedRunScore += earned;
  }
  state.scores[state.currentLevel] += earned;
  saveScores();
  return {
    earned,
    streak: state.currentStreak,
    bonus,
    multiplier
  };
};

export const resetStreak = () => {
  state.currentStreak = 0;
};

export const startSpeedRun = () => {
  state.speedRunActive = true;
  state.speedRunTimeLeft = 60;
  state.speedRunScore = 0;
  state.currentStreak = 0;
  state.currentIndex = 0;
  state.reviewMode = false;
};

export const decrementSpeedRunTimer = () => {
  if (!state.speedRunActive) return 0;
  state.speedRunTimeLeft = Math.max(0, state.speedRunTimeLeft - 1);
  if (state.speedRunTimeLeft === 0) {
    state.speedRunActive = false;
  }
  return state.speedRunTimeLeft;
};

export const stopSpeedRun = () => {
  state.speedRunActive = false;
  return state.speedRunScore;
};

export const recordMistake = (question) => {
  if (!question || !question.sentence) return;
  const exists = state.mistakes.some((m) => m.sentence === question.sentence);
  if (!exists) {
    state.mistakes.push({
      id: question.id || `q_${Date.now()}`,
      sentence: question.sentence,
      options: [...question.options],
      correct: question.correct,
      level: question.level || state.currentLevel,
      tenseCategory: question.tenseCategory || 'present',
      explanation: question.explanation || ''
    });
    saveScores();
  }
};

export const resolveMistake = (sentence) => {
  const initialLen = state.mistakes.length;
  state.mistakes = state.mistakes.filter((m) => m.sentence !== sentence);
  if (state.mistakes.length !== initialLen) {
    saveScores();
  }
};

export const clearMistakes = () => {
  state.mistakes = [];
  saveScores();
};

export const startReviewMode = () => {
  if (state.mistakes.length === 0) return false;
  state.reviewMode = true;
  state.speedRunActive = false;
  state.currentIndex = 0;
  state.currentStreak = 0;
  return true;
};

export const exitReviewMode = () => {
  state.reviewMode = false;
  state.currentIndex = 0;
};

export const setCategoryFilter = (category) => {
  if (!VALID_CATEGORIES.includes(category)) return;
  state.activeCategoryFilter = category;
  state.currentIndex = 0;
  saveScores();
};

export const setHighContrast = (enabled) => {
  state.highContrast = Boolean(enabled);
  saveScores();
};

export const toggleHighContrast = () => {
  state.highContrast = !state.highContrast;
  saveScores();
  return state.highContrast;
};

export const setSoundTheme = (theme) => {
  if (!VALID_THEMES.includes(theme)) return;
  state.soundTheme = theme;
  saveScores();
};

export const setVolume = (val) => {
  if (typeof val !== 'number' || Number.isNaN(val)) return;
  state.volume = Math.max(0, Math.min(1, val));
  saveScores();
};

export const resetScores = () => {
  state.scores = { ...defaultScores };
  state.progress = { ...defaultProgress };
  state.bestStreaks = { ...defaultBestStreaks };
  state.currentStreak = 0;
  state.bestStreak = 0;
  state.currentIndex = 0;
  state.speedRunActive = false;
  state.speedRunTimeLeft = 60;
  state.speedRunScore = 0;
  state.mistakes = [];
  state.reviewMode = false;
  state.activeCategoryFilter = 'all';
  saveScores();
};
