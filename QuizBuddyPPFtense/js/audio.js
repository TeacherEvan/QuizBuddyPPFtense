// Web Audio API Synthesizer - procedural, zero external assets
let audioCtx = null;
let soundEnabled = true;
let soundTheme = 'neo'; // 'neo' | '8bit'
let soundVolume = 0.8;

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
};

export const __resetAudioContextForTesting = () => {
  audioCtx = null;
};

export const isSoundEnabled = () => soundEnabled;

export const setSoundEnabled = (enabled) => {
  soundEnabled = Boolean(enabled);
};

export const toggleSound = () => {
  soundEnabled = !soundEnabled;
  return soundEnabled;
};

export const getSoundTheme = () => soundTheme;

export const setSoundTheme = (theme) => {
  if (theme === 'neo' || theme === '8bit') {
    soundTheme = theme;
  }
};

export const getSoundVolume = () => soundVolume;

export const setSoundVolume = (vol) => {
  if (typeof vol === 'number' && !Number.isNaN(vol)) {
    soundVolume = Math.max(0, Math.min(1, vol));
  }
};

export const triggerHaptic = (pattern = 25) => {
  if (
    typeof window !== 'undefined' &&
    typeof window.navigator !== 'undefined' &&
    typeof window.navigator.vibrate === 'function'
  ) {
    try {
      window.navigator.vibrate(pattern);
    } catch {
      // ignore haptic error
    }
  }
};

export const playSound = (name) => {
  if (!soundEnabled || soundVolume <= 0) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const vol = soundVolume;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(vol, now);
    masterGain.connect(ctx.destination);

    if (name === 'click') {
      triggerHaptic(15);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = soundTheme === '8bit' ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(soundTheme === '8bit' ? 440 : 320, now);
      osc.frequency.exponentialRampToValueAtTime(soundTheme === '8bit' ? 110 : 80, now + 0.04);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (name === 'correct') {
      triggerHaptic([30, 40, 30]);
      if (soundTheme === '8bit') {
        // Fast 8-bit chiptune arpeggio (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          const t = now + idx * 0.04;
          osc.frequency.setValueAtTime(freq, t);
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.setValueAtTime(0.001, t + 0.038);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.04);
        });
      } else {
        // Neo harmonic chime
        const freqs = [523.25, 659.25, 783.99];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.045);
          gain.gain.setValueAtTime(0.001, now);
          gain.gain.setValueAtTime(0.12, now + idx * 0.045);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32 + idx * 0.04);
          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(now + idx * 0.045);
          osc.stop(now + 0.4);
        });
      }
    } else if (name === 'incorrect') {
      triggerHaptic(80);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = soundTheme === '8bit' ? 'sawtooth' : 'sawtooth';
      osc.frequency.setValueAtTime(soundTheme === '8bit' ? 140 : 160, now);
      osc.frequency.exponentialRampToValueAtTime(soundTheme === '8bit' ? 65 : 90, now + 0.18);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (name === 'milestone') {
      triggerHaptic([50, 50, 80]);
      const notes = soundTheme === '8bit' ? [523.25, 659.25, 783.99, 1046.5, 1318.51] : [523.25, 783.99, 1046.5];
      const step = soundTheme === '8bit' ? 0.05 : 0.08;
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = soundTheme === '8bit' ? 'square' : 'triangle';
        const start = now + i * step;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(start);
        osc.stop(start + 0.31);
      });
    } else if (name === 'warp') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.35);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.38);
    } else if (name === 'countdown') {
      triggerHaptic(20);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = soundTheme === '8bit' ? 'square' : 'sine';
      osc.frequency.setValueAtTime(soundTheme === '8bit' ? 980 : 880, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch {
    // Audio playback error or disabled in environment - fails gracefully
  }
};
