/**
 * 工具模式
 */
export enum JwtModeEnum {
  PARSE = 'parse',
  GENERATE = 'generate',
}

/**
 * 默认样例输入
 */
export const DEFAULT_SAMPLE_INPUT = '';

/**
 * 支持的算法枚举
 */
export enum JwtAlgorithmEnum {
  HS256 = 'HS256',
}

/**
 * 算法选项
 */
export const AlgorithmOptions = [
  { label: 'HS256 (HMAC-SHA256)', value: JwtAlgorithmEnum.HS256 },
];
