/**
 * FWF ↔ CSV 转换器工具内常量
 */
import type { FwfColumn } from './utils/fwfCsv';

/**
 * 转换方向枚举
 */
export enum FwfDirectionEnum {
  /** CSV 文本转定宽文本 */
  CSV_TO_FWF = 'csv-to-fwf',
  /** 定宽文本转 CSV */
  FWF_TO_CSV = 'fwf-to-csv',
}

/**
 * 顶部提示文案
 */
export const HINT =
  '固定列宽文本（FWF）常见于主机报表、银行账单与遗留系统导出：按列名、宽度与对齐方式把 CSV 与定宽文本相互转换，填充字符固定为空格。全部在浏览器本地完成。';

/**
 * 默认列定义（同时作为「示例列」填充内容）
 */
export const DEFAULT_COLUMNS: FwfColumn[] = [
  { name: 'name', width: 10, align: 'left' },
  { name: 'age', width: 5, align: 'right' },
  { name: 'city', width: 12, align: 'left' },
];

/**
 * CSV → FWF 方向的示例输入，包含一个带引号与逗号的字段
 */
export const DEFAULT_CSV_SAMPLE = `name,age,city
"Smith, John",30,New York
Jane,25,London`;

/**
 * 按默认列定义把一行值拼成严格定宽文本
 *
 * @param values - 与列顺序对应的字段值
 * @returns 定宽行
 */
function fwfLine(values: string[]): string {
  return DEFAULT_COLUMNS.map((column, index) => {
    const value = values[index] ?? '';
    return column.align === 'left'
      ? value.padEnd(column.width)
      : value.padStart(column.width);
  }).join('');
}

/**
 * FWF → CSV 方向的示例输入（按默认列定义对齐，保证空格数准确）
 */
export const DEFAULT_FWF_SAMPLE = `${[
  fwfLine(['name', 'age', 'city']),
  fwfLine(['John', '30', 'New York']),
  fwfLine(['Jane', '25', 'London']),
].join('\n')}\n`;
