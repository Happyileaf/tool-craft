/**
 * JSON → YAML 序列化纯函数集合。
 * 全部逻辑在浏览器本地执行，不依赖任何外部库，也不触碰 DOM / React。
 */

/**
 * YAML 序列化选项
 */
export interface JsonToYamlOptions {
  /** 缩进宽度（空格数），非法值回退为默认值 */
  indentSize?: number;
}

/** 缩进宽度默认值 */
const DEFAULT_INDENT_SIZE = 2;

/**
 * 判断值是否为标量（null、字符串、数字、布尔等非对象非数组值）
 *
 * @param value - 待判断的值
 * @returns 是标量返回 true
 */
function isScalar(value: unknown): boolean {
  return value === null || typeof value !== 'object';
}

/**
 * 判断值是否为空容器（空对象或空数组）
 *
 * @param value - 待判断的值
 * @returns 是空容器返回 true
 */
function isEmptyContainer(value: unknown): boolean {
  if (value === null || typeof value !== 'object') return false;
  return Object.keys(value).length === 0;
}

/**
 * 判断字符串在 YAML 中是否必须加引号，以避免被误解析为其他类型或结构
 *
 * @param text - 待判断的字符串
 * @returns 需要加引号返回 true
 */
function needsQuoting(text: string): boolean {
  if (text === '') return true;
  if (text !== text.trim()) return true;
  if (/[\u0000-\u001f\u007f]/.test(text)) return true;
  if (/[:#\[\]{},"'&*!|>%@`]/.test(text)) return true;
  if (/^[-?]/.test(text)) return true;
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(text)) return true;
  if (/^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(text)) return true;
  if (/^0[xX][0-9a-fA-F]+$/.test(text)) return true;
  return false;
}

/**
 * 将字符串渲染为 YAML 标量，必要时加双引号并转义控制字符
 *
 * @param text - 原始字符串
 * @returns 可直接写入 YAML 的标量文本
 */
function formatString(text: string): string {
  if (!needsQuoting(text)) return text;
  const escaped = text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `"${escaped}"`;
}

/**
 * 将标量值渲染为 YAML 标量文本
 *
 * @param value - 标量值
 * @returns YAML 标量文本
 */
function formatScalar(value: unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'null';
  }
  return formatString(typeof value === 'string' ? value : String(value));
}

/**
 * 递归把已解析的 JSON 值序列化为 YAML 文本块
 *
 * @param value - 已解析的 JSON 值
 * @param indent - 当前节点结构行的缩进列数
 * @param indentSize - 每层缩进的空格数
 * @returns 多行 YAML 文本（不含尾部换行）
 */
function serialize(value: unknown, indent: number, indentSize: number): string {
  if (isScalar(value)) return formatScalar(value);

  const pad = ' '.repeat(indent);
  const childIndent = indent + indentSize;

  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;
    const lines = value.map((item) => {
      if (isScalar(item)) return `${pad}- ${formatScalar(item)}`;
      if (isEmptyContainer(item)) {
        return `${pad}- ${Array.isArray(item) ? '[]' : '{}'}`;
      }
      if (Array.isArray(item)) {
        return `${pad}-\n${serialize(item, indent + 2, indentSize)}`;
      }
      const [first = '', ...rest] = serialize(
        item,
        indent + 2,
        indentSize,
      ).split('\n');
      return [`${pad}- ${first.slice(indent + 2)}`, ...rest].join('\n');
    });
    return lines.join('\n');
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.length === 0) return `${pad}{}`;
  const lines = keys.map((key) => {
    const formattedKey = formatString(key);
    const child = record[key];
    if (isScalar(child)) {
      return `${pad}${formattedKey}: ${formatScalar(child)}`;
    }
    if (isEmptyContainer(child)) {
      return `${pad}${formattedKey}: ${Array.isArray(child) ? '[]' : '{}'}`;
    }
    return `${pad}${formattedKey}:\n${serialize(child, childIndent, indentSize)}`;
  });
  return lines.join('\n');
}

/**
 * 将 JSON 文本转换为等效的 YAML 文本
 *
 * @param input - JSON 文本，允许为空
 * @param options - 序列化选项
 * @returns YAML 文本；输入为空时返回空串
 * @throws 输入不是合法 JSON 时抛出包含解析原因的错误
 */
export function jsonToYaml(
  input: string,
  options: JsonToYamlOptions = {},
): string {
  if (input.trim() === '') return '';
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    const reason = error instanceof Error ? error.message : '未知错误';
    throw new Error(`JSON 解析失败：${reason}`);
  }
  const indentSize =
    options.indentSize && options.indentSize > 0
      ? options.indentSize
      : DEFAULT_INDENT_SIZE;
  return serialize(parsed, 0, indentSize);
}
