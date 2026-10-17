/**
 * CSV ↔ JSON converter 工具内常量
 */

/**
 * 转换方向枚举
 */
export enum CsvDirectionEnum {
  /** CSV 文本转 JSON */
  CSV_TO_JSON = 'csv-to-json',
  /** JSON 文本转 CSV */
  JSON_TO_CSV = 'json-to-csv',
}

/**
 * 分隔符选项数据结构
 */
export interface DelimiterOption {
  /** 面向用户展示的分隔符名称 */
  label: string;
  /** 实际使用的分隔符字符 */
  value: string;
}

/**
 * 可选字段分隔符集合
 */
export const DELIMITER_OPTIONS: DelimiterOption[] = [
  { label: '逗号 (,)', value: ',' },
  { label: '制表符 (Tab)', value: '\t' },
  { label: '分号 (;)', value: ';' },
];

/**
 * 默认字段分隔符
 */
export const DEFAULT_DELIMITER = ',';

/**
 * CSV → JSON 方向的示例输入
 */
export const DEFAULT_CSV_SAMPLE = `name,age,city
"Smith, John",30,New York
Jane,25,London`;

/**
 * JSON → CSV 方向的示例输入
 */
export const DEFAULT_JSON_SAMPLE = `[
  { "name": "John", "age": 30, "city": "New York" },
  { "name": "Jane", "age": 25, "city": "London" }
]`;
