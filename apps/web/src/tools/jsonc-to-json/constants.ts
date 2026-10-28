export const DEFAULT_JSONC_SAMPLE = `{
  // 编译器配置（示例）
  "compilerOptions": {
    "strict": true,          // 开启严格模式
    "target": "ES2020",
    "paths": {
      "@/*": ["./src/*"],
    },
  },
  /* 包含的文件列表 */
  "include": ["src/**/*.ts", "src/**/*.tsx",],
}`;

export const DEFAULT_INDENT = 2;
