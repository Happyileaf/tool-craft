import { z } from 'zod';
import type { CapabilityDefinition } from '@tool-craft/core';

/** 时间戳转换参数 */
type TimestampConvertParams = {
  /** 转换方向：toTimestamp 将日期时间文本转为时间戳；toDateTime 将时间戳转为 ISO 8601 文本 */
  direction: 'toTimestamp' | 'toDateTime';
  /** 时间戳单位：seconds 秒；milliseconds 毫秒 */
  unit: 'seconds' | 'milliseconds';
};

/**
 * 将日期时间输入规范化为 Date.parse 可稳定解析的形式
 *
 * 'YYYY-MM-DD HH:mm:ss' 中的空格替换为 'T'；不带时区标记的日期时间文本追加 'Z' 按 UTC 解析，
 * 使结果不随宿主机时区变化，且与 toDateTime 方向的 UTC 输出互为确定性逆转换
 *
 * @param input - 日期时间文本，支持 'YYYY-MM-DD HH:mm:ss' 与 ISO 8601 格式
 * @returns 可直接交给 Date.parse 的文本
 */
function normalizeDateTimeText(input: string): string {
  const replacedText = input.trim().replace(/^(\d{4}-\d{2}-\d{2}) /, '$1T');
  const isDateTimeWithoutZone =
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(replacedText) &&
    !/(?:Z|[+-]\d{2}:?\d{2})$/i.test(replacedText);
  return isDateTimeWithoutZone ? `${replacedText}Z` : replacedText;
}

/**
 * 时间戳转换能力：在日期时间文本与时间戳之间双向转换
 *
 * toTimestamp 输出按 unit 取整的秒/毫秒整数字符串；toDateTime 输出 toISOString() 的 UTC ISO 8601 字符串，
 * 两个方向均为 UTC 语义，结果确定
 */
const timestampConvertCapability: CapabilityDefinition<
  string,
  TimestampConvertParams,
  string
> = {
  id: 'time.timestamp-convert',
  name: '时间戳转换',
  description: '在日期时间文本与秒/毫秒时间戳之间双向转换',
  inputSchema: z.string(),
  paramsSchema: z.object({
    direction: z.enum(['toTimestamp', 'toDateTime']),
    unit: z.enum(['seconds', 'milliseconds']).default('seconds'),
  }),
  outputSchema: z.string(),
  transport: { input: 'json', output: 'json' },
  execute: (input, params) => {
    if (params.direction === 'toTimestamp') {
      const milliseconds = Date.parse(normalizeDateTimeText(input));
      if (Number.isNaN(milliseconds)) {
        throw new Error(`非法日期时间文本，无法解析：${input}`);
      }
      return String(
        params.unit === 'seconds' ? Math.floor(milliseconds / 1000) : milliseconds,
      );
    }
    const trimmedInput = input.trim();
    const parsedNumber = Number(trimmedInput);
    if (trimmedInput === '' || Number.isNaN(parsedNumber)) {
      throw new Error(`非法时间戳文本，无法解析为数字：${input}`);
    }
    const milliseconds = params.unit === 'seconds' ? parsedNumber * 1000 : parsedNumber;
    return new Date(milliseconds).toISOString();
  },
};

export { timestampConvertCapability, type TimestampConvertParams };
