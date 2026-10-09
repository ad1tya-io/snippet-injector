import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      vscode: path.resolve(__dirname, 'test/mocks/vscode.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/unit/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});
