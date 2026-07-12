const STORAGE_KEY = 'quizbuddy_scores_v1';

const defaultScores = {
  easy: 0,
  medium: 0,
  advance: 0
};

const state = {
  currentLevel: 'easy',
  currentIndex: 0,
  currentStreak: 0,
  bestStreak: 0,
  scores: { ...defaultScores }
};

const safeParse = (rawValue) => {
  try {
    const parsed = JSON.parse(rawValue);
    if (
      parsed &&
      parsed.scores &&
      typeof parsed.scores.easy === 'number' &&
      typeof parsed.scores.medium === 'number' &&
      typeof parsed.scores.advance === 'number'
    ) {
      return {
        scores: {
          easy: parsed.scores.easy,
          medium: parsed.scores.medium,
          advance: parsed.scores.advance
        },
        bestStreak: typeof parsed.bestStreak === 'number' ? parsed.bestStreak : 0
      };
    }
  } catch {
    // malformed JSON — fall through to default below
  }
  return {
    scores: { ...defaultScores },
    bestStreak: 0
  };
};

export const loadScores = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    state.scores = { ...defaultScores };
    state.currentStreak = 0;
    state.bestStreak = 0;
    return state.scores;
  }

  const parsed = safeParse(stored);
  state.scores = parsed.scores;
  state.currentStreak = 0;
  state.bestStreak = parsed.bestStreak;
  return state.scores;
};

export const saveScores = () => {
  const payload = JSON.stringify({
    scores: state.scores,
    bestStreak: state.bestStreak
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
  scores: { ...state.scores }
});

export const setLevel = (level) => {
  state.currentLevel = level;
  resetIndex();
};

export const incrementIndex = () => {
  state.currentIndex += 1;
};

export const resetIndex = () => {
  state.currentIndex = 0;
};

export const addPoint = () => {
  state.currentStreak += 1;
  state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
  const bonus = state.currentStreak % 3 === 0 ? 1 : 0;
  const earned = 1 + bonus;
  state.scores[state.currentLevel] += earned;
  saveScores();
  return {
    earned,
    streak: state.currentStreak,
    bonus
  };
};

export const resetStreak = () => {
  state.currentStreak = 0;
};

export const resetScores = () => {
  state.scores = { ...defaultScores };
  state.currentStreak = 0;
  state.bestStreak = 0;
  saveScores();
};
