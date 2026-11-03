/**
 * JSON5 ↔ JSON 转换器常量与默认示例
 */

/** 转换方向 */
export enum Json5ModeEnum {
  /** JSON5 / JSONC → 标准 JSON */
  JSON5_TO_JSON = 'json5-to-json',
  /** JSON → JSON5 友好写法 */
  JSON_TO_JSON5 = 'json-to-json5',
}

/** 默认 JSON5 输入：集中演示注释 / 单引号 / 尾逗号 / 十六进制 / 标识符键 */
export const DEFAULT_JSON5 = `{
  // 应用配置（JSON5 允许行注释）
  name: 'ToolHub',
  version: 0x10, // 十六进制数字
  tags: ['dev', 'tools',], // 尾逗号也合法
  retries: +.5e1,
  enabled: true,
  /* 块注释：
     这一段在标准 JSON 中都不合法 */
  owner: {
    email: 'admin@example.com',
  },
}`;

/** 默认标准 JSON 输入 */
export const DEFAULT_JSON = `{
  "name": "ToolHub",
  "version": 16,
  "tags": ["dev", "tools"],
  "enabled": true,
  "owner": {
    "email": "admin@example.com"
  }
}`;
