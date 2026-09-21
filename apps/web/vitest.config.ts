import { defineConfig } from 'vitest/config';

/**
 * Web 包 Vitest 配置，现有测试均为纯函数，统一使用 node 环境，并排除构建产物目录
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
  },
});
