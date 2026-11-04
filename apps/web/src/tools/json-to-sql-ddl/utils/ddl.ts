/**
 * JSON 样本 → SQL CREATE TABLE（DDL）推断与生成纯函数集合。
 * 支持 MySQL / PostgreSQL / SQLite 三方言，全部为确定性纯函数，
 * 不触碰 DOM / React，也不发起网络请求。
 */

/** 支持的 SQL 方言 */
export type SqlDialect = 'mysql' | 'postgresql' | 'sqlite';

/** 推断出的字段逻辑类型 */
export type InferredKind =
  | 'unknown'
  | 'boolean'
  | 'integer'
  | 'bigint'
  | 'double'
  | 'varchar'
  | 'text'
  | 'json';

/** 单个字段的推断结果 */
export interface ColumnInference {
  /** 原始 JSON 字段名 */
  sourceName: string;
  /** 转换后的列名 */
  columnName: string;
  /** 推断的逻辑类型 */
  kind: InferredKind;
  /** VARCHAR 长度（kind 为 varchar 时有效，其余为 null） */
  maxLength: number | null;
  /** 全部样本中该字段是否始终存在且非 null */
  notNull: boolean;
  /** 样本中出现过 null（或字段缺失） */
  hasNull: boolean;
}

/** DDL 生成选项 */
export interface DdlOptions {
  /** 目标方言 */
  dialect: SqlDialect;
  /** 表名（原始形式，内部会做 snake_case 转换） */
  tableName: string;
  /** 是否追加自增主键列 */
  withPrimaryKey: boolean;
  /** 是否把列名与表名转为 snake_case */
  snakeCase: boolean;
  /** VARCHAR 是否在样本最大长度基础上预留余量 */
  varcharPadding: boolean;
  /** 超阈值的字符串是否退化为 TEXT */
  useTextThreshold: number | null;
  /** 是否生成 IF NOT EXISTS */
  ifNotExists: boolean;
  /** 是否在 CREATE 前生成 DROP TABLE IF EXISTS */
  dropTable: boolean;
  /** 是否生成列注释（仅 MySQL/PostgreSQL 实际输出注释） */
  withComments: boolean;
}

/** 默认选项 */
export const DEFAULT_DDL_OPTIONS: DdlOptions = {
  dialect: 'mysql',
  tableName: 'my_table',
  withPrimaryKey: true,
  snakeCase: true,
  varcharPadding: true,
  useTextThreshold: 500,
  ifNotExists: false,
  dropTable: false,
  withComments: true,
};

/** VARCHAR 余量倍数（最大长度 ×1.5 向上取整） */
const VARCHAR_PADDING_FACTOR = 1.5;

/** VARCHAR 最小长度 */
const VARCHAR_MIN_LENGTH = 8;

/** 32 位有符号整数上限 */
const INT32_MAX = 2147483647;

/** 32 位有符号整数下限 */
const INT32_MIN = -2147483648;

/** SQL 保留字（三方言通用的一小部分），命中时加双引号/反引号 */
const RESERVED_WORDS = new Set([
  'order',
  'group',
  'select',
  'from',
  'where',
  'table',
  'index',
  'key',
  'primary',
  'default',
  'values',
  'limit',
  'user',
  'type',
]);

/**
 * 把任意标识符转换为 snake_case
 *
 * 规则：驼峰拆词、连字符/空白/点分隔统一为下划线、连续非字母数字折叠、
 * 全大写缩写按词处理、保留首尾下划线、结果小写。
 *
 * @param input - 原始标识符
 * @returns snake_case 标识符
 */
export function toSnakeCase(input: string): string {
  const leading = input.match(/^_+/)?.[0] ?? '';
  const trailing = input.match(/_+$/)?.[0] ?? '';
  const core = input.replace(/^_+|_+$/g, '');
  if (core === '') {
    return input;
  }
  const words = core
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[-.\s]+/g, '_')
    .replace(/[^a-zA-Z0-9_]+/g, '_')
    .split(/[_\s]+/)
    .filter((word) => word.length > 0)
    .map((word) => word.toLowerCase());
  const joined = words.join('_').replace(/_+/g, '_');
  return `${leading}${joined}${trailing}`;
}

/**
 * 按选项把字段名转为列名
 *
 * @param name - 原始字段名
 * @param snakeCase - 是否启用 snake_case
 * @returns 列名（非法空名回退占位）
 */
export function toColumnName(name: string, snakeCase: boolean): string {
  const converted = snakeCase ? toSnakeCase(name) : name.trim();
  const safe = converted === '' ? 'column' : converted;
  return RESERVED_WORDS.has(safe.toLowerCase()) ? `${safe}_` : safe;
}

/**
 * 引用标识符，按方言使用反引号或双引号
 *
 * @param name - 标识符
 * @param dialect - 目标方言
 * @returns 带引号的标识符
 */
export function quoteIdentifier(name: string, dialect: SqlDialect): string {
  if (dialect === 'mysql') {
    return `\`${name.replace(/`/g, '``')}\``;
  }
  return `"${name.replace(/"/g, '""')}"`;
}

/**
 * 把逻辑类型映射为方言具体列类型
 *
 * @param kind - 逻辑类型
 * @param maxLength - VARCHAR 长度
 * @param dialect - 目标方言
 * @returns 方言列类型文本
 */
export function mapColumnType(
  kind: InferredKind,
  maxLength: number | null,
  dialect: SqlDialect,
): string {
  switch (kind) {
    case 'boolean':
      // MySQL 习惯用 TINYINT(1) 表示布尔
      return dialect === 'mysql' ? 'TINYINT(1)' : 'BOOLEAN';
    case 'integer':
      return 'INTEGER';
    case 'bigint':
      return 'BIGINT';
    case 'double':
      if (dialect === 'postgresql') {
        return 'DOUBLE PRECISION';
      }
      if (dialect === 'sqlite') {
        return 'REAL';
      }
      return 'DOUBLE';
    case 'varchar': {
      const length = maxLength ?? VARCHAR_MIN_LENGTH;
      if (dialect === 'sqlite') {
        // SQLite 对长度不敏感，统一用 TEXT
        return 'TEXT';
      }
      return `VARCHAR(${length})`;
    }
    case 'text':
      return dialect === 'postgresql' ? 'TEXT' : 'TEXT';
    case 'json':
      if (dialect === 'mysql') {
        return 'JSON';
      }
      if (dialect === 'postgresql') {
        return 'JSONB';
      }
      return 'TEXT';
    case 'unknown':
    default:
      if (dialect === 'sqlite') {
        return 'TEXT';
      }
      return 'TEXT';
  }
}

/**
 * 计算 VARCHAR 实际长度（按最大样本长度加余量并设下限）
 *
 * @param maxLength - 样本最大字符长度
 * @param padding - 是否加余量
 * @returns 最终长度
 */
export function resolveVarcharLength(maxLength: number, padding: boolean): number {
  if (!padding) {
    return Math.max(maxLength, 1);
  }
  return Math.max(Math.ceil(maxLength * VARCHAR_PADDING_FACTOR), VARCHAR_MIN_LENGTH);
}

/**
 * 判断一个 JS 数值是否为整数且落在 32 位有符号范围内
 *
 * @param value - 待判断数值
 * @returns true 表示可安全使用 INTEGER
 */
function isInt32(value: number): boolean {
  return Number.isInteger(value) && value >= INT32_MIN && value <= INT32_MAX;
}

/**
 * 合并两个逻辑类型，取「更宽」的类型作为综合推断结果
 *
 * 类型宽度顺序：unknown < boolean < integer < bigint < double < varchar < text < json。
 * 数值与字符串冲突时退化为文本；任何结构化值参与合并即为 json。
 *
 * @param current - 当前累计类型
 * @param incoming - 新样本类型
 * @returns 合并后的类型
 */
export function mergeKinds(current: InferredKind, incoming: InferredKind): InferredKind {
  if (current === 'unknown') {
    return incoming;
  }
  if (incoming === 'unknown') {
    return current;
  }
  if (current === incoming) {
    return current;
  }
  if (current === 'json' || incoming === 'json') {
    return 'json';
  }
  if (current === 'text' || incoming === 'text') {
    return 'text';
  }
  const numeric: InferredKind[] = ['boolean', 'integer', 'bigint', 'double'];
  if (numeric.includes(current) && numeric.includes(incoming)) {
    const order: InferredKind[] = ['boolean', 'integer', 'bigint', 'double'];
    return order.indexOf(current) >= order.indexOf(incoming) ? current : incoming;
  }
  // 数值与字符串相遇，统一退化为 varchar（长度另行累计）
  if (
    (numeric.includes(current) && incoming === 'varchar') ||
    (numeric.includes(incoming) && current === 'varchar')
  ) {
    return 'varchar';
  }
  return 'text';
}

/**
 * 由单个 JSON 值得到其逻辑类型与字符串长度
 *
 * @param value - 已解析的 JSON 值
 * @returns 逻辑类型；字符串同时返回长度
 */
function kindOfValue(value: unknown): { kind: InferredKind; length: number | null } {
  if (value === null || value === undefined) {
    return { kind: 'unknown', length: null };
  }
  if (typeof value === 'boolean') {
    return { kind: 'boolean', length: null };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { kind: isInt32(value) ? 'integer' : 'bigint', length: null };
    }
    return { kind: 'double', length: null };
  }
  if (typeof value === 'string') {
    return { kind: 'varchar', length: value.length };
  }
  // 对象与数组统一作为结构化 JSON
  return { kind: 'json', length: null };
}

/**
 * 综合一组 JSON 记录推断列定义
 *
 * @param records - 已解析的对象数组（每个元素须为普通对象）
 * @param snakeCase - 是否输出 snake_case 列名
 * @param useTextThreshold - VARCHAR 超该长度退化为 TEXT 的阈值，null 表示不退化
 * @param varcharPadding - VARCHAR 是否加余量
 * @returns 按首次出现顺序排列的列推断结果
 * @throws 顶层元素不是对象时抛出错误
 */
export function inferColumns(
  records: unknown[],
  snakeCase: boolean,
  useTextThreshold: number | null,
  varcharPadding: boolean,
): ColumnInference[] {
  if (records.length === 0) {
    throw new Error('JSON 中没有可推断的对象样本');
  }

  /** 保持字段首次出现顺序 */
  const order: string[] = [];
  const accumulator = new Map<
    string,
    { kind: InferredKind; maxLength: number; notNull: boolean; seen: number }
  >();

  records.forEach((record, recordIndex) => {
    if (typeof record !== 'object' || record === null || Array.isArray(record)) {
      throw new Error(`第 ${recordIndex + 1} 条样本不是 JSON 对象（数组或标量不能直接建表）`);
    }
    const entries = Object.entries(record as Record<string, unknown>);
    const presentKeys = new Set(entries.map(([key]) => key));

    for (const [key, value] of entries) {
      if (!accumulator.has(key)) {
        order.push(key);
        accumulator.set(key, { kind: 'unknown', maxLength: 0, notNull: true, seen: 0 });
      }
      const acc = accumulator.get(key);
      if (!acc) {
        continue;
      }
      acc.seen += 1;
      const { kind, length } = kindOfValue(value);
      if (kind === 'unknown') {
        acc.notNull = false;
      } else {
        acc.kind = mergeKinds(acc.kind, kind);
        if (length !== null) {
          acc.maxLength = Math.max(acc.maxLength, length);
        }
      }
    }

    // 本条样本缺失的字段视为 null
    for (const key of order) {
      if (!presentKeys.has(key)) {
        const acc = accumulator.get(key);
        if (acc) {
          acc.notNull = false;
        }
      }
    }
  });

  return order.map((key) => {
    const acc = accumulator.get(key);
    let kind = acc?.kind ?? 'unknown';
    let maxLength: number | null = null;
    if (kind === 'varchar' && acc) {
      maxLength = resolveVarcharLength(acc.maxLength, varcharPadding);
      if (useTextThreshold !== null && maxLength > useTextThreshold) {
        kind = 'text';
        maxLength = null;
      }
    }
    if (kind === 'unknown') {
      // 全部样本都是 null：无法推断，保留占位并允许为空
      kind = 'text';
    }
    return {
      sourceName: key,
      columnName: toColumnName(key, snakeCase),
      kind,
      maxLength,
      notNull: acc?.notNull ?? false,
      hasNull: !(acc?.notNull ?? false),
    };
  });
}

/**
 * 解析 JSON 文本为对象记录数组
 *
 * 单对象自动包装为长度 1 的数组；对象数组直接使用。
 * 解析失败时尽量提取错误位置并给出 1 起始行号。
 *
 * @param text - JSON 文本
 * @returns 对象记录数组
 * @throws 空输入、非对象顶层或 JSON 语法错误时抛出含行号的错误
 */
export function parseJsonRecords(text: string): unknown[] {
  const trimmed = text.trim();
  if (trimmed === '') {
    throw new Error('请输入 JSON 内容');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : 'JSON 解析失败';
    const lineMatch = message.match(/line\s+(\d+)/i);
    const positionMatch = message.match(/position\s+(\d+)/i);
    if (lineMatch) {
      throw new Error(`JSON 语法错误（第 ${lineMatch[1]} 行）：${message}`);
    }
    if (positionMatch) {
      const position = Number(positionMatch[1]);
      const line = trimmed.slice(0, position).split('\n').length;
      throw new Error(`JSON 语法错误（约第 ${line} 行）：${message}`);
    }
    throw new Error(`JSON 语法错误：${message}`);
  }
  if (Array.isArray(parsed)) {
    if (parsed.some((item) => typeof item !== 'object' || item === null || Array.isArray(item))) {
      throw new Error('数组中的每个元素都必须是 JSON 对象（标量或嵌套数组不能直接建表）');
    }
    return parsed;
  }
  if (typeof parsed === 'object' && parsed !== null) {
    return [parsed];
  }
  throw new Error('顶层 JSON 必须是对象或对象数组');
}

/**
 * 生成自增主键列的方言定义
 *
 * @param dialect - 目标方言
 * @returns 主键列定义片段
 */
function primaryKeyDefinition(dialect: SqlDialect): string {
  if (dialect === 'mysql') {
    return '  `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY';
  }
  if (dialect === 'postgresql') {
    return '  "id" SERIAL PRIMARY KEY';
  }
  return '  "id" INTEGER PRIMARY KEY AUTOINCREMENT';
}

/**
 * 依据推断结果与选项生成完整 CREATE TABLE DDL
 *
 * @param columns - 列推断结果
 * @param options - 生成选项
 * @returns 可直接执行的 DDL 文本（以分号结尾）
 */
export function generateDdl(columns: ColumnInference[], options: DdlOptions): string {
  const tableName = toColumnName(options.tableName, options.snakeCase);
  const quotedTable = quoteIdentifier(tableName, options.dialect);
  const lines: string[] = [];

  if (options.dropTable) {
    lines.push(`DROP TABLE IF EXISTS ${quotedTable};`);
    lines.push('');
  }

  const createPrefix = options.ifNotExists ? 'CREATE TABLE IF NOT EXISTS' : 'CREATE TABLE';
  lines.push(`${createPrefix} ${quotedTable} (`);

  if (options.withPrimaryKey) {
    lines.push(primaryKeyDefinition(options.dialect));
  }

  columns.forEach((column, index) => {
    const quotedColumn = quoteIdentifier(column.columnName, options.dialect);
    const type = mapColumnType(column.kind, column.maxLength, options.dialect);
    const nullable = column.notNull ? ' NOT NULL' : '';
    let line = `  ${quotedColumn} ${type}${nullable}`;

    if (
      options.withComments &&
      column.sourceName !== column.columnName &&
      options.dialect !== 'sqlite'
    ) {
      const comment = column.sourceName.replace(/'/g, "''");
      line += ` COMMENT '${comment}'`;
    }

    const isLast = index === columns.length - 1;
    if (options.withPrimaryKey || !isLast) {
      line += ',';
    }
    lines.push(line);
  });

  lines.push(');');

  // PostgreSQL 的列注释走独立 COMMENT 语句
  if (options.withComments && options.dialect === 'postgresql') {
    const commentLines = columns
      .filter((column) => column.sourceName !== column.columnName)
      .map(
        (column) =>
          `COMMENT ON COLUMN ${quotedTable}.${quoteIdentifier(column.columnName, options.dialect)} IS '${column.sourceName.replace(/'/g, "''")}';`,
      );
    if (commentLines.length > 0) {
      lines.push('');
      lines.push(...commentLines);
    }
  }

  return lines.join('\n');
}

/**
 * 端到端：从 JSON 文本直接生成 DDL
 *
 * @param jsonText - JSON 文本
 * @param options - 生成选项
 * @returns DDL 文本
 */
export function jsonToDdl(jsonText: string, options: DdlOptions): string {
  const records = parseJsonRecords(jsonText);
  const columns = inferColumns(
    records,
    options.snakeCase,
    options.useTextThreshold,
    options.varcharPadding,
  );
  return generateDdl(columns, options);
}
