const STORAGE_KEY = 'quizbuddy_scores_v1';
const MAX_STORAGE_BYTES = 5 * 1024;

const defaultScores = {
  easy: 0,
  medium: 0,
  advance: 0
};

const state = {
  currentLevel: 'easy',
  currentIndex: 0,
  scores: { ...defaultScores }
};

const safeParse = (rawValue) => {
  try {
    const parsed = JSON.parse(rawValue);
    if (
      parsed &&
      typeof parsed.easy === 'number' &&
      typeof parsed.medium === 'number' &&
      typeof parsed.advance === 'number'
    ) {
      return {
        easy: parsed.easy,
        medium: parsed.medium,
        advance: parsed.advance
      };
    }
  } catch {
    return { ...defaultScores };
  }
  return { ...defaultScores };
};

export const loadScores = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    state.scores = { ...defaultScores };
    return state.scores;
  }

  state.scores = safeParse(stored);
  return state.scores;
};

export const saveScores = () => {
  const payload = JSON.stringify(state.scores);
  if (payload.length > MAX_STORAGE_BYTES) {
    return false;
  }
  localStorage.setItem(STORAGE_KEY, payload);
  return true;
};

export const getState = () => ({
  currentLevel: state.currentLevel,
  currentIndex: state.currentIndex,
  scores: { ...state.scores }
});

export const setLevel = (level) => {
  state.currentLevel = level;
  state.currentIndex = 0;
};

export const incrementIndex = () => {
  state.currentIndex += 1;
};

export const resetIndex = () => {
  state.currentIndex = 0;
};

export const addPoint = () => {
  state.scores[state.currentLevel] += 1;
  saveScores();
};

export const resetScores = () => {
  state.scores = { ...defaultScores };
  saveScores();
};
