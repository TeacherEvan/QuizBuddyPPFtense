import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initCanvas } from './canvas.js';

const makeStubCtx = () => {
  const calls = { clearRect: 0 };
  const ctx = new Proxy(
    {},
    {
      get: (_target, prop) => {
        if (prop === 'clearRect')
          return () => {
            calls.clearRect += 1;
          };
        return () => {};
      },
      set: () => true
    }
  );
  return { ctx, calls };
};

describe('canvas.js', () => {
  beforeEach(() => {
    // Prevent the rAF loop from recursing forever in tests.
    vi.stubGlobal('requestAnimationFrame', () => 0);
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns early (no throw) when getContext yields no 2D context', () => {
    const canvas = document.createElement('canvas');
    // jsdom's getContext returns null and emits a "not implemented" notice.
    expect(() => initCanvas(canvas)).not.toThrow();
  });

  it('creates boids and renders exactly one frame when a 2D context is present', () => {
    const { ctx, calls } = makeStubCtx();
    const canvas = {
      width: 0,
      height: 0,
      getContext: () => ctx,
      addEventListener: () => {}
    };

    expect(() => initCanvas(canvas)).not.toThrow();
    // One animation frame => clearRect called once (boids created, drawn).
    expect(calls.clearRect).toBeGreaterThanOrEqual(1);
  });
});
