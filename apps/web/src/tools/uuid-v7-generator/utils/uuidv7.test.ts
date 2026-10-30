import { describe, it, expect } from 'vitest';
import { generateUuidV7, generateBatch, inspectUuidV7 } from './uuidv7';

const UUID_V7_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const FIXED_TS = 1700000000000;

describe('generateUuidV7', () => {
  it('输出符合 8-4-4-4-12 与版本/变体位要求的规范字符串', () => {
    for (let i = 0; i < 50; i += 1) {
      const result = generateUuidV7();
      expect(result.valid).toBe(true);
      expect(result.uuid).toMatch(UUID_V7_PATTERN);
      expect(result.uuid).toHaveLength(36);
    }
  });

  it('把给定毫秒时间戳写入前 48 位（大端）', () => {
    const result = generateUuidV7(FIXED_TS);
    const expectedPrefix = FIXED_TS.toString(16).padStart(12, '0');
    expect(result.uuid.replace(/-/g, '').slice(0, 12)).toBe(expectedPrefix);
    expect(result.timestampMs).toBe(FIXED_TS);
  });

  it('字段拆解：version=7、variant=10x、rand_a 3 位、rand_b 16 位', () => {
    const result = generateUuidV7(FIXED_TS);
    expect(result.fields.version).toBe(7);
    expect(result.fields.variant).toBe('10x');
    expect(result.fields.randA).toMatch(/^[0-9a-f]{3}$/);
    expect(result.fields.randB).toMatch(/^[89ab][0-9a-f]{15}$/);
    expect(result.isoTime).toBe(new Date(FIXED_TS).toISOString());
  });

  it('第四段首字符 ∈ 89ab（变体 10）', () => {
    const groups = generateUuidV7(FIXED_TS).uuid.split('-');
    expect(['8', '9', 'a', 'b']).toContain(groups[3]![0]);
  });
});

describe('inspectUuidV7', () => {
  it('反解时间戳与字段', () => {
    const generated = generateUuidV7(FIXED_TS);
    const parsed = inspectUuidV7(generated.uuid);
    expect(parsed.valid).toBe(true);
    expect(parsed.error).toBeNull();
    expect(parsed.timestampMs).toBe(FIXED_TS);
    expect(parsed.fields.version).toBe(7);
    expect(parsed.fields.variant).toBe('10x');
    expect(parsed.uuid).toBe(generated.uuid);
  });

  it('接受大写输入', () => {
    const generated = generateUuidV7(FIXED_TS);
    const parsed = inspectUuidV7(generated.uuid.toUpperCase());
    expect(parsed.valid).toBe(true);
    expect(parsed.uuid).toBe(generated.uuid);
  });

  it('接受花括号与 urn:uuid: 前缀', () => {
    const generated = generateUuidV7(FIXED_TS);
    expect(inspectUuidV7(`{${generated.uuid.toUpperCase()}}`).valid).toBe(true);
    expect(inspectUuidV7(`urn:uuid:${generated.uuid}`).valid).toBe(true);
    expect(inspectUuidV7(`  ${generated.uuid}  `).valid).toBe(true);
  });

  it('非 hex 字符报错', () => {
    const bad = '018c1a4e-g223-7xxx-xxxx-xxxxxxxxxxxx';
    const result = inspectUuidV7(bad);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/格式错误/);
  });

  it('版本位错误（v4 串）报错', () => {
    const v4 = 'a1b2c3d4-e5f6-4789-90ab-cdef12345678';
    const result = inspectUuidV7(v4);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/版本位/);
  });

  it('变体位错误（第四段首字符 0）报错', () => {
    const badVariant = inspectUuidV7('018c1a4e-3b22-7f00-0000-000000000000');
    expect(badVariant.valid).toBe(false);
    expect(badVariant.error).toMatch(/变体/);
  });

  it('长度错误报错', () => {
    expect(inspectUuidV7('018c1a4e-3b22-7f00-8000').valid).toBe(false);
    expect(inspectUuidV7('018c1a4e-3b22-7f00-8000-000000000000-extra').valid).toBe(false);
    expect(inspectUuidV7('').valid).toBe(false);
  });
});

describe('generateBatch', () => {
  it('全部唯一、全部匹配格式', () => {
    const uuids = generateBatch(1000, FIXED_TS);
    expect(uuids).toHaveLength(1000);
    expect(new Set(uuids).size).toBe(1000);
    uuids.forEach((uuid) => {
      expect(uuid).toMatch(UUID_V7_PATTERN);
      expect(uuid.replace(/-/g, '').slice(0, 12)).toBe(
        FIXED_TS.toString(16).padStart(12, '0'),
      );
    });
  });

  it('固定时间戳下严格字典序递增', () => {
    const uuids = generateBatch(1000, FIXED_TS);
    for (let i = 1; i < uuids.length; i += 1) {
      expect(uuids[i]! > uuids[i - 1]!).toBe(true);
    }
  });

  it('非法数量返回空数组', () => {
    expect(generateBatch(0, FIXED_TS)).toEqual([]);
    expect(generateBatch(-5, FIXED_TS)).toEqual([]);
    expect(generateBatch(1.5, FIXED_TS)).toEqual([]);
    expect(generateBatch(Number.NaN, FIXED_TS)).toEqual([]);
  });

  it('数量超过 1000 时夹紧到 1000', () => {
    expect(generateBatch(5000, FIXED_TS)).toHaveLength(1000);
  });
});
