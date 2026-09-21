import tsParser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      'dist/**',
      '.next/**',
      'coverage/**',
      '.turbo/**',
      'node_modules/**',
      '.vitest/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        self: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        globalThis: 'readonly',
        fetch: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        FormData: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
]
