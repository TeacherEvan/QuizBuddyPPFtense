import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    // Restores `localStorage` when Node's experimental web-storage global
    // shadows jsdom's. See js/test-setup.js for the full rationale.
    setupFiles: ['./js/test-setup.js']
  }
});
