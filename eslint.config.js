import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const contexts = ['shopping', 'meals']

const forbiddenInDomain = [
  'react',
  'react-dom',
  'firebase',
  'firebase/*',
  '**/ui/**',
  '**/api/**',
  '**/shared/*/**',
  '!**/shared/domain/**',
]

const forbiddenInApi = ['**/ui/**']

const modules = [
  ...contexts.map((name) => ({
    folder: name,
    foreignContexts: contexts.filter((other) => other !== name),
  })),
  { folder: 'shared', foreignContexts: contexts },
]

function restrictImports(files, patterns) {
  return {
    files: [files],
    rules: {
      'no-restricted-imports': ['error', { patterns }],
    },
  }
}

const moduleBoundaries = modules.flatMap(({ folder, foreignContexts }) => {
  const foreign = foreignContexts.map((context) => `**/${context}/**`)
  return [
    restrictImports(`src/${folder}/**/*.{ts,tsx}`, foreign),
    restrictImports(`src/${folder}/api/**/*.ts`, [
      ...foreign,
      ...forbiddenInApi,
    ]),
    restrictImports(`src/${folder}/domain/**/*.ts`, [
      ...foreign,
      ...forbiddenInDomain,
    ]),
  ]
})

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
  ...moduleBoundaries,
  {
    files: ['e2e/**/*.ts', 'scripts/**/*.mjs', '*.config.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
)
