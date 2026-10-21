/**
 * Vitest setup: restore `localStorage` inside the jsdom environment.
 *
 * Node >= 22.4 defines a global `localStorage` whose value is `undefined`
 * unless the process is started with `--localstorage-file`. Vitest's jsdom
 * environment copies jsdom's window onto the global context but skips keys
 * the target already owns, so that undefined data property SHADOWS jsdom's
 * real Storage accessor. The result is `localStorage` being `undefined` in
 * every test, and `localStorage.clear()` throwing
 * "TypeError: Cannot read properties of undefined (reading 'clear')".
 *
 * This is toolchain-dependent: the suite is green under vitest 5 (which
 * handles the collision) and broken under vitest 3 (the version this
 * repository pins) on modern Node. Fix it here instead of pinning a Node
 * flag, so the suite behaves identically on Node 18, 20, 22 and 24+.
 *
 * Recovery: fetch jsdom's real per-origin Storage from a same-origin iframe
 * (its window is not shadowed) and re-point the global at it.
 */
const exposeWebStorage = () => {
  if (typeof globalThis.localStorage !== 'undefined' || typeof document === 'undefined') {
    return;
  }

  let real = null;
  try {
    const frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.display = 'none';
    document.body.appendChild(frame);
    real = frame.contentWindow && frame.contentWindow.localStorage;
    frame.remove();
  } catch {
    real = null;
  }

  if (!real) {
    // Last-resort in-memory Storage so a failure here degrades to a
    // diagnosable assertion instead of a confusing TypeError.
    const store = new Map();
    real = {
      getItem: (k) => (store.has(String(k)) ? store.get(String(k)) : null),
      setItem: (k, v) => store.set(String(k), String(v)),
      removeItem: (k) => store.delete(String(k)),
      clear: () => store.clear(),
      key: (i) => [...store.keys()][i] ?? null,
      get length() {
        return store.size;
      }
    };
  }

  Object.defineProperty(globalThis, 'localStorage', {
    value: real,
    configurable: true,
    writable: true,
    enumerable: true
  });
};

exposeWebStorage();
