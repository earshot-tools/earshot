/**
 * Shared ESLint rule blocks used by every workspace.
 *
 * Each export returns a rule object that can be spread into the `rules:` block
 * of a flat ESLint config. Per-workspace differences (React rules, Node-
 * specific rules, etc.) live in the consumers, not here.
 */

/** TypeScript-strict rule block — applies to any TS code. */
export const TYPESCRIPT_STRICT_RULES = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/consistent-type-assertions': 'error',
  '@typescript-eslint/no-non-null-assertion': 'error',
  '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description' }],
  '@typescript-eslint/prefer-readonly': 'error',
  '@typescript-eslint/explicit-module-boundary-types': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
  '@typescript-eslint/switch-exhaustiveness-check': 'error',
}

/** Function/file complexity constraints. */
export const COMPLEXITY_RULES = {
  'max-params': ['error', 3],
  'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
  'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
  'max-depth': ['error', 3],
  'max-nested-callbacks': ['error', 3],
  'max-statements': ['error', 20],
  complexity: ['error', 10],
}

/** sonarjs overrides on top of the recommended preset. */
export const SONARJS_OVERRIDE_RULES = {
  'sonarjs/cognitive-complexity': ['error', 15],
  'sonarjs/no-duplicate-string': ['error', { threshold: 5 }],
  'sonarjs/no-identical-functions': 'error',
  'sonarjs/no-collapsible-if': 'error',
  'sonarjs/todo-tag': 'off',
}

/** Import correctness rules. */
export const IMPORT_CORRECTNESS_RULES = {
  'import-x/no-duplicates': 'error',
  'import-x/no-cycle': ['error', { maxDepth: 10 }],
  'import-x/no-self-import': 'error',
  'import-x/no-useless-path-segments': 'error',
  'import-x/first': 'error',
  'import-x/newline-after-import': 'error',
}

/** Unicorn array best-practice rules. */
export const UNICORN_ARRAY_RULES = {
  'unicorn/prefer-array-some': 'error',
  'unicorn/prefer-array-find': 'error',
  'unicorn/prefer-array-flat-map': 'error',
  'unicorn/prefer-includes': 'error',
}

/**
 * Type-aware strict rules — require parserOptions.projectService (or project)
 * to function. Catch unsafe `any` flow, dead conditions, and inconsistent
 * type-only imports.
 */
export const TYPESCRIPT_TYPE_AWARE_RULES = {
  '@typescript-eslint/no-unsafe-assignment': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-unsafe-member-access': 'error',
  '@typescript-eslint/no-unsafe-argument': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
  ],
  '@typescript-eslint/no-unnecessary-condition': 'error',
}

/** Cross-project security and basic-hygiene rules. */
export const SAFETY_RULES = {
  'no-console': 'error',
  'no-eval': 'error',
  'import-x/no-default-export': 'error',
  'id-length': ['error', { min: 2, exceptions: ['i', 'j', 't', '_'] }],
  'no-var': 'error',
  'prefer-const': 'error',
}
