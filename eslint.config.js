import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettierConfig from 'eslint-config-prettier';

const DEEP_FEATURE_IMPORT_PATTERNS = [
  {
    group: [
      '@features/*/*',
      '@features/*/**',
      '../features/*/*',
      '../features/*/**',
      '../../features/*/*',
      '../../features/*/**',
      '../../auth/**',
      '../../question-bank/**',
      '../../testing/**',
      '../../analytics/**',
      '../../*/*/**',
      '../../*/*',
    ],
    message:
      'Deep imports into features are forbidden. Import only from the feature public API: @features/<name>.',
  },
];

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/prop-types': 'off',
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/infrastructure/firebase/**', 'src/features/*/data/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['firebase', 'firebase/*'],
              message:
                'Firebase SDK is only allowed in infrastructure/firebase and features/*/data.',
            },
            ...DEEP_FEATURE_IMPORT_PATTERNS,
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/*/data/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [...DEEP_FEATURE_IMPORT_PATTERNS],
        },
      ],
    },
  },
  {
    files: ['src/features/*/ui/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['firebase', 'firebase/*'],
              message:
                'Firebase SDK is only allowed in infrastructure/firebase and features/*/data.',
            },
            {
              group: [
                '@features/*/data',
                '@features/*/data/**',
                '../data',
                '../data/**',
                '../../**/data',
                '../../**/data/**',
              ],
              message:
                'UI layer must not directly import from data layer. Use hooks instead.',
            },
            ...DEEP_FEATURE_IMPORT_PATTERNS,
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/*/domain/**/*.{js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react/*',
                'react-dom',
                'react-dom/*',
                'react-router-dom',
                'react-router-dom/*',
              ],
              message: 'Domain layer must be pure JS (no React).',
            },
            {
              group: ['firebase', 'firebase/*'],
              message: 'Domain layer must be pure JS (no Firebase).',
            },
            {
              group: ['@infrastructure', '@infrastructure/*'],
              message:
                'Domain layer must not depend on external infrastructure.',
            },
            {
              group: [
                '@features/*/data',
                '@features/*/data/**',
                '@features/*/hooks',
                '@features/*/hooks/**',
                '@features/*/ui',
                '@features/*/ui/**',
                '../data',
                '../data/**',
                '../hooks',
                '../hooks/**',
                '../ui',
                '../ui/**',
                '../../**/data',
                '../../**/data/**',
                '../../**/hooks',
                '../../**/hooks/**',
                '../../**/ui',
                '../../**/ui/**',
              ],
              message:
                'Domain layer is the core and cannot import from data, hooks, or ui.',
            },
            ...DEEP_FEATURE_IMPORT_PATTERNS,
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.test.{js,jsx}',
      '**/__tests__/**/*.{js,jsx}',
      'src/test/**/*.{js,jsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
  },
  prettierConfig,
];
