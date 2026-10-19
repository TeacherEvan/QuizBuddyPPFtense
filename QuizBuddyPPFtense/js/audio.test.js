import { describe, it, expect, beforeEach, vi } from 'vitest';
import { playSound, isSoundEnabled, setSoundEnabled, toggleSound } from './audio.js';

describe('audio synthesizer', () => {
  beforeEach(() => {
    setSoundEnabled(true);
  });

  it('toggles sound on and off', () => {
    expect(isSoundEnabled()).toBe(true);
    expect(toggleSound()).toBe(false);
    expect(isSoundEnabled()).toBe(false);
    expect(toggleSound()).toBe(true);
    expect(isSoundEnabled()).toBe(true);
  });

  it('plays sounds safely even when AudioContext is unavailable or in mock JSDOM', () => {
    expect(() => playSound('click')).not.toThrow();
    expect(() => playSound('correct')).not.toThrow();
    expect(() => playSound('incorrect')).not.toThrow();
    expect(() => playSound('milestone')).not.toThrow();
    expect(() => playSound('warp')).not.toThrow();
    expect(() => playSound('countdown')).not.toThrow();
  });

  it('interacts with AudioContext if available', () => {
    const mockOsc = {
      type: '',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };
    const mockGain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn()
    };
    const mockCtx = {
      currentTime: 10,
      state: 'running',
      createOscillator: vi.fn(() => mockOsc),
      createGain: vi.fn(() => mockGain),
      destination: {}
    };

    class MockAudioContext {
      constructor() {
        return mockCtx;
      }
    }

    const { __resetAudioContextForTesting } = require('./audio.js');
    __resetAudioContextForTesting();
    window.AudioContext = MockAudioContext;

    playSound('click');
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockCtx.createGain).toHaveBeenCalled();
    expect(mockOsc.start).toHaveBeenCalled();

    delete window.AudioContext;
    __resetAudioContextForTesting();
  });
});
