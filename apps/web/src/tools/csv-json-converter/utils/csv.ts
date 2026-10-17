/**
 * CSV ↔ JSON 双向转换纯函数集合。
 * 全部逻辑在浏览器本地执行，遵循 RFC 4180 的引号转义规则，不触碰 DOM / React。
 */

/**
 * CSV 解析 / 生成选项
 */
export interface CsvOptions {
  /** 字段分隔符，默认为英文逗号 */
  delimiter?: string;
  /** CSV → JSON 时是否把首行作为表头，默认为 true */
  hasHeader?: boolean;
  /** JSON 输出的缩进宽度，默认为 2 */
  indent?: number;
}

/** 默认字段分隔符 */
const DEFAULT_DELIMITER = ',';

/** JSON 输出默认缩进宽度 */
const DEFAULT_INDENT = 2;

/**
 * 判断值是否为普通对象（非数组、非 null）
 *
 * @param value - 待判断的值
 * @returns 是普通对象返回 true
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 按 RFC 4180 规则解析 CSV 文本为行 × 字段矩阵
 *
 * @param text - CSV 文本，允许携带 UTF-8 BOM 与 CRLF 换行
 * @param delimiter - 字段分隔符
 * @returns 二维字段矩阵
 */
function parseCsvRows(text: string, delimiter: string): string[][] {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let index = 0;
  let hasField = false;

  while (index < source.length) {
    const char = source.charAt(index);
    if (inQuotes) {
      if (char === '"') {
        if (source.charAt(index + 1) === '"') {
          field += '"';
          index += 2;
          continue;
        }
        inQuotes = false;
        index += 1;
        continue;
      }
      field += char;
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      hasField = true;
      index += 1;
      continue;
    }
    if (char === delimiter) {
      row.push(field);
      field = '';
      hasField = false;
      index += 1;
      continue;
    }
    if (char === '\r' || char === '\n') {
      if (char === '\r' && source.charAt(index + 1) === '\n') {
        index += 2;
      } else {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      hasField = false;
      continue;
    }
    field += char;
    hasField = true;
    index += 1;
  }

  if (hasField || row.length > 0 || field !== '') {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((item) => !(item.length === 1 && item[0] === ''));
}

/**
 * 将单个字段值转义为符合 RFC 4180 的 CSV 单元格
 *
 * @param value - 字段原始文本
 * @param delimiter - 字段分隔符
 * @returns 必要时以双引号包裹并转义内部双引号的单元格文本
 */
function escapeField(value: string, delimiter: string): string {
  const needsQuote =
    value.includes(delimiter) ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r');
  if (!needsQuote) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * 将 JSON 单元格值转换为 CSV 字符串表示
 *
 * @param value - 任意 JSON 值
 * @returns 字符串表示；null / undefined 转为空串
 */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * 将 CSV 文本转换为 JSON 文本（对象数组或二维数组）
 *
 * @param text - CSV 文本，允许为空
 * @param options - 转换选项
 * @returns 格式化 JSON 文本；无可转换内容时返回空串
 */
export function csvToJson(text: string, options: CsvOptions = {}): string {
  if (text.trim() === '') return '';
  const delimiter = options.delimiter ?? DEFAULT_DELIMITER;
  const hasHeader = options.hasHeader ?? true;
  const indent = options.indent ?? DEFAULT_INDENT;

  const rows = parseCsvRows(text, delimiter);
  if (rows.length === 0) return '';

  if (!hasHeader) {
    return JSON.stringify(rows, null, indent);
  }

  const header = rows[0] ?? [];
  const objects = rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    header.forEach((key, columnIndex) => {
      record[key] = row[columnIndex] ?? '';
    });
    for (let extra = header.length; extra < row.length; extra += 1) {
      record[`column${extra + 1}`] = row[extra] ?? '';
    }
    return record;
  });
  return JSON.stringify(objects, null, indent);
}

/**
 * 将 JSON 文本转换为 CSV 文本
 *
 * @param text - JSON 文本，允许为空
 * @param options - 转换选项
 * @returns CSV 文本；空数组返回空串
 * @throws JSON 非法或根节点不是数组时抛出可读错误
 */
export function jsonToCsv(text: string, options: CsvOptions = {}): string {
  if (text.trim() === '') return '';
  const delimiter = options.delimiter ?? DEFAULT_DELIMITER;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const reason = error instanceof Error ? error.message : '未知错误';
    throw new Error(`JSON 解析失败：${reason}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error('JSON 根节点必须是数组，无法转换为 CSV');
  }
  if (parsed.length === 0) return '';

  if (parsed.every(isPlainObject)) {
    const headers: string[] = [];
    parsed.forEach((record) => {
      Object.keys(record).forEach((key) => {
        if (!headers.includes(key)) headers.push(key);
      });
    });
    const lines = [headers.map((key) => escapeField(key, delimiter)).join(delimiter)];
    parsed.forEach((record) => {
      const cells = headers.map((key) =>
        escapeField(cellToString(record[key]), delimiter),
      );
      lines.push(cells.join(delimiter));
    });
    return lines.join('\n');
  }

  return parsed
    .map((record) => {
      if (Array.isArray(record)) {
        return record
          .map((cell) => escapeField(cellToString(cell), delimiter))
          .join(delimiter);
      }
      return escapeField(cellToString(record), delimiter);
    })
    .join('\n');
}
