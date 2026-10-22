import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getState,
  setLevel,
  incrementIndex,
  addPoint,
  resetScores,
  setProgress,
  loadScores,
  resetIndex,
  recordMistake,
  resolveMistake,
  clearMistakes,
  startReviewMode,
  exitReviewMode,
  setCategoryFilter,
  setHighContrast,
  toggleHighContrast,
  setSoundTheme,
  setVolume
} from './state.js';

describe('state management', () => {
  beforeEach(() => {
    resetScores();
    setLevel('easy');
    localStorage.clear();
  });

  it('should get initial state', () => {
    const state = getState();
    expect(state.currentLevel).toBe('easy');
    expect(state.currentIndex).toBe(0);
    expect(state.currentStreak).toBe(0);
    expect(state.bestStreak).toBe(0);
    expect(state.scores.easy).toBe(0);
  });

  it('should change level and reset index', () => {
    incrementIndex();
    expect(getState().currentIndex).toBe(1);
    setLevel('medium');
    expect(getState().currentLevel).toBe('medium');
    expect(getState().currentIndex).toBe(0);
  });

  it('should add points and handle streaks', () => {
    expect(addPoint()).toEqual({ earned: 1, streak: 1, bonus: 0, multiplier: 1 });
    expect(addPoint()).toEqual({ earned: 1, streak: 2, bonus: 0, multiplier: 1 });
    expect(addPoint()).toEqual({ earned: 2, streak: 3, bonus: 1, multiplier: 1 });
    expect(getState().scores.easy).toBe(4);
    expect(getState().currentStreak).toBe(3);
    expect(getState().bestStreak).toBe(3);
  });

  it('should handle localStorage quota exceeded or disabled gracefully', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError', 'QuotaExceededError');
    });

    expect(() => addPoint()).not.toThrow();
    expect(getState().scores.easy).toBe(1);

    spy.mockRestore();
  });

  it('should handle localStorage.getItem throwing SecurityError gracefully', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    expect(() => loadScores()).not.toThrow();
    const state = getState();
    expect(state.currentLevel).toBe('easy');
    expect(state.scores.easy).toBe(0);

    spy.mockRestore();
  });
});

describe('per-level progress persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    resetScores();
  });

  it('resumes at the persisted progress index for a level on reload', () => {
    setLevel('easy');
    setProgress('easy', 3);
    expect(getState().progress.easy).toBe(3);

    loadScores();
    expect(getState().currentIndex).toBe(3);
    expect(getState().currentLevel).toBe('easy');
  });

  it('clamps negative progress to 0', () => {
    setProgress('medium', -5);
    expect(getState().progress.medium).toBe(0);
  });

  it('ignores NaN or non-finite progress values', () => {
    setProgress('advance', NaN);
    expect(getState().progress.advance).toBe(0);
    setProgress('advance', Infinity);
    expect(getState().progress.advance).toBe(0);
  });

  it('resetIndex zeroes progress for current level and persists to storage', () => {
    setLevel('medium');
    setProgress('medium', 4);
    expect(getState().progress.medium).toBe(4);
    resetIndex();
    expect(getState().currentIndex).toBe(0);
    expect(getState().progress.medium).toBe(0);
    loadScores();
    expect(getState().progress.medium).toBe(0);
  });

  it('resetScores zeroes progress for all levels', () => {
    setProgress('easy', 4);
    setProgress('advance', 2);
    resetScores();
    const { progress } = getState();
    expect(progress).toEqual({ easy: 0, medium: 0, advance: 0 });
  });

  it('safeParse falls back to default progress on malformed storage or non-integer scores', () => {
    localStorage.setItem('quizbuddy_scores_v1', 'not json');
    loadScores();
    expect(getState().progress).toEqual({ easy: 0, medium: 0, advance: 0 });

    localStorage.setItem('quizbuddy_scores_v1', JSON.stringify({ scores: { easy: 'NaN', medium: null, advance: -1 } }));
    loadScores();
    expect(getState().scores).toEqual({ easy: 0, medium: 0, advance: 0 });
  });

  it('tracks and persists best streaks per level and globally', () => {
    setLevel('easy');
    addPoint();
    addPoint();
    expect(getState().bestStreaks.easy).toBe(2);
    expect(getState().bestStreak).toBe(2);

    setLevel('medium');
    addPoint();
    expect(getState().bestStreaks.medium).toBe(1);
    expect(getState().bestStreaks.easy).toBe(2);
    expect(getState().bestStreak).toBe(2);

    loadScores();
    expect(getState().bestStreaks.easy).toBe(2);
    expect(getState().bestStreaks.medium).toBe(1);
  });
});

describe('mistake tracking, review mode, categories and accessibility state', () => {
  beforeEach(() => {
    localStorage.clear();
    resetScores();
  });

  it('records mistakes and deduplicates by sentence', () => {
    const q1 = {
      id: 'q_1',
      sentence: 'I ___ to school every day.',
      options: ['walk', 'walked', 'will walk'],
      correct: 'walk',
      level: 'easy'
    };
    recordMistake(q1);
    expect(getState().mistakes).toHaveLength(1);
    expect(getState().mistakes[0].sentence).toBe(q1.sentence);

    // duplicate recording ignored
    recordMistake(q1);
    expect(getState().mistakes).toHaveLength(1);

    // persists and loads
    loadScores();
    expect(getState().mistakes).toHaveLength(1);
  });

  it('rejects poisoned mistakes missing options or correct answer without throwing', () => {
    localStorage.setItem(
      'quizbuddy_scores_v1',
      JSON.stringify({
        scores: { easy: 0, medium: 0, advance: 0 },
        mistakes: [
          { id: 'poison1', sentence: 'Missing options' },
          { id: 'poison2', sentence: 'Empty options', options: [], correct: 'a' },
          { id: 'poison3', sentence: 'Invalid correct', options: ['a', 'b', 'c'], correct: '' },
          { id: 'good', sentence: 'Valid', options: ['a', 'b', 'c'], correct: 'a' }
        ]
      })
    );
    expect(() => loadScores()).not.toThrow();
    expect(getState().mistakes).toHaveLength(1);
    expect(getState().mistakes[0].sentence).toBe('Valid');
  });

  it('resolves mistake when answered correctly', () => {
    const q1 = { sentence: 'Sentence A', options: ['a', 'b'], correct: 'a' };
    const q2 = { sentence: 'Sentence B', options: ['c', 'd'], correct: 'c' };
    recordMistake(q1);
    recordMistake(q2);
    expect(getState().mistakes).toHaveLength(2);

    resolveMistake('Sentence A');
    expect(getState().mistakes).toHaveLength(1);
    expect(getState().mistakes[0].sentence).toBe('Sentence B');

    clearMistakes();
    expect(getState().mistakes).toHaveLength(0);
  });

  it('launches review mode only when mistakes exist', () => {
    expect(startReviewMode()).toBe(false);
    expect(getState().reviewMode).toBe(false);

    recordMistake({ sentence: 'Err 1', options: ['1'], correct: '1' });
    expect(startReviewMode()).toBe(true);
    expect(getState().reviewMode).toBe(true);

    exitReviewMode();
    expect(getState().reviewMode).toBe(false);
  });

  it('handles category filtering', () => {
    setCategoryFilter('past');
    expect(getState().activeCategoryFilter).toBe('past');
    setCategoryFilter('invalid');
    expect(getState().activeCategoryFilter).toBe('past');
    setCategoryFilter('all');
    expect(getState().activeCategoryFilter).toBe('all');
  });

  it('toggles high contrast mode and persists', () => {
    expect(getState().highContrast).toBe(false);
    toggleHighContrast();
    expect(getState().highContrast).toBe(true);
    loadScores();
    expect(getState().highContrast).toBe(true);

    setHighContrast(false);
    expect(getState().highContrast).toBe(false);
  });

  it('configures sound theme and volume with bounds', () => {
    setSoundTheme('8bit');
    expect(getState().soundTheme).toBe('8bit');
    setSoundTheme('invalid');
    expect(getState().soundTheme).toBe('8bit');

    setVolume(0.5);
    expect(getState().volume).toBe(0.5);
    setVolume(1.8);
    expect(getState().volume).toBe(1);
    setVolume(-0.2);
    expect(getState().volume).toBe(0);
  });
});
