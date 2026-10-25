import { describe, it, expect } from 'vitest';
import { inspectUuid, inspectBatch } from './uuid-inspect';

// RFC 4122 附录示例：v1，时间戳 1997-02-03T17:43:12.216875Z，节点 00:a0:c9:1e:6b:f6
const RFC_V1 = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';
const RFC_V3 = 'a3bb189e-8bf9-3888-9912-ace4e6543002';
const KNOWN_V4 = '550e8400-e29b-41d4-a716-446655440000';
const KNOWN_V7 = '017f22e2-79b0-7cc3-98c4-dc0c0c07398f';

describe('inspectUuid', () => {
  it('解析 RFC v1：版本、变体、时间戳、节点与时钟序列', () => {
    const info = inspectUuid(RFC_V1);
    expect(info.valid).toBe(true);
    expect(info.version).toBe(1);
    expect(info.variant).toBe('rfc4122');
    expect(info.timestamp).toBe('1997-02-03T17:43:12.216Z');
    expect(info.node).toBe('00:a0:c9:1e:6b:f6');
    expect(info.clockSeq).toBe(10085);
    expect(info.warnings).toEqual([]);
  });

  it('解析 v3 / v5（MD5/SHA-1 命名空间）且无时间戳', () => {
    const v3 = inspectUuid(RFC_V3);
    expect(v3.version).toBe(3);
    expect(v3.variant).toBe('rfc4122');
    expect(v3.timestamp).toBeNull();
    expect(v3.node).toBeNull();
  });

  it('解析 v4 随机 UUID', () => {
    const info = inspectUuid(KNOWN_V4);
    expect(info.valid).toBe(true);
    expect(info.version).toBe(4);
    expect(info.variant).toBe('rfc4122');
    expect(info.timestamp).toBeNull();
  });

  it('解析 v7 并提取 Unix 毫秒时间戳', () => {
    const info = inspectUuid(KNOWN_V7);
    expect(info.version).toBe(7);
    expect(info.variant).toBe('rfc4122');
    const timeHex = KNOWN_V7.replace(/-/g, '').slice(0, 12);
    const expected = new Date(parseInt(timeHex, 16)).toISOString();
    expect(info.timestamp).toBe(expected);
  });

  it('识别 nil 与 max 特殊 UUID', () => {
    expect(inspectUuid('00000000-0000-0000-0000-000000000000').version).toBe('nil');
    expect(inspectUuid('ffffffff-ffff-ffff-ffff-ffffffffffff').version).toBe('max');
  });

  it('兼容大写、urn:uuid 前缀与花括号', () => {
    const upper = inspectUuid(KNOWN_V4.toUpperCase());
    expect(upper.valid).toBe(true);
    expect(upper.canonical).toBe(KNOWN_V4);

    const urn = inspectUuid(`urn:uuid:${KNOWN_V4}`);
    expect(urn.valid).toBe(true);
    expect(urn.canonical).toBe(KNOWN_V4);

    const braces = inspectUuid(`{${KNOWN_V4}}`);
    expect(braces.valid).toBe(true);
    expect(braces.canonical).toBe(KNOWN_V4);
  });

  it('格式非法时给出错误', () => {
    expect(inspectUuid('not-a-uuid').valid).toBe(false);
    expect(inspectUuid('550e8400-e29b-41d4-a716').error).toMatch(/合法的 UUID/);
    expect(inspectUuid('zzzz8400-e29b-41d4-a716-446655440000').valid).toBe(false);
    expect(inspectUuid('   ').error).toBe('空输入');
  });

  it('版本与变体不匹配时给警告但仍视为格式合法', () => {
    // 第 9 字节改为 0x1f（NCS 变体 0001），但版本仍为 4
    const mismatched = '550e8400-e29b-4f40-1f16-446655440000';
    const info = inspectUuid(mismatched);
    expect(info.valid).toBe(true);
    expect(info.version).toBe(4);
    expect(info.variant).toBe('ncs');
    expect(info.warnings[0]).toMatch(/不是 RFC 4122/);
  });

  it('解析 v2 并给出近似时间戳与本地低 32 位替换说明', () => {
    // 将 RFC v1 的版本字段改为 2，时间高 28 位保持不变
    const v2Token = RFC_V1.replace('-11d0-', '-21d0-');
    const info = inspectUuid(v2Token);
    expect(info.version).toBe(2);
    expect(info.variant).toBe('rfc4122');
    expect(info.timestamp).not.toBeNull();
    expect(info.timestampNote).toMatch(/近似值/);
    expect(info.node).toBe('00:a0:c9:1e:6b:f6');
  });

  it('v6 重排时间戳可被解析', () => {
    // 用 RFC v1 的 60 位时间戳按 RFC 9562 §5.6 字段顺序重排为等价 v6：
    // v1：time_low(32) | time_mid(16) | ver(4)+time_high(12)
    // v6：time_high(12)+time_mid(16)+time_low 高 4 位（32）| time_low 位 27-12 | ver+time_low 低 12 位
    const v1 = inspectUuid(RFC_V1);
    const p = RFC_V1.split('-');
    const low32 = p[0] ?? '';
    const mid16 = p[1] ?? '';
    const high12 = (p[2] ?? '').slice(1);
    const reordered =
      high12 + mid16 + low32.slice(0, 1) +
      '-' +
      low32.slice(1, 5) +
      '-6' +
      low32.slice(5, 8) +
      '-' +
      p[3] +
      '-' +
      p[4];
    const v6 = inspectUuid(reordered);
    expect(v6.version).toBe(6);
    expect(v6.timestamp).toBe(v1.timestamp);
  });
});

describe('inspectBatch', () => {
  it('统计总数、合法、非法、去重与重复', () => {
    const result = inspectBatch(
      `${KNOWN_V4}\n${KNOWN_V4.toUpperCase()}, ${RFC_V1}; bad-id\n  ${KNOWN_V7}，`,
    );
    expect(result.summary.total).toBe(5);
    expect(result.summary.valid).toBe(4);
    expect(result.summary.invalid).toBe(1);
    expect(result.summary.unique).toBe(3);
    expect(result.summary.duplicate).toBe(2);
    expect(result.items[0]?.isDuplicate).toBe(true);
    expect(result.items[1]?.isDuplicate).toBe(true);
  });

  it('空输入得到全零汇总', () => {
    const result = inspectBatch('  \n , ；');
    expect(result.summary).toEqual({ total: 0, valid: 0, invalid: 0, unique: 0, duplicate: 0 });
    expect(result.items).toEqual([]);
  });
});
