// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',  // Simulate browser environment for DOM APIs
    globals: true,         // Use global expect, describe, it without importing
    setupFiles: ['./vitest.setup.ts'],
  },
}); 