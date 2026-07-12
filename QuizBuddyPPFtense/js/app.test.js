import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('App interactivity', () => {
  beforeEach(() => {
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

    const easyQuestions = QUESTIONS.filter((q) => q.level === 'easy');

    for (let i = 0; i < easyQuestions.length; i += 1) {
      const correct = easyQuestions[i].correct;
      const answerButtons = Array.from(document.querySelectorAll('[data-option]'));
      const target = answerButtons.find((btn) => btn.textContent === correct);
      target.click();
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
});
