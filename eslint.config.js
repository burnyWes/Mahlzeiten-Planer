import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const forbiddenInDomain = [
  'react',
  'react-dom',
  'firebase',
  'firebase/*',
  '../ui/*',
  '../api/*',
  '../../ui/*',
  '../../api/*',
]

const contexts = [
  { name: 'shopping', other: 'meals' },
  { name: 'meals', other: 'shopping' },
]

const contextBoundaries = contexts.flatMap(({ name, other }) => [
  {
    files: [`src/${name}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': ['error', { patterns: [`**/${other}/**`] }],
    },
  },
  {
    files: [`src/${name}/domain/**/*.ts`],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [...forbiddenInDomain, `**/${other}/**`] },
      ],
    },
  },
])

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dev-dist',
      'coverage',
      'node_modules',
      'playwright-report',
      'test-results',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  jsxA11y.flatConfigs.strict,
  reactHooks.configs.flat.recommended,
  prettierConfig,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: forbiddenInDomain }],
    },
  },
  ...contextBoundaries,
  {
    files: ['e2e/**/*.ts', 'scripts/**/*.mjs', '*.config.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
)
