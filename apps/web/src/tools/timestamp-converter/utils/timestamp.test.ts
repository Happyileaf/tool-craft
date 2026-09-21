import { describe, expect, it } from 'vitest';
import {
  describeRelativeTime,
  parseDateToTimestamp,
  parseTimestampToDate,
} from './timestamp';

describe('parseTimestampToDate', () => {
  it('识别 10 位秒级时间戳', () => {
    const result = parseTimestampToDate('0', 'zh-CN');
    expect(result.success).toBe(true);
    expect(result.iso).toBe('1970-01-01T00:00:00.000Z');
  });

  it('识别 13 位毫秒级时间戳', () => {
    const result = parseTimestampToDate('1700000000000', 'zh-CN');
    expect(result.success).toBe(true);
    expect(result.iso).toBe('2023-11-14T22:13:20.000Z');
  });

  it('非数字输入返回错误', () => {
    const result = parseTimestampToDate('abc', 'zh-CN');
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });
});

describe('parseDateToTimestamp', () => {
  it('将日期时间字符串转为秒与毫秒', () => {
    const result = parseDateToTimestamp('1970-01-01T00:00:00Z');
    expect(result.success).toBe(true);
    expect(result.seconds).toBe(0);
    expect(result.milliseconds).toBe(0);
  });

  it('空字符串返回错误', () => {
    const result = parseDateToTimestamp('');
    expect(result.success).toBe(false);
  });
});

describe('describeRelativeTime', () => {
  const now = 1_700_000_000_000;

  /**
   * 中文相对时间文案，取值与中文字典一致
   */
  const zhLabels = {
    justNow: '刚刚',
    shortly: '稍后',
    second: '秒',
    minute: '分钟',
    hour: '小时',
    day: '天',
    month: '个月',
    year: '年',
    pastTemplate: '{value} {unit}前',
    futureTemplate: '{value} {unit}后',
  };

  /**
   * 英文相对时间文案，取值与英文字典一致
   */
  const enLabels = {
    justNow: 'just now',
    shortly: 'shortly',
    second: 'seconds',
    minute: 'minutes',
    hour: 'hours',
    day: 'days',
    month: 'months',
    year: 'years',
    pastTemplate: '{value} {unit} ago',
    futureTemplate: 'in {value} {unit}',
  };

  it('三十秒内描述为刚刚', () => {
    expect(describeRelativeTime(now - 30_000, now, zhLabels)).toBe('刚刚');
  });

  it('数分钟前正确换算', () => {
    expect(describeRelativeTime(now - 180_000, now, zhLabels)).toBe('3 分钟前');
  });

  it('未来时间使用“后”', () => {
    expect(describeRelativeTime(now + 7_200_000, now, zhLabels)).toBe('2 小时后');
  });

  it('英文文案使用 ago 语序', () => {
    expect(describeRelativeTime(now - 180_000, now, enLabels)).toBe(
      '3 minutes ago',
    );
  });

  it('英文未来时间使用 in 语序', () => {
    expect(describeRelativeTime(now + 7_200_000, now, enLabels)).toBe(
      'in 2 hours',
    );
  });
});
