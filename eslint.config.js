// @ts-check
const expoConfig = require('eslint-config-expo/flat');

/**
 * Architectural boundaries are enforced here, not by convention. A rule that
 * only lives in a README is a rule that erodes.
 */
module.exports = [
  ...expoConfig,
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'ios/**', 'android/**'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // Two patterns, because `*` does not cross a `/` in minimatch:
              // `@/features/*/*` alone matches only `@/features/auth/data`, not
              // the deeper paths the message actually warns about. The barrel
              // (`@/features/auth`) is shorter than both and stays allowed.
              group: ['@/features/*/*', '@/features/*/*/**'],
              message:
                'Import from the feature barrel (@/features/<name>) instead. Deep imports couple you to another feature’s internals.',
            },
            {
              group: ['**/lib/supabase'],
              message:
                'Only repositories under features/<name>/data may touch the Supabase client. Go through a repository.',
            },
          ],
        },
      ],
    },
  },
  {
    // The composition root and repositories are exactly the places allowed to
    // reach across those boundaries — that is their job.
    files: [
      'src/bootstrap/container.ts',
      'src/**/data/**',
      'src/features/*/index.ts',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
];
