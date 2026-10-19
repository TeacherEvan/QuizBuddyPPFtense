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
  progress: { ...defaultProgress }
};

const isNonNegInt = (n) => typeof n === 'number' && Number.isInteger(n) && n >= 0;

const safeParse = (rawValue) => {
  try {
    const parsed = JSON.parse(rawValue);
    if (
      parsed &&
      parsed.scores &&
      LEVELS.every((lvl) => isNonNegInt(parsed.scores[lvl]))
    ) {
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

      return {
        scores: {
          easy: parsed.scores.easy,
          medium: parsed.scores.medium,
          advance: parsed.scores.advance
        },
        bestStreak: globalBest,
        bestStreaks,
        progress,
        currentLevel
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
    currentLevel: 'easy'
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
  return state.scores;
};

export const saveScores = () => {
  const payload = JSON.stringify({
    scores: state.scores,
    bestStreak: state.bestStreak,
    bestStreaks: state.bestStreaks,
    progress: state.progress,
    currentLevel: state.currentLevel
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
  progress: { ...state.progress }
});

export const setLevel = (level) => {
  if (!LEVELS.includes(level)) return;
  state.currentLevel = level;
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
  saveScores();
};
