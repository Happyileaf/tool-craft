/**
 * Markdown 管道表格生成：解析 CSV / TSV / Excel 粘贴文本并输出 GFM 管道表格。
 * 纯函数、零依赖，不触碰 DOM。
 */

/** 列对齐方式 */
export type ColumnAlign = 'left' | 'center' | 'right';

/** 输入分隔格式 */
export type DelimiterKind = 'auto' | 'csv' | 'tsv';

/** 生成选项 */
export interface TableOptions {
  /** 首行是否作为表头 */
  hasHeader: boolean;
  /** 各列对齐方式，长度不足时按 left 补齐 */
  align: ColumnAlign[];
  /** 是否补齐对齐空格（关闭时为紧凑管道表格） */
  padded: boolean;
  /** 是否把内容中的竖线转义为 \| */
  escapePipes: boolean;
  /** 输入分隔格式，auto 时按制表符 / 逗号自动探测 */
  delimiter: DelimiterKind;
}

/** 生成结果 */
export interface TableResult {
  /** Markdown 表格文本 */
  markdown: string;
  /** 列数 */
  columnCount: number;
  /** 数据行数（不含表头） */
  dataRowCount: number;
  /** 规范化时被补齐过空列的行号（1-based，含表头行） */
  paddedRows: number[];
}

/**
 * 探测分隔符：含制表符按 TSV，否则按 CSV。
 *
 * @param text - 原始文本
 * @returns 实际使用的字段分隔符
 */
export function detectDelimiter(text: string): string {
  return text.includes('\t') ? '\t' : ',';
}

/**
 * 解析单行 CSV / TSV，支持双引号包裹与 "" 转义。
 *
 * @param line - 单行文本
 * @param delimiter - 字段分隔符
 * @returns 原始单元格数组（保留首尾空格，引号仅在外层包裹时去除）
 */
export function parseDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (line.startsWith(delimiter, i)) {
      cells.push(current);
      current = '';
      i += delimiter.length - 1;
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells;
}

/**
 * 解析 CSV / TSV 文本为二维数组：跳过空行，支持引号内换行。
 *
 * @param text - 原始文本
 * @param delimiter - 字段分隔符
 * @returns 行数组，每行一个单元格数组
 */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    current.push(field);
    field = '';
  };

  const pushRow = () => {
    rows.push(current);
    current = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (text.startsWith(delimiter, i)) {
      pushField();
      i += delimiter.length - 1;
    } else if (char === '\n') {
      pushField();
      pushRow();
    } else if (char === '\r') {
      if (text[i + 1] === '\n') i += 1;
      pushField();
      pushRow();
    } else {
      field += char;
    }
  }
  pushField();
  pushRow();

  return rows.filter((row) => !(row.length === 1 && (row[0] ?? '').trim() === ''));
}

/**
 * 无表头时生成第 n 列的列名：A、B、…、Z、AA、AB……
 *
 * @param index - 列索引（0-based）
 * @returns 列名字母
 */
export function columnLetter(index: number): string {
  let remaining = index;
  let label = '';
  do {
    label = String.fromCharCode(65 + (remaining % 26)) + label;
    remaining = Math.floor(remaining / 26) - 1;
  } while (remaining >= 0);
  return label;
}

/**
 * 规范化单元格：空值转空串、换行转 `<br>`、按需转义竖线并去除首尾空白。
 *
 * @param value - 原始单元格
 * @param escapePipes - 是否转义竖线
 * @returns 可安全放入管道表格的单元格文本
 */
export function normalizeCell(value: string | null | undefined, escapePipes: boolean): string {
  let text = (value ?? '').replace(/\r\n?/g, '\n').trim();
  text = text.replace(/\n+/g, '<br>');
  if (escapePipes) text = text.replace(/\|/g, '\\|');
  return text;
}

/**
 * 由二维数据生成 GFM Markdown 管道表格。
 *
 * @param rows - 已解析的行（首行为表头或全部为数据）
 * @param options - 生成选项
 * @returns 表格文本与统计信息
 * @throws 输入为空时抛出中文错误
 */
export function buildMarkdownTable(rows: string[][], options: TableOptions): TableResult {
  if (rows.length === 0 || rows.every((row) => row.every((cell) => cell.trim() === ''))) {
    throw new Error('输入内容为空，请粘贴 CSV / TSV 数据或从 Excel 复制表格');
  }

  const columnCount = Math.max(...rows.map((row) => row.length));
  const paddedRows: number[] = [];

  const normalized = rows.map((row, rowIndex) => {
    if (row.length < columnCount) paddedRows.push(rowIndex + 1);
    return Array.from({ length: columnCount }, (_, columnIndex) =>
      normalizeCell(row[columnIndex] ?? '', options.escapePipes),
    );
  });

  const header = options.hasHeader
    ? (normalized[0] ?? Array.from({ length: columnCount }, () => ''))
    : Array.from({ length: columnCount }, (_, index) => columnLetter(index));
  const body = options.hasHeader ? normalized.slice(1) : normalized;

  const widths = Array.from({ length: columnCount }, (_, columnIndex) => {
    let max = (header[columnIndex] ?? '').length;
    for (const row of body) {
      max = Math.max(max, (row[columnIndex] ?? '').length);
    }
    return max;
  });

  const alignOf = (columnIndex: number): ColumnAlign =>
    options.align[columnIndex] === 'center' || options.align[columnIndex] === 'right'
      ? options.align[columnIndex]
      : 'left';

  const renderRow = (cells: string[]): string => {
    const parts = cells.map((cell, columnIndex) => {
      if (!options.padded) return ` ${cell} `;
      const width = widths[columnIndex] ?? cell.length;
      const space = Math.max(width - cell.length, 0);
      if (alignOf(columnIndex) === 'center') {
        const left = Math.floor(space / 2);
        return ` ${' '.repeat(left)}${cell}${' '.repeat(space - left)} `;
      }
      if (alignOf(columnIndex) === 'right') {
        return ` ${' '.repeat(space)}${cell} `;
      }
      return ` ${cell}${' '.repeat(space)} `;
    });
    return `|${parts.join('|')}|`;
  };

  const separatorParts = Array.from({ length: columnCount }, (_, columnIndex) => {
    const width = Math.max(widths[columnIndex] ?? 0, 3);
    const dashes = '-'.repeat(options.padded ? width : 3);
    const align = alignOf(columnIndex);
    const leftColon = align === 'left' || align === 'center' ? ':' : '-';
    const rightColon = align === 'right' || align === 'center' ? ':' : '-';
    return `${leftColon}${dashes.slice(1, -1)}${rightColon}`;
  });

  const lines = [
    renderRow(header),
    `|${separatorParts.map((part) => (options.padded ? ` ${part} ` : part)).join('|')}|`,
    ...body.map(renderRow),
  ];

  return {
    markdown: lines.join('\n'),
    columnCount,
    dataRowCount: body.length,
    paddedRows,
  };
}

/**
 * 一站式：解析分隔文本并生成 Markdown 表格。
 *
 * @param text - CSV / TSV 原始文本
 * @param options - 生成选项
 * @returns 表格文本与统计信息
 */
export function generateTable(text: string, options: TableOptions): TableResult {
  const delimiter =
    options.delimiter === 'auto' ? detectDelimiter(text) : options.delimiter === 'tsv' ? '\t' : ',';
  const rows = parseDelimited(text, delimiter);
  return buildMarkdownTable(rows, options);
}
