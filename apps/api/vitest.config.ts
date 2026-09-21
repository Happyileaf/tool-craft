import { defineConfig } from 'vitest/config';

/**
 * API 包 Vitest 配置，仅收集 src 下的测试文件，排除 dist 编译产物以避免用例重复执行
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  },
});
