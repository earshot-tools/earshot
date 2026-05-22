export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'test',
        'refactor',
        'docs',
        'chore',
        'style',
        'perf',
        'ci',
        'build',
        'revert',
      ],
    ],

    'scope-enum': [1, 'always', ['shared', 'devops', 'docs']],

    'subject-max-length': [2, 'always', 72],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],

    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],

    'body-max-line-length': [1, 'always', 200],
  },
}
