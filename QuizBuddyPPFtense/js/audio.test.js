import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  playSound,
  isSoundEnabled,
  setSoundEnabled,
  toggleSound,
  getSoundTheme,
  setSoundTheme,
  getSoundVolume,
  setSoundVolume,
  triggerHaptic,
  __resetAudioContextForTesting
} from './audio.js';

describe('audio synthesizer', () => {
  beforeEach(() => {
    setSoundEnabled(true);
    setSoundTheme('neo');
    setSoundVolume(0.8);
    __resetAudioContextForTesting();
  });

  it('toggles sound on and off', () => {
    expect(isSoundEnabled()).toBe(true);
    expect(toggleSound()).toBe(false);
    expect(isSoundEnabled()).toBe(false);
    expect(toggleSound()).toBe(true);
    expect(isSoundEnabled()).toBe(true);
  });

  it('manages sound theme and volume', () => {
    expect(getSoundTheme()).toBe('neo');
    setSoundTheme('8bit');
    expect(getSoundTheme()).toBe('8bit');
    setSoundTheme('unsupported');
    expect(getSoundTheme()).toBe('8bit');

    expect(getSoundVolume()).toBe(0.8);
    setSoundVolume(0.4);
    expect(getSoundVolume()).toBe(0.4);
    setSoundVolume(1.5);
    expect(getSoundVolume()).toBe(1);
    setSoundVolume(-0.5);
    expect(getSoundVolume()).toBe(0);
  });

  it('handles simulated AudioContext without throwing', () => {
    const mockGainNode = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      },
      connect: vi.fn()
    };
    const mockOscillatorNode = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn()
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn()
    };

    const mockAudioContext = vi.fn().mockImplementation(() => ({
      currentTime: 0,
      state: 'running',
      destination: {},
      createOscillator: vi.fn(() => ({ ...mockOscillatorNode })),
      createGain: vi.fn(() => ({ ...mockGainNode, gain: { ...mockGainNode.gain } })),
      resume: vi.fn().mockResolvedValue()
    }));

    vi.stubGlobal('AudioContext', mockAudioContext);

    expect(() => {
      playSound('click');
      playSound('correct');
      playSound('incorrect');
      playSound('milestone');
      playSound('warp');
      playSound('countdown');
    }).not.toThrow();

    // 8bit theme test
    setSoundTheme('8bit');
    expect(() => {
      playSound('click');
      playSound('correct');
      playSound('milestone');
    }).not.toThrow();

    vi.unstubAllGlobals();
  });

  it('triggers haptic feedback safely', () => {
    const vibrateMock = vi.fn();
    vi.stubGlobal('navigator', { vibrate: vibrateMock });

    triggerHaptic(50);
    expect(vibrateMock).toHaveBeenCalledWith(50);

    vi.unstubAllGlobals();
  });
});
