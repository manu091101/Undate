// Root ESLint flat config. Pragmatic: warnings, not blockers.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

const browserishGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  fetch: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  globalThis: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
};

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: browserishGlobals },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-empty-pattern': 'off',
    },
  },
  {
    // CommonJS files use `module.exports` and `require`. Allow them.
    files: ['**/*.cjs', '**/*.cts'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...browserishGlobals,
        module: 'writable',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        exports: 'writable',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.expo/**',
      '**/generated/**',
      '**/coverage/**',
      'ml/**',
      'packages/db/prisma/**',
      'apps/web/next-env.d.ts',
    ],
  },
);
