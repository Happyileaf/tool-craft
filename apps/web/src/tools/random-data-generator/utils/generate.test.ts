import { describe, expect, it } from 'vitest';
import { MAX_COUNT, RandomTypeEnum } from '../constants';
import { generateRandomData } from './generate';

describe('generateRandomData', () => {
  it('按指定条数返回结果', () => {
    const result = generateRandomData({
      type: RandomTypeEnum.Integer,
      count: 25,
    });
    expect(result).toHaveLength(25);
    result.forEach((item) => expect(typeof item).toBe('string'));
  });

  it('条数超过上限时钳制到 MAX_COUNT', () => {
    const result = generateRandomData({
      type: RandomTypeEnum.Word,
      count: 99999,
    });
    expect(result).toHaveLength(MAX_COUNT);
  });

  it('条数小于 1 时至少返回 1 条', () => {
    const result = generateRandomData({
      type: RandomTypeEnum.Uuid,
      count: 0,
    });
    expect(result).toHaveLength(1);
  });

  it('整数类型遵循自定义区间', () => {
    const result = generateRandomData({
      type: RandomTypeEnum.Integer,
      count: 100,
      intMin: 1000,
      intMax: 2000,
    });
    result.forEach((item) => {
      const value = Number(item);
      expect(value).toBeGreaterThanOrEqual(1000);
      expect(value).toBeLessThanOrEqual(2000);
    });
  });

  it('浮点类型输出可解析为数字', () => {
    const result = generateRandomData({
      type: RandomTypeEnum.Float,
      count: 50,
      floatMin: -10,
      floatMax: 10,
      decimals: 4,
    });
    result.forEach((item) => {
      const value = Number(item);
      expect(Number.isNaN(value)).toBe(false);
      expect(value).toBeGreaterThanOrEqual(-10);
      expect(value).toBeLessThanOrEqual(10);
    });
  });

  it('布尔类型仅输出 true/false', () => {
    const result = generateRandomData({
      type: RandomTypeEnum.Boolean,
      count: 30,
    });
    result.forEach((item) => expect(['true', 'false']).toContain(item));
  });

  it('颜色类型输出对应格式', () => {
    const hex = generateRandomData({ type: RandomTypeEnum.HexColor, count: 10 });
    hex.forEach((item) => expect(item).toMatch(/^#[0-9a-f]{6}$/));
    const rgb = generateRandomData({ type: RandomTypeEnum.RgbColor, count: 10 });
    rgb.forEach((item) => expect(item).toMatch(/^rgb\(\d+, \d+, \d+\)$/));
  });

  it('UUID 类型输出 v4 格式', () => {
    const result = generateRandomData({ type: RandomTypeEnum.Uuid, count: 10 });
    result.forEach((item) =>
      expect(item).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
    );
  });

  it('姓名/邮箱/手机/单词类型均产出非空字符串', () => {
    [
      RandomTypeEnum.Name,
      RandomTypeEnum.Email,
      RandomTypeEnum.Phone,
      RandomTypeEnum.Word,
    ].forEach((type) => {
      const result = generateRandomData({ type, count: 10 });
      expect(result).toHaveLength(10);
      result.forEach((item) => expect(item.length).toBeGreaterThan(0));
    });
  });

  it('段落类型每个元素是多句段落', () => {
    const result = generateRandomData({
      type: RandomTypeEnum.Paragraph,
      count: 5,
    });
    result.forEach((item) => {
      expect(item.endsWith('.')).toBe(true);
      expect(item.split('. ').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('日期时间类型输出 ISO 字符串且落在自定义区间', () => {
    const start = new Date('2020-01-01T00:00:00.000Z');
    const end = new Date('2021-01-01T00:00:00.000Z');
    const result = generateRandomData({
      type: RandomTypeEnum.DateTime,
      count: 20,
      dateStart: start,
      dateEnd: end,
    });
    result.forEach((item) => {
      const time = new Date(item).getTime();
      expect(time).toBeGreaterThanOrEqual(start.getTime());
      expect(time).toBeLessThan(end.getTime());
    });
  });
});
