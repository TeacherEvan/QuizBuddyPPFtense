import { describe, it, expect } from 'vitest';
import { QUESTIONS } from './data.js';

const LEVELS = ['easy', 'medium', 'advance'];
const byLevel = (lvl) => QUESTIONS.filter((q) => q.level === lvl);

describe('QUESTIONS data integrity', () => {
  it('has 90 questions total (40 easy / 30 medium / 20 advance)', () => {
    expect(QUESTIONS).toHaveLength(90);
    expect(byLevel('easy')).toHaveLength(40);
    expect(byLevel('medium')).toHaveLength(30);
    expect(byLevel('advance')).toHaveLength(20);
  });

  it('every question has the required shape and valid missing token', () => {
    for (const q of QUESTIONS) {
      expect(typeof q.sentence).toBe('string');
      expect(q.sentence.includes('___')).toBe(true);
      expect(Array.isArray(q.options)).toBe(true);
      expect(q.options).toHaveLength(3);
      expect(q.options.every((o) => typeof o === 'string' && o.trim().length > 0)).toBe(true);
      expect(typeof q.correct).toBe('string');
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
