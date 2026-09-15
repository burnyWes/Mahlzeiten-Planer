import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'rules',
    environment: 'node',
    include: ['firestore.rules.test.ts'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
