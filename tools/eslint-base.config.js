import {
  COMPLEXITY_RULES,
  IMPORT_CORRECTNESS_RULES,
  SAFETY_RULES,
  SONARJS_OVERRIDE_RULES,
  TYPESCRIPT_STRICT_RULES,
  TYPESCRIPT_TYPE_AWARE_RULES,
  UNICORN_ARRAY_RULES,
} from './eslint-common-rules.js'

/**
 * Shared ESLint flat-config factory.
 *
 * Each workspace passes its own resolved plugin instances (plugins are
 * installed in each workspace's own node_modules and ESM resolution from this
 * shared file would not find them). Per-workspace differences (state-management
 * messages, DDD layer rules) are passed as options.
 *
 * @param {object} opts
 * @param {object} opts.plugins - Resolved plugin instances from the consumer
 * @param {string} opts.tsconfigRootDir - Workspace root (import.meta.dirname)
 * @param {Array<{name: string, message: string}>} [opts.restrictedImports]
 *   Project-specific banned imports
 * @param {boolean} [opts.enableDDDLayerRules=false]
 *   Enable import-x/no-restricted-paths for DDD layers (server only)
 * @param {boolean} [opts.frontend=false]
 *   Enable React + a11y rule blocks
 * @returns {Array} ESLint flat config
 */
// eslint-disable-next-line import-x/no-default-export
export function createBaseConfig({
  plugins,
  tsconfigRootDir,
  restrictedImports = [],
  enableDDDLayerRules = false,
  frontend = false,
}) {
  const DDD_LAYER_RESTRICTED_PATHS = [
    {
      target: './src/domain/**',
      from: './src/application/**',
      message: 'domain/ cannot import from application/',
    },
    {
      target: './src/domain/**',
      from: './src/infrastructure/**',
      message: 'domain/ cannot import from infrastructure/',
    },
    {
      target: './src/domain/**',
      from: './src/presentation/**',
      message: 'domain/ cannot import from presentation/',
    },
    {
      target: './src/application/**',
      from: './src/infrastructure/**',
      message: 'application/ cannot import from infrastructure/',
    },
    {
      target: './src/application/**',
      from: './src/presentation/**',
      message: 'application/ cannot import from presentation/',
    },
    {
      target: './src/presentation/**',
      from: './src/infrastructure/**',
      message: 'presentation/ cannot import from infrastructure/ directly',
    },
  ]

  const restrictedPathsRule = enableDDDLayerRules
    ? {
        'import-x/no-restricted-paths': ['error', { zones: DDD_LAYER_RESTRICTED_PATHS }],
      }
    : {}

  const frontendPlugins = frontend
    ? {
        'jsx-a11y': plugins.jsxA11y,
        react: plugins.react,
        'react-hooks': plugins.reactHooks,
      }
    : {}

  const frontendRules = frontend
    ? {
        'react/no-danger': 'error',
        'react/forbid-dom-props': ['error', { forbid: ['style'] }],
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn',
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/aria-props': 'error',
        'jsx-a11y/aria-role': 'error',
        'jsx-a11y/role-has-required-aria-props': 'error',
        'jsx-a11y/tabindex-no-positive': 'error',
      }
    : {}

  return [
    {
      ignores: ['dist/', 'node_modules/', 'coverage/', '*.config.*'],
    },
    {
      files: ['src/**/*.{ts,tsx}'],
      languageOptions: {
        parser: plugins.tsParser,
        parserOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
          ecmaFeatures: { jsx: frontend },
          projectService: true,
          tsconfigRootDir,
        },
      },
      plugins: {
        '@typescript-eslint': plugins.tsPlugin,
        'import-x': plugins.importX,
        sonarjs: plugins.sonarjs,
        unicorn: plugins.unicorn,
        ...frontendPlugins,
      },
      rules: {
        ...plugins.sonarjs.configs.recommended.rules,

        ...TYPESCRIPT_STRICT_RULES,
        ...TYPESCRIPT_TYPE_AWARE_RULES,
        ...SAFETY_RULES,
        ...COMPLEXITY_RULES,
        ...SONARJS_OVERRIDE_RULES,
        ...IMPORT_CORRECTNESS_RULES,
        ...UNICORN_ARRAY_RULES,

        'no-restricted-syntax': [
          'error',
          {
            selector: 'TSEnumDeclaration',
            message: 'Use `as const` objects instead of enums',
          },
          {
            selector: 'ForInStatement',
            message: 'Use Object.keys/values/entries instead',
          },
        ],

        'no-restricted-imports': ['error', { paths: restrictedImports }],

        'prefer-arrow-callback': 'error',
        'prefer-destructuring': ['error', { object: true, array: false }],
        'no-nested-ternary': 'error',
        'no-param-reassign': ['error', { props: true }],

        'import-x/order': [
          'error',
          {
            groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'type'],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
          },
        ],

        ...frontendRules,
        ...restrictedPathsRule,
      },
    },
  ]
}
