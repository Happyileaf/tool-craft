/**
 * HTML entity encoder/decoder 工具内常量
 */

/**
 * 转换方向枚举
 */
export enum EntityDirectionEnum {
  /** 把文本编码为 HTML 实体 */
  ENCODE = 'encode',
  /** 把 HTML 实体还原为字符 */
  DECODE = 'decode',
}

/**
 * 编码方向的示例输入
 */
export const DEFAULT_ENCODE_SAMPLE = `© 2026 <ToolCraft> — "fast & offline"`;

/**
 * 解码方向的示例输入
 */
export const DEFAULT_DECODE_SAMPLE = `&copy; 2026 &lt;ToolCraft&gt; &mdash; &quot;fast &amp; offline&quot;`;
