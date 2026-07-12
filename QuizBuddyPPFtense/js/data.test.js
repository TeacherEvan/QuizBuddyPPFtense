import { describe, it, expect } from 'vitest';
import { QUESTIONS } from './data.js';

const LEVELS = ['easy', 'medium', 'advance'];
const byLevel = (lvl) => QUESTIONS.filter((q) => q.level === lvl);

describe('QUESTIONS data integrity', () => {
  it('has 60 questions total (30 easy / 20 medium / 10 advance)', () => {
    expect(QUESTIONS).toHaveLength(60);
    expect(byLevel('easy')).toHaveLength(30);
    expect(byLevel('medium')).toHaveLength(20);
    expect(byLevel('advance')).toHaveLength(10);
  });

  it('every question has the required shape', () => {
    for (const q of QUESTIONS) {
      expect(typeof q.sentence).toBe('string');
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options).toHaveLength(3);
      expect(typeof q.correct).toBe('string');
      expect(typeof q.tense).toBe('string');
      expect(LEVELS).toContain(q.level);
    }
  });

  it('correct is always one of the options', () => {
    for (const q of QUESTIONS) {
      expect(q.options).toContain(q.correct);
    }
  });

  it('options are unique within a question', () => {
    for (const q of QUESTIONS) {
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });

  it('no duplicate sentence within a level', () => {
    for (const lvl of LEVELS) {
      const sentences = byLevel(lvl).map((q) => q.sentence);
      expect(new Set(sentences).size).toBe(sentences.length);
    }
  });
});
