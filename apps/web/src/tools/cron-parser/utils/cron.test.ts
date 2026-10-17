import { describe, it, expect } from 'vitest';
import { describeCron, describeField, getNextRuns, parseCron } from './cron';

describe('parseCron', () => {
  it('解析全通配表达式并展开各字段全部取值', () => {
    const parsed = parseCron('* * * * *');
    expect(parsed.minute.values).toHaveLength(60);
    expect(parsed.hour.values).toHaveLength(24);
    expect(parsed.dayOfMonth.values).toHaveLength(31);
    expect(parsed.month.values).toHaveLength(12);
    expect(parsed.dayOfWeek.values).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('支持步长语法 */n', () => {
    expect(parseCron('*/5 * * * *').minute.values).toEqual([
      0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55,
    ]);
  });

  it('支持范围与列表语法', () => {
    expect(parseCron('1-5 * * * *').minute.values).toEqual([1, 2, 3, 4, 5]);
    expect(parseCron('1,3,5 * * * *').minute.values).toEqual([1, 3, 5]);
    expect(parseCron('0 9-17 * * *').hour.values).toEqual([
      9, 10, 11, 12, 13, 14, 15, 16, 17,
    ]);
  });

  it('支持英文别名，且星期 7 归一化为周日', () => {
    expect(parseCron('* * * * MON-FRI').dayOfWeek.values).toEqual([1, 2, 3, 4, 5]);
    expect(parseCron('* * * JAN *').month.values).toEqual([1]);
    expect(parseCron('* * * * 7').dayOfWeek.values).toEqual([0]);
  });

  it('字段数量不为 5 时抛出错误', () => {
    expect(() => parseCron('0 0 * *')).toThrowError(/必须包含 5 个字段/);
    expect(() => parseCron('0 0 * * * *')).toThrowError(/必须包含 5 个字段/);
  });

  it('取值越界时抛出具体错误', () => {
    expect(() => parseCron('60 * * * *')).toThrowError(/超出范围 0-59/);
    expect(() => parseCron('* 24 * * *')).toThrowError(/超出范围 0-23/);
    expect(() => parseCron('* * 32 * *')).toThrowError(/超出范围 1-31/);
  });

  it('步长为 0 或非法时抛出错误', () => {
    expect(() => parseCron('*/0 * * * *')).toThrowError(/步长必须为正整数/);
    expect(() => parseCron('*/x * * * *')).toThrowError(/步长/);
  });

  it('范围起点大于终点时抛出错误', () => {
    expect(() => parseCron('5-1 * * * *')).toThrowError(/大于终点/);
  });
});

describe('describeCron', () => {
  it('输出字段级人类可读说明', () => {
    expect(describeField('minute', parseCron('*/5 * * * *').minute)).toBe('每 5 分钟');
    expect(describeField('dayOfWeek', parseCron('* * * * MON-FRI').dayOfWeek)).toBe(
      '周一 至 周五',
    );
    expect(describeCron(parseCron('0 9-17 * * MON-FRI'))).toBe(
      '0 分钟，9 至 17 小时，每日，每月，周一 至 周五',
    );
    expect(describeCron(parseCron('* * * * *'))).toBe(
      '每分钟，每小时，每日，每月，每周任意一天',
    );
  });
});

describe('getNextRuns', () => {
  it('按本地时区预览每日执行时间', () => {
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns('0 9 * * *', 3, from);
    expect(
      runs.map((date) => [date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]),
    ).toEqual([
      [0, 1, 9, 0],
      [0, 2, 9, 0],
      [0, 3, 9, 0],
    ]);
  });

  it('步长表达式按间隔命中', () => {
    const from = new Date(2026, 0, 1, 9, 0, 0);
    expect(getNextRuns('*/15 * * * *', 3, from).map((date) => date.getMinutes())).toEqual([
      15, 30, 45,
    ]);
  });

  it('日与星期同时受限时按「或」语义命中', () => {
    const from = new Date(2026, 0, 1, 0, 0, 0);
    const runs = getNextRuns('0 0 10 * MON', 6, from);
    expect(runs[0]?.getDate()).toBe(5);
    expect(runs[0]?.getDay()).toBe(1);
    expect(runs.some((date) => date.getDate() === 10)).toBe(true);
  });

  it('不可达表达式在搜索上限内返回空数组', () => {
    const from = new Date(2026, 0, 1, 0, 0, 0);
    expect(getNextRuns('0 0 30 2 *', 1, from, 10_000)).toEqual([]);
  });

  it('数量为 0 时返回空数组', () => {
    expect(getNextRuns('* * * * *', 0, new Date(2026, 0, 1))).toEqual([]);
  });
});
