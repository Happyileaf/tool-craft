/**
 * SRI 哈希生成器工具内常量
 */
import type { SriAlgorithm } from './utils/sri';

/** 工作模式 */
export enum SriModeEnum {
  /** 根据内容生成 integrity 串 */
  GENERATE = 'generate',
  /** 用 integrity 串校验内容 */
  VERIFY = 'verify',
}

/** 输入载体类型 */
export enum InputTypeEnum {
  /** UTF-8 文本 */
  TEXT = 'text',
  /** 本地文件 */
  FILE = 'file',
}

/** 可选摘要算法列表（SRI 规范推荐的 SHA-2 家族） */
export const ALGORITHM_OPTIONS: { label: string; value: SriAlgorithm }[] = [
  { label: 'SHA-256', value: 'sha256' },
  { label: 'SHA-384', value: 'sha384' },
  { label: 'SHA-512', value: 'sha512' },
];

/** 模式选择项数据源 */
export const MODE_OPTIONS: { label: string; value: SriModeEnum }[] = [
  { label: '生成 integrity 哈希', value: SriModeEnum.GENERATE },
  { label: '校验 integrity 串', value: SriModeEnum.VERIFY },
];

/** 默认示例文本 */
export const DEFAULT_TEXT = 'console.log("Hello, SRI");';

/** 校验模式默认填入的 integrity 串占位 */
export const DEFAULT_INTEGRITY = '';
