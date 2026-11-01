/**
 * 固定列宽文本（FWF，Fixed-width Format）↔ CSV 双向转换（零依赖纯函数）
 *
 * - FWF 常见于主机报表、银行账单与遗留系统导出：每列按固定字符位置切分，
 *   不足宽度时以空格填充，left 列右补空格、right 列左补空格，列间没有分隔符。
 * - CSV 侧自行实现 RFC 4180 风格解析与生成：双引号包裹字段，字段内逗号 / 换行合法，
 *   内部双引号用 "" 转义。
 *
 * 换行约定：stringifyCsv / csvToFwf / fwfToCsv 的输出统一以一个换行符结尾
 * （空输入除外，空输入输出空串），输入末尾单个换行不会产生额外空行。
 *
 * 本模块不触碰 DOM 与 React，所有错误以结果对象的 error 字段返回而非抛出。
 */

/** FWF 列定义；填充字符固定为空格 */
export interface FwfColumn {
  /** 列名（错误提示使用；hasHeader=false 时也作为 CSV 表头） */
  name: string;
  /** 列宽，必须为正整数 */
  width: number;
  /** 对齐方式：left 右补空格，right 左补空格 */
  align: 'left' | 'right';
}

/** CSV → FWF 选项 */
export interface CsvToFwfOptions {
  /** 字段超出列宽时的策略：truncate 截断计数，error 返回中文错误 */
  overflow: 'truncate' | 'error';
  /** 输出行尾换行 */
  newline: '\r\n' | '\n';
  /** 首行是否为表头（表头仅跳过，不写入 FWF） */
  hasHeader: boolean;
}

/** FWF → CSV 选项 */
export interface FwfToCsvOptions {
  /** 输出 CSV 行尾换行 */
  newline: '\r\n' | '\n';
  /** 首行是否为表头（true 时首行切片结果作为 CSV 表头并跳过该行数据） */
  hasHeader: boolean;
}

/** CSV → FWF 结果 */
export interface CsvToFwfResult {
  /** FWF 输出文本 */
  output: string;
  /** truncate 模式下被截断的字段数 */
  truncatedCount: number;
  /** 错误信息，无错误为 null */
  error: string | null;
}

/** FWF → CSV 结果 */
export interface FwfToCsvResult {
  /** CSV 输出文本 */
  output: string;
  /** 实际使用的表头（hasHeader=true 取首行切片值，否则取 columns.name） */
  headers: string[];
  /** 错误信息，无错误为 null */
  error: string | null;
}

/**
 * 校验列定义集合，返回首个不合法列的中文错误
 *
 * @param columns - 列定义
 * @returns 错误信息；全部合法返回 null
 */
function validateColumns(columns: FwfColumn[]): string | null {
  if (columns.length === 0) {
    return '至少需要定义 1 列';
  }
  for (let i = 0; i < columns.length; i += 1) {
    const column = columns[i];
    if (!column) {
      return `第 ${i + 1} 列定义不完整`;
    }
    if (!Number.isInteger(column.width) || column.width <= 0) {
      return `列「${column.name || `第 ${i + 1} 列`}」的宽度必须为正整数`;
    }
    if (column.align !== 'left' && column.align !== 'right') {
      return `列「${column.name}」的对齐方式只能是 left 或 right`;
    }
  }
  return null;
}

/**
 * 按 RFC 4180 规则解析 CSV 文本为行 × 字段矩阵
 *
 * 支持双引号包裹字段、字段内逗号与换行（CRLF / LF）、"" 转义为一个 "；
 * 非引号字段按原样保留（不做 trim）；输入末尾单个换行不产生额外空行；空串返回 []。
 *
 * @param input - CSV 文本
 * @returns 二维字段矩阵
 */
export function parseCsv(input: string): string[][] {
  if (input === '') return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let pending = false;
  let index = 0;

  while (index < input.length) {
    const char = input.charAt(index);
    if (inQuotes) {
      if (char === '"') {
        if (input.charAt(index + 1) === '"') {
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
      pending = true;
      index += 1;
      continue;
    }
    if (char === ',') {
      row.push(field);
      field = '';
      pending = true;
      index += 1;
      continue;
    }
    if (char === '\r' || char === '\n') {
      if (char === '\r' && input.charAt(index + 1) === '\n') {
        index += 2;
      } else {
        index += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      pending = false;
      continue;
    }
    field += char;
    pending = true;
    index += 1;
  }

  if (pending || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * 将二维字段矩阵生成为 RFC 4180 风格 CSV 文本
 *
 * 字段含逗号、双引号、回车或换行时以双引号包裹，内部双引号翻倍。
 * 输出统一以一个换行符结尾（空数组返回空串），此约定由单测锁定。
 *
 * @param rows - 二维字段矩阵
 * @param newline - 行尾换行，默认 CRLF
 * @returns CSV 文本
 */
export function stringifyCsv(rows: string[][], newline: '\r\n' | '\n' = '\r\n'): string {
  if (rows.length === 0) return '';
  const lines = rows.map((record) =>
    record
      .map((field) => {
        const value = field ?? '';
        const needsQuote =
          value.includes(',') ||
          value.includes('"') ||
          value.includes('\r') ||
          value.includes('\n');
        return needsQuote ? `"${value.replace(/"/g, '""')}"` : value;
      })
      .join(','),
  );
  return `${lines.join(newline)}${newline}`;
}

/**
 * CSV → FWF
 *
 * 先 parseCsv；hasHeader=true 时首行作为表头跳过（不写入输出，也不参与行号与校验）。
 * 数据行字段数必须与列数一致；字段超出宽度按 overflow 策略截断计数或报错；
 * 不足宽度按 align 补空格。输出每行各列直接拼接，以指定 newline 连接并在末尾加一个 newline。
 *
 * @param input - CSV 文本
 * @param columns - FWF 列定义
 * @param options - 转换选项
 * @returns 含 output / truncatedCount / error 的结果对象
 */
export function csvToFwf(
  input: string,
  columns: FwfColumn[],
  options: CsvToFwfOptions,
): CsvToFwfResult {
  const columnError = validateColumns(columns);
  if (columnError) {
    return { output: '', truncatedCount: 0, error: columnError };
  }

  const rows = parseCsv(input);
  const dataRows = options.hasHeader ? rows.slice(1) : rows;

  const lines: string[] = [];
  let truncatedCount = 0;

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
    const record = dataRows[rowIndex];
    const dataRowNo = rowIndex + 1;
    if (!record || record.length !== columns.length) {
      return {
        output: '',
        truncatedCount: 0,
        error: `数据行 ${dataRowNo} 的字段数为 ${record?.length ?? 0}，与列数 ${columns.length} 不一致`,
      };
    }

    const cells: string[] = [];
    for (let colIndex = 0; colIndex < columns.length; colIndex += 1) {
      const column = columns[colIndex] as FwfColumn;
      const value = record[colIndex] ?? '';
      if (value.length > column.width) {
        if (options.overflow === 'error') {
          return {
            output: '',
            truncatedCount: 0,
            error: `数据行 ${dataRowNo} 列「${column.name}」内容超出列宽 ${column.width}`,
          };
        }
        truncatedCount += 1;
        cells.push(value.slice(0, column.width));
      } else if (value.length === column.width) {
        cells.push(value);
      } else {
        const padding = ' '.repeat(column.width - value.length);
        cells.push(column.align === 'left' ? `${value}${padding}` : `${padding}${value}`);
      }
    }
    lines.push(cells.join(''));
  }

  return {
    output: lines.length === 0 ? '' : `${lines.join(options.newline)}${options.newline}`,
    truncatedCount,
    error: null,
  };
}

/**
 * 按 \r\n / \n / \r 切分行，去掉末尾因末尾换行产生的空行
 *
 * @param input - FWF 文本
 * @returns 行数组
 */
function splitFwfLines(input: string): string[] {
  if (input === '') return [];
  const lines = input.split(/\r\n|\n|\r/);
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }
  return lines;
}

/**
 * FWF → CSV
 *
 * 按行切分（兼容 \r\n / \n / \r），按累计宽度切片；行长度不足时只切可用字符，
 * 得到短字段而不报错。left 列只去右侧填充空格（保留内容前导空格），
 * right 列只去左侧填充空格。hasHeader=true 时首行切片值作为表头并跳过该行数据，
 * 否则表头取 columns.name 且所有行都是数据。
 *
 * @param input - FWF 文本
 * @param columns - FWF 列定义
 * @param options - 转换选项
 * @returns 含 output / headers / error 的结果对象
 */
export function fwfToCsv(
  input: string,
  columns: FwfColumn[],
  options: FwfToCsvOptions,
): FwfToCsvResult {
  const columnError = validateColumns(columns);
  if (columnError) {
    return { output: '', headers: [], error: columnError };
  }

  const lines = splitFwfLines(input);
  if (lines.length === 0) {
    return {
      output: '',
      headers: columns.map((column) => column.name),
      error: null,
    };
  }

  const sliceRow = (line: string): string[] => {
    const cells: string[] = [];
    let start = 0;
    for (const column of columns) {
      const raw = line.slice(start, start + column.width);
      const trimmed =
        column.align === 'left' ? raw.replace(/ +$/g, '') : raw.replace(/^ +/g, '');
      cells.push(trimmed);
      start += column.width;
    }
    return cells;
  };

  let headers: string[];
  let dataLines: string[];
  if (options.hasHeader) {
    headers = sliceRow(lines[0] ?? '');
    dataLines = lines.slice(1);
  } else {
    headers = columns.map((column) => column.name);
    dataLines = lines;
  }

  const rows: string[][] = [];
  if (options.hasHeader) {
    rows.push(headers);
  }
  for (const line of dataLines) {
    rows.push(sliceRow(line));
  }

  return {
    output: stringifyCsv(rows, options.newline),
    headers,
    error: null,
  };
}
