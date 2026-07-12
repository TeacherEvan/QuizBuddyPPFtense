import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getState, setLevel, incrementIndex, addPoint, resetScores } from './state.js';

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
