import { z } from 'zod';
import type { CapabilityDefinition } from '@tool-craft/core';

/** JSON 格式化参数 */
type JsonFormatParams = {
  /** 缩进方式：'2' / '4' 表示空格数，'tab' 表示制表符 */
  indent: '2' | '4' | 'tab';
  /** 是否递归按键名字典序排序（含嵌套对象与数组内对象） */
  sortKeys: boolean;
};

/**
 * 递归按键名字典序排序 JSON 值：对象返回按键名排序的新对象，数组逐项递归处理，其余原样返回
 *
 * @param value - 任意 JSON 值
 * @returns 排序后的新值，不修改原值
 */
function sortJsonValueByKey(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sortJsonValueByKey(item));
  }
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(source).sort()) {
      sorted[key] = sortJsonValueByKey(source[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * JSON 格式化能力：解析输入 JSON 文本后按指定缩进重新序列化
 *
 * 非法 JSON 时 JSON.parse 抛出的 SyntaxError 自带位置定位信息，由 executor 包装为 EXECUTION_ERROR
 */
const jsonFormatCapability: CapabilityDefinition<string, JsonFormatParams, string> = {
  id: 'data.json-format',
  name: 'JSON 格式化',
  description: '格式化与美化 JSON 文本，支持缩进与键名排序',
  inputSchema: z.string(),
  paramsSchema: z.object({
    indent: z.enum(['2', '4', 'tab']).default('2'),
    sortKeys: z.boolean().default(false),
  }),
  outputSchema: z.string(),
  transport: { input: 'json', output: 'json' },
  execute: (input, params) => {
    const parsed: unknown = JSON.parse(input);
    const target = params.sortKeys ? sortJsonValueByKey(parsed) : parsed;
    return JSON.stringify(target, null, params.indent === 'tab' ? '\t' : Number(params.indent));
  },
};

export { jsonFormatCapability, type JsonFormatParams };
