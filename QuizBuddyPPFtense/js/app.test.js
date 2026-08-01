import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('App interactivity', () => {
  beforeEach(() => {
    localStorage.clear();
    const htmlPath = resolve(__dirname, '../index.html');
    const html = readFileSync(htmlPath, 'utf8');
    document.body.innerHTML = html;

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  it('should move focus to change-level button when a level is completed', async () => {
    const { QUESTIONS } = await import('./data.js');
    await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));

    document.getElementById('start-btn').click();

    const easyBtn = document.querySelector('[data-level="easy"]');
    easyBtn.click();

    // Answer every question correctly. Order is shuffled, so derive the
    // correct option from the sentence currently on screen.
    const total = QUESTIONS.filter((q) => q.level === 'easy').length;
    for (let i = 0; i < total; i += 1) {
      answerCorrect(QUESTIONS);
      vi.runAllTimers();
    }

    // After the final answer, renderQuestion hits the "completed" branch
    // and should relocate focus off the now-disabled answer buttons.
    const changeLevelBtn = document.getElementById('change-level-btn');
    expect(document.activeElement).toBe(changeLevelBtn);
  });

  it('should disable answer buttons on click to prevent double submission', async () => {
    await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));

    const startBtn = document.getElementById('start-btn');
    startBtn.click();

    const easyBtn = document.querySelector('[data-level="easy"]');
    easyBtn.click();

    const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
    expect(answerButtons.length).toBeGreaterThan(0);
    expect(answerButtons[0].disabled).toBe(false);

    answerButtons[0].click();

    answerButtons.forEach((btn) => {
      expect(btn.disabled).toBe(true);
    });

    vi.runAllTimers();
  });

  it('cancels the pending advance timer when changing level mid-feedback', async () => {
    const { QUESTIONS } = await import('./data.js');
    await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));

    document.getElementById('start-btn').click();
    document.querySelector('[data-level="easy"]').click();

    // Answer the first easy question — this schedules an 850ms advance timer.
    answerCorrect(QUESTIONS);
    // Do NOT advance timers yet. Switch level before the pending timer fires.
    document.getElementById('change-level-btn').click();
    document.querySelector('[data-level="medium"]').click();

    // Flush any timers. If the stale easy timer were still live it would
    // incrementIndex on the medium level, skipping the first medium question
    // (which would then show medium question #2 instead of #1).
    vi.runAllTimers();

    const mediumSentences = QUESTIONS.filter((q) => q.level === 'medium').map((q) => q.sentence);
    expect(mediumSentences).toContain(document.getElementById('sentence').textContent);
  });

  it('shuffles question order on each level start', async () => {
    const { QUESTIONS } = await import('./data.js');
    const { __setRng } = await import('./app.js');
    await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));
    document.getElementById('start-btn').click();

    // Deterministic "ascending" RNG yields a known order; "descending" a
    // different one. Both must still cover the full easy question set.
    __setRng(() => 0.99); // j stays at i → order unchanged (reverse of identity)
    const order1 = readSentenceOrder(QUESTIONS, 'easy');
    __setRng(() => 0.01); // j collapses to 0 → heavily permuted
    const order2 = readSentenceOrder(QUESTIONS, 'easy');

    const easySentences = QUESTIONS.filter((q) => q.level === 'easy').map((q) => q.sentence);
    const sortedEasy = [...easySentences].sort();
    // Both runs must cover the same question set (set-equal), without
    // mutating the captured orders.
    expect([...order1].sort()).toEqual(sortedEasy);
    expect([...order2].sort()).toEqual(sortedEasy);
    expect(order1).not.toEqual(order2);
    expect(order1).toHaveLength(QUESTIONS.filter((q) => q.level === 'easy').length);
  });

  it('offers a visible replay button on level completion that restarts the level', async () => {
    const { QUESTIONS } = await import('./data.js');
    await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));
    document.getElementById('start-btn').click();
    document.querySelector('[data-level="easy"]').click();

    const total = QUESTIONS.filter((q) => q.level === 'easy').length;
    for (let i = 0; i < total; i += 1) {
      answerCorrect(QUESTIONS);
      vi.runAllTimers();
    }

    const replayBtn = document.getElementById('replay-btn');
    expect(replayBtn.classList.contains('panel--hidden')).toBe(false);

    // Clicking replay restarts the same level at the first question (any
    // valid easy sentence — order is shuffled).
    replayBtn.click();
    const easySentences = QUESTIONS.filter((q) => q.level === 'easy').map((q) => q.sentence);
    expect(easySentences).toContain(document.getElementById('sentence').textContent);
  });
});

// Answer the question currently on screen with its correct option.
// Looks the question up by the visible sentence so it works regardless of
// the shuffled question/option order.
const answerCorrect = (QUESTIONS) => {
  const sentence = document.getElementById('sentence').textContent;
  const question = QUESTIONS.find((q) => q.sentence === sentence);
  const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
  answerButtons.find((btn) => btn.textContent === question.correct).click();
};

const readSentenceOrder = (QUESTIONS, level) => {
  // Restart the level and capture the question order by reading the sentence
  // on screen, answering each correctly, flushing timers between answers.
  document.getElementById('change-level-btn').click();
  document.querySelector(`[data-level="${level}"]`).click();
  const total = QUESTIONS.filter((q) => q.level === level).length;
  const order = [];
  for (let i = 0; i < total; i += 1) {
    order.push(document.getElementById('sentence').textContent);
    answerCorrect(QUESTIONS);
    vi.runAllTimers();
  }
  return order;
};
