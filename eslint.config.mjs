import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: ['node_modules', 'dist', '.next', 'coverage', 'pnpm-lock.yaml', 'docs'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs'],
    ...js.configs.recommended,
  },
  ...tseslint.configs.recommended,
]
