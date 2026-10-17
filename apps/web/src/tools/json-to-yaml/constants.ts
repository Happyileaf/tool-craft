/**
 * JSON to YAML converter 工具内常量
 */

/**
 * 缩进宽度可选值，供缩进选择控件渲染
 */
export const INDENT_SIZE_OPTIONS: number[] = [2, 4];

/**
 * 缩进宽度默认值（空格数）
 */
export const DEFAULT_INDENT_SIZE = 2;

/**
 * 工具首次载入时填入的示例 JSON 输入
 */
export const DEFAULT_JSON_SAMPLE = `{
  "name": "ToolCraft",
  "version": "2.4.0",
  "offlineReady": true,
  "activeUsers": 14280,
  "modules": ["Formatter", "Encoder", "Diff"],
  "settings": {
    "theme": "auto",
    "telemetry": false
  }
}`;
