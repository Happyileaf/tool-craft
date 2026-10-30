/**
 * CSV 解析与 SQL INSERT 生成的纯函数模块（零依赖，浏览器本地执行）
 */

/** 列分隔符（auto 按首行出现次数自动判定） */
export type CsvDelimiter = 'auto' | ',' | ';' | '\t' | '|';

/** 标识符引号风格 */
export type IdentifierQuote = 'backtick' | 'double' | 'bracket';

/** 空单元格处理方式 */
export type NullMode = 'empty-to-null' | 'empty-to-string';

/** CSV 解析结果 */
export interface CsvTable {
  /** 列名（首行） */
  headers: string[];
  /** 数据行（每行为与列等长的字段数组） */
  rows: string[][];
}

/** SQL 生成选项 */
export interface SqlOptions {
  /** 目标表名 */
  table: string;
  /** 自定义列名（为空则使用 CSV 首行） */
  columns?: string[];
  /** 每条 INSERT 包含的数据行数，<=0 表示全部合并为一条 */
  batchSize?: number;
  /** 标识符引号风格 */
  quote?: IdentifierQuote;
  /** 空单元格处理 */
  nullMode?: NullMode;
  /** 未加引号的 NULL 字样是否视为 SQL NULL */
  nullKeyword?: boolean;
}

/** 候选自动探测分隔符（按首行出现次数，逗号优先） */
const CANDIDATE_DELIMITERS: Array<Exclude<CsvDelimiter, 'auto'>> = [',', ';', '\t', '|'];

/**
 * 探测 CSV 文本的列分隔符：取首行中出现次数最多且至少 1 次的候选，默认逗号
 *
 * @param text - CSV 原始文本
 * @returns 实际分隔符
 */
export function detectDelimiter(text: string): Exclude<CsvDelimiter, 'auto'> {
  const firstLine = text.replace(/^﻿/, '').split(/\r\n|\n|\r/)[0] ?? '';
  let best: Exclude<CsvDelimiter, 'auto'> = ',';
  let bestCount = 0;
  for (const candidate of CANDIDATE_DELIMITERS) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }
  return best;
}

/**
 * 解析符合 RFC 4180 约定的 CSV 文本：支持双引号包裹、字段内分隔符 / 换行、
 * 双引号转义（""），自动剥离 UTF-8 BOM，首行作为列名
 *
 * @param text - CSV 原始文本
 * @param delimiter - 列分隔符，auto 时自动探测
 * @returns 列名与数据行
 * @throws 文本为空或存在未闭合引号时抛出错误
 */
export function parseCsv(text: string, delimiter: CsvDelimiter = 'auto'): CsvTable {
  const input = text.replace(/^﻿/, '');
  if (input.trim().length === 0) {
    throw new Error('CSV 内容为空');
  }
  const sep = delimiter === 'auto' ? detectDelimiter(input) : delimiter;

  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let quoted = false;

  const pushField = () => {
    record.push(field);
    field = '';
  };
  const pushRecord = () => {
    pushField();
    records.push(record);
    record = [];
  };

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === sep) {
      pushField();
    } else if (char === '\n') {
      pushRecord();
    } else if (char === '\r') {
      if (input[index + 1] === '\n') {
        index += 1;
      }
      pushRecord();
    } else {
      field += char;
    }
  }
  if (quoted) {
    throw new Error('CSV 中存在未闭合的双引号');
  }
  // 末尾仍有内容（无结尾换行）时收尾；纯空尾行不产生空记录
  if (field.length > 0 || record.length > 0) {
    pushRecord();
  }

  const nonEmpty = records.filter((cells) => cells.some((cell) => cell.trim().length > 0));
  if (nonEmpty.length === 0) {
    throw new Error('CSV 内容为空');
  }
  const [headers, ...rows] = nonEmpty;
  return { headers: headers ?? [], rows };
}

/**
 * 按所选风格引用 SQL 标识符（表名 / 列名）
 *
 * @param name - 标识符
 * @param quote - 引号风格
 * @returns 包裹后的标识符
 */
export function quoteIdentifier(name: string, quote: IdentifierQuote = 'backtick'): string {
  const trimmed = name.trim();
  if (quote === 'backtick') {
    return `\`${trimmed.replace(/`/g, '``')}\``;
  }
  if (quote === 'bracket') {
    return `[${trimmed.replace(/]/g, ']]')}]`;
  }
  return `"${trimmed.replace(/"/g, '""')}"`;
}

/** 整数或浮点数（不含前导零、NaN / Infinity） */
const NUMERIC_LITERAL = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

/**
 * 将单个 CSV 字段转换为 SQL 字面量
 *
 * @param value - 原始字段
 * @param nullMode - 空单元格处理
 * @param nullKeyword - 是否把 NULL 字样识别为 NULL（大小写不敏感）
 * @returns SQL 值（含引号、NULL 或裸数字）
 */
export function toSqlValue(
  value: string,
  nullMode: NullMode = 'empty-to-null',
  nullKeyword = true,
): string {
  if (value === '' && nullMode === 'empty-to-null') {
    return 'NULL';
  }
  if (nullKeyword && value.trim().toUpperCase() === 'NULL') {
    return 'NULL';
  }
  if (NUMERIC_LITERAL.test(value.trim())) {
    return value.trim();
  }
  return `'${value.replace(/'/g, "''")}'`;
}

/**
 * 生成 SQL INSERT 语句
 *
 * @param table - 解析后的 CSV 数据
 * @param options - 生成选项
 * @returns 以分号结尾的 INSERT 语句文本
 * @throws 表名 / 列名非法或列数不匹配时抛出错误
 */
export function buildSqlInserts(table: CsvTable, options: SqlOptions): string {
  const tableName = options.table.trim();
  if (!tableName) {
    throw new Error('表名不能为空');
  }
  const columns = options.columns && options.columns.length > 0 ? options.columns : table.headers;
  if (columns.length === 0) {
    throw new Error('至少需要一列');
  }
  if (columns.some((column) => column.trim().length === 0)) {
    throw new Error('列名不能为空');
  }
  const badRow = table.rows.find((row) => row.length !== table.headers.length);
  if (badRow) {
    throw new Error(
      `存在列数不匹配的数据行：期望 ${table.headers.length} 列，实际 ${badRow.length} 列`,
    );
  }

  const quote = options.quote ?? 'backtick';
  const nullMode = options.nullMode ?? 'empty-to-null';
  const nullKeyword = options.nullKeyword ?? true;
  const batchSize = options.batchSize ?? 0;

  const columnList = columns.map((column) => quoteIdentifier(column, quote)).join(', ');
  const head = `INSERT INTO ${quoteIdentifier(tableName, quote)} (${columnList}) VALUES`;

  const valueRows = table.rows.map((row) => {
    // 自定义列可能比 CSV 列少：按自定义列数截取
    return row
      .slice(0, columns.length)
      .map((cell) => toSqlValue(cell, nullMode, nullKeyword))
      .join(', ');
  });

  if (valueRows.length === 0) {
    return '';
  }

  const chunks: string[] = [];
  if (batchSize <= 0) {
    chunks.push(`${head}\n  ${valueRows.map((row) => `(${row})`).join(',\n  ')};`);
  } else {
    for (let offset = 0; offset < valueRows.length; offset += batchSize) {
      const group = valueRows.slice(offset, offset + batchSize);
      chunks.push(`${head}\n  ${group.map((row) => `(${row})`).join(',\n  ')};`);
    }
  }
  return chunks.join('\n');
}
