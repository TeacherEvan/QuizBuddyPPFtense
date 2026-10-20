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

  it('handles incorrect answers with error feedback and resets streak', async () => {
    const { QUESTIONS } = await import('./data.js');
    const { getState } = await import('./state.js');
    await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));
    document.getElementById('start-btn').click();
    document.querySelector('[data-level="easy"]').click();

    // Answer first question correctly to build a streak
    answerCorrect(QUESTIONS);
    vi.runAllTimers();
    expect(getState().currentStreak).toBe(1);

    // Answer second question incorrectly
    answerIncorrect(QUESTIONS);
    expect(getState().currentStreak).toBe(0);
    expect(document.getElementById('game-card').classList.contains('game--incorrect')).toBe(true);
    expect(document.getElementById('feedback').classList.contains('feedback--error')).toBe(true);
    expect(document.getElementById('feedback').textContent).toContain('Not quite');

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

  it('resetScoresBtn re-renders question and enables answer buttons without soft-lock', async () => {
    const { QUESTIONS } = await import('./data.js');
    const { getState } = await import('./state.js');
    await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));
    document.getElementById('start-btn').click();
    document.querySelector('[data-level="easy"]').click();

    // Answer first question, buttons get disabled immediately
    answerCorrect(QUESTIONS);
    const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
    expect(answerButtons[0].disabled).toBe(true);

    // Click reset scores while timer is pending
    document.getElementById('reset-scores-btn').click();
    expect(getState().currentIndex).toBe(0);
    expect(getState().scores.easy).toBe(0);

    // Answer buttons must now be re-enabled and feedback updated
    expect(answerButtons[0].disabled).toBe(false);
    expect(document.getElementById('feedback').textContent).toBe('Scores have been reset.');
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

  it('resumes the saved in-progress level on reload (init enters the game)', async () => {
    const { setProgress, getState } = await import('./state.js');
    await import('./app.js');

    // Persist progress like a previous session would have left behind.
    setProgress('easy', 3);

    document.dispatchEvent(new Event('DOMContentLoaded'));

    // init() must detect saved progress and enter the game directly,
    // instead of stopping at the welcome modal.
    expect(document.getElementById('welcome-modal').classList.contains('modal--visible')).toBe(false);
    expect(document.getElementById('game').classList.contains('panel--hidden')).toBe(false);
    expect(getState().currentIndex).toBe(3);
  });

  it('triggers Easter Egg 1 on 5 clicks to modal footer', async () => {
    await import('./app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const footer = document.querySelector('.modal__footer');
    for (let i = 0; i < 5; i += 1) {
      footer.click();
    }
    expect(footer.textContent).toContain("Teacher Evan's Honor Roll");
    expect(document.body.classList.contains('easter--scholar')).toBe(true);
  });

  it('triggers Easter Egg 2 on keyboard sequence "tense"', async () => {
    await import('./app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    for (const char of 'tense') {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
    }
    expect(document.body.classList.contains('easter--chrono-warp')).toBe(true);
  });

  it('toggles sound on and off via the audio HUD button', async () => {
    await import('./app.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    const soundBtn = document.getElementById('sound-toggle-btn');
    expect(soundBtn.textContent).toContain('Audio');

    soundBtn.click();
    expect(soundBtn.textContent).toContain('Muted');
    expect(soundBtn.classList.contains('sound--muted')).toBe(true);

    soundBtn.click();
    expect(soundBtn.textContent).toContain('Audio');
    expect(soundBtn.classList.contains('sound--muted')).toBe(false);
  });

  it('displays personal best streaks on the level select panel', async () => {
    const { addPoint, setLevel } = await import('./state.js');
    await import('./app.js');

    setLevel('easy');
    addPoint();
    addPoint();
    addPoint();

    document.dispatchEvent(new Event('DOMContentLoaded'));
    document.getElementById('start-btn').click();

    expect(document.getElementById('best-easy').textContent).toBe('3');
  });

  it('launches 60s speed run attack mode with countdown and score accumulation', async () => {
    const { QUESTIONS } = await import('./data.js');
    const { getState } = await import('./state.js');
    await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));
    document.getElementById('start-btn').click();

    const speedrunBtn = document.getElementById('speedrun-btn');
    speedrunBtn.click();

    expect(getState().speedRunActive).toBe(true);
    expect(document.getElementById('timer-counter').classList.contains('panel--hidden')).toBe(false);
    expect(document.getElementById('timer-counter').textContent).toBe('Time: 60s');

    // Answer a question correctly in speed run mode
    answerCorrect(QUESTIONS);
    expect(getState().speedRunScore).toBeGreaterThanOrEqual(1);

    // Advance 60 seconds of timer ticks
    vi.advanceTimersByTime(60000);

    expect(getState().speedRunActive).toBe(false);
    expect(document.getElementById('sentence').textContent).toContain('Speed Run Complete');
  });

  it('handles keyboard shortcuts 1, 2, 3 to answer questions', async () => {
    const { QUESTIONS } = await import('./data.js');
    await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));
    document.getElementById('start-btn').click();
    document.querySelector('[data-level="easy"]').click();

    const buttons = Array.from(document.querySelectorAll('[data-option]'));
    const targetBtn = buttons[0];
    const sentence = document.getElementById('sentence').textContent;
    const question = QUESTIONS.find((q) => q.sentence === sentence);
    const isFirstCorrect = targetBtn.dataset.option === question.correct;

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));

    const feedback = document.getElementById('feedback');
    if (isFirstCorrect) {
      expect(feedback.textContent).toContain('Correct!');
    } else {
      expect(feedback.textContent).toContain('Not quite.');
    }
  });

  it('toggles high contrast mode via settings toolbar', async () => {
    const { getState } = await import('./state.js');
    await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));
    document.getElementById('start-btn').click();

    const contrastBtn = document.getElementById('contrast-toggle-btn');
    contrastBtn.click();

    expect(getState().highContrast).toBe(true);
    expect(document.body.classList.contains('theme-high-contrast')).toBe(true);
    expect(contrastBtn.textContent).toContain('Contrast: High');
  });

  it('filters questions by tense category focus', async () => {
    const { getState } = await import('./state.js');
    await import('./app.js');

    document.dispatchEvent(new Event('DOMContentLoaded'));
    document.getElementById('start-btn').click();

    const pastChip = document.querySelector('[data-category="past"]');
    pastChip.click();

    expect(getState().activeCategoryFilter).toBe('past');
    expect(pastChip.classList.contains('btn--chip-active')).toBe(true);
  });

  it('allows reviewing recorded mistakes and displays pedagogical explanation', async () => {
    const { QUESTIONS } = await import('./data.js');
    const { getState, recordMistake } = await import('./state.js');
    await import('./app.js');

    const sampleQ = QUESTIONS[0];
    recordMistake(sampleQ);

    document.dispatchEvent(new Event('DOMContentLoaded'));
    document.getElementById('start-btn').click();

    const reviewBtn = document.getElementById('review-mistakes-btn');
    expect(reviewBtn.classList.contains('panel--hidden')).toBe(false);
    expect(document.getElementById('mistakes-count').textContent).toBe('1');

    reviewBtn.click();
    expect(getState().reviewMode).toBe(true);

    // Answer incorrectly in review mode
    answerIncorrect(QUESTIONS);
    const explContainer = document.getElementById('explanation-container');
    expect(explContainer.classList.contains('panel--hidden')).toBe(false);
    expect(document.getElementById('explanation-text').textContent).toContain('Grammar Insight');
  });
});

// Answer the question currently on screen with its correct option.
const answerCorrect = (QUESTIONS) => {
  const sentence = document.getElementById('sentence').textContent;
  const question = QUESTIONS.find((q) => q.sentence === sentence);
  const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
  answerButtons.find((btn) => btn.textContent === question.correct).click();
};

// Answer the question currently on screen with an incorrect option.
const answerIncorrect = (QUESTIONS) => {
  const sentence = document.getElementById('sentence').textContent;
  const question = QUESTIONS.find((q) => q.sentence === sentence);
  const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
  answerButtons.find((btn) => btn.textContent !== question.correct).click();
};

const readSentenceOrder = (QUESTIONS, level) => {
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
