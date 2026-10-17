/**
 * cURL 转代码 工具内常量
 */

import { TargetLanguageEnum } from './utils/curl';

export { TargetLanguageEnum };

/**
 * 工具首次载入时填入的默认 cURL 示例
 */
export const DEFAULT_CURL = `curl -X POST 'https://api.example.com/items' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json' \\
  -d '{"name": "A", "price": 12}'`;

/**
 * 目标语言选项，供下拉选择控件渲染
 */
export const LANGUAGE_OPTIONS: { label: string; value: TargetLanguageEnum }[] = [
  { label: 'JavaScript (fetch)', value: TargetLanguageEnum.JAVASCRIPT_FETCH },
  { label: 'Node.js (axios)', value: TargetLanguageEnum.NODE_AXIOS },
  { label: 'Python (requests)', value: TargetLanguageEnum.PYTHON_REQUESTS },
  { label: 'Go (net/http)', value: TargetLanguageEnum.GO },
];

/**
 * 各目标语言的中文标签映射
 */
export const LANGUAGE_LABELS: Record<TargetLanguageEnum, string> = {
  [TargetLanguageEnum.JAVASCRIPT_FETCH]: 'JavaScript (fetch)',
  [TargetLanguageEnum.NODE_AXIOS]: 'Node.js (axios)',
  [TargetLanguageEnum.PYTHON_REQUESTS]: 'Python (requests)',
  [TargetLanguageEnum.GO]: 'Go (net/http)',
};
