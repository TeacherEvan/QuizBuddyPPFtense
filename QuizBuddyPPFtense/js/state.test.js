import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getState, setLevel, incrementIndex, addPoint, resetScores, setProgress, loadScores } from './state.js';

describe('state management', () => {
  beforeEach(() => {
    resetScores();
    setLevel('easy');
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
    setLevel('medium');
    incrementIndex();
    expect(getState().currentIndex).toBe(1);

    setLevel('advance');
    const state = getState();
    expect(state.currentLevel).toBe('advance');
    expect(state.currentIndex).toBe(0);
  });

  it('should add points and handle streaks', () => {
    const result = addPoint();
    expect(result.earned).toBe(1);
    expect(result.streak).toBe(1);
    expect(result.bonus).toBe(0);

    // Test streak bonus after 3 correct answers
    addPoint();
    const result3 = addPoint();
    expect(result3.streak).toBe(3);
    expect(result3.bonus).toBe(1);
    expect(result3.earned).toBe(2);

    expect(getState().scores.easy).toBe(4); // 1 + 1 + (1 + 1) = 4
  });

  it('should handle localStorage quota exceeded or disabled gracefully', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded');
    });

    expect(() => addPoint()).not.toThrow();

    spy.mockRestore();
  });
});

describe('per-level progress persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('resumes at the persisted progress index for a level on reload', () => {
    setProgress('easy', 5);
    // Simulate a page reload: loadScores restores the saved level + index.
    loadScores();
    expect(getState().currentLevel).toBe('easy');
    expect(getState().currentIndex).toBe(5);
  });

  it('clamps negative progress to 0', () => {
    setProgress('medium', -3);
    expect(getState().progress.medium).toBe(0);
  });

  it('resetScores zeroes progress for all levels', () => {
    setProgress('easy', 4);
    setProgress('advance', 2);
    resetScores();
    const { progress } = getState();
    expect(progress).toEqual({ easy: 0, medium: 0, advance: 0 });
  });

  it('safeParse falls back to default progress on malformed storage', () => {
    localStorage.setItem('quizbuddy_scores_v1', 'not json');
    loadScores();
    expect(getState().progress).toEqual({ easy: 0, medium: 0, advance: 0 });
  });
});
