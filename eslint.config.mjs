import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default [
  {
    /** 构建产物需匹配任意层级（如 apps/web/.next），否则 apps 构建后 eslint . 会扫描到生成文件 */
    ignores: [
      'node_modules',
      '**/dist',
      '**/.next',
      '**/out',
      'coverage',
      'pnpm-lock.yaml',
      'docs',
      /** Next.js 自动生成的环境声明文件，包含 triple-slash 引用且不应被手工编辑 */
      '**/next-env.d.ts',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs'],
    ...js.configs.recommended,
  },
  ...tseslint.configs.recommended,
]
