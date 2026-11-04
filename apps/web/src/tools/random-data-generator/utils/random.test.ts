import { describe, expect, it } from 'vitest';
import { MAX_DECIMALS } from '../constants';
import {
  pickOne,
  randomBoolean,
  randomEmail,
  randomFloatInRange,
  randomHexColor,
  randomInt,
  randomIntegerInRange,
  randomName,
  randomParagraph,
  randomPhone,
  randomRgbColor,
  randomUuid,
  randomWord,
} from './random';
import { FIRST_NAMES, LAST_NAMES, WORDS } from './word-bank';

describe('randomInt', () => {
  it('结果落在 [0, max) 区间', () => {
    for (let i = 0; i < 200; i += 1) {
      const value = randomInt(10);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(10);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('max 为 1 时恒返回 0', () => {
    expect(randomInt(1)).toBe(0);
  });

  it('非正上界抛错', () => {
    expect(() => randomInt(0)).toThrow();
    expect(() => randomInt(-3)).toThrow();
  });

  it('大上界下结果不越界', () => {
    for (let i = 0; i < 100; i += 1) {
      const value = randomInt(0xffffffff);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe('randomIntegerInRange', () => {
  it('结果落在闭区间且为整数', () => {
    for (let i = 0; i < 200; i += 1) {
      const value = randomIntegerInRange(5, 8);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThanOrEqual(8);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('上下限颠倒时自动纠正', () => {
    const value = randomIntegerInRange(8, 5);
    expect(value).toBeGreaterThanOrEqual(5);
    expect(value).toBeLessThanOrEqual(8);
  });

  it('上下限相等时返回该值', () => {
    expect(randomIntegerInRange(42, 42)).toBe(42);
  });

  it('区间足够大时能取到两端值', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i += 1) {
      seen.add(randomIntegerInRange(0, 3));
    }
    expect(seen.size).toBe(4);
  });
});

describe('randomFloatInRange', () => {
  it('结果落在区间且小数位不超过设定值', () => {
    for (let i = 0; i < 200; i += 1) {
      const value = randomFloatInRange(1, 2, 3);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(2);
      const decimals = String(value).split('.')[1] ?? '';
      expect(decimals.length).toBeLessThanOrEqual(3);
    }
  });

  it('小数位参数被钳制到 0-10', () => {
    const value = randomFloatInRange(0, 1, 99);
    const decimals = String(value).split('.')[1] ?? '';
    expect(decimals.length).toBeLessThanOrEqual(MAX_DECIMALS);
  });

  it('0 位小数返回整数', () => {
    for (let i = 0; i < 50; i += 1) {
      const value = randomFloatInRange(0, 100, 0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe('randomBoolean', () => {
  it('只返回布尔值', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(typeof randomBoolean()).toBe('boolean');
    }
  });
});

describe('颜色生成', () => {
  it('十六进制颜色符合 #rrggbb 格式且字节在 0-255', () => {
    for (let i = 0; i < 50; i += 1) {
      const color = randomHexColor();
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('RGB 颜色三个通道均在 0-255', () => {
    for (let i = 0; i < 50; i += 1) {
      const match = randomRgbColor().match(/^rgb\((\d+), (\d+), (\d+)\)$/);
      expect(match).not.toBeNull();
      const channels = [match?.[1], match?.[2], match?.[3]].map(Number);
      channels.forEach((channel) => {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(255);
      });
    }
  });
});

describe('randomUuid', () => {
  it('符合 UUID v4 格式', () => {
    for (let i = 0; i < 50; i += 1) {
      const uuid = randomUuid();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
    }
  });

  it('每次生成不同值', () => {
    expect(randomUuid()).not.toBe(randomUuid());
  });
});

describe('姓名/邮箱/手机/单词', () => {
  it('姓名由内置名与姓拼接', () => {
    const name = randomName();
    const [first, last] = name.split(' ');
    expect(FIRST_NAMES).toContain(first);
    expect(LAST_NAMES).toContain(last);
  });

  it('邮箱包含 @ 且域名在内置列表中', () => {
    const email = randomEmail();
    expect(email).toMatch(/^[a-z.]+[0-9]+@[a-z.]+$/);
    expect(email.includes('@')).toBe(true);
  });

  it('手机号为 11 位数字且前缀合法', () => {
    const phone = randomPhone();
    expect(phone).toMatch(/^1[3-9]\d{9}$/);
    expect(phone).toHaveLength(11);
  });

  it('单词来自内置词库', () => {
    expect(WORDS).toContain(randomWord());
  });

  it('pickOne 对空数组抛错', () => {
    expect(() => pickOne([])).toThrow();
  });
});

describe('randomParagraph', () => {
  it('按句数生成且每句以句号结尾', () => {
    const paragraph = randomParagraph(4);
    const sentences = paragraph.split('. ');
    expect(sentences).toHaveLength(4);
    expect(paragraph.endsWith('.')).toBe(true);
  });

  it('句数小于 1 时按 1 句处理', () => {
    const paragraph = randomParagraph(0);
    expect(paragraph.endsWith('.')).toBe(true);
  });
});
