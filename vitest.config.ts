import { defineConfig } from 'vitest/config';

// Jenkins sets JUNIT_OUTPUT to collect a JUnit report; local runs stay quiet.
const junit = process.env.JUNIT_OUTPUT;

export default defineConfig({
  test: {
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/contract/**/*.test.ts',
    ],
    fileParallelism: false,
    testTimeout: 30_000,
    reporters: junit ? ['default', ['junit']] : ['default'],
    outputFile: junit ? { junit } : undefined,
  },
});
