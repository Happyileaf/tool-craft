import { describe, it, expect } from 'vitest';
import {
  bytesToUuid,
  decodeBase32,
  decodeTypeid,
  encodeBase32,
  encodeTypeid,
  generateTypeid,
  uuidToBytes,
  validatePrefix,
} from './typeid';

/** TypeID 官方规范核心向量（valid.yml：suffix 01h455... 对应 UUID ...b302099a8057） */
const OFFICIAL_UUID = '01890a5d-ac96-774b-bcce-b302099a8057';
const OFFICIAL_TYPEID = 'user_01h455vb4pex5vsknk084sn02q';
const OFFICIAL_SUFFIX = '01h455vb4pex5vsknk084sn02q';

describe('Base32 编解码', () => {
  it('官方 UUID 编码为官方后缀', () => {
    expect(encodeBase32(uuidToBytes(OFFICIAL_UUID))).toBe(OFFICIAL_SUFFIX);
  });

  it('后缀解码还原同一 UUID', () => {
    expect(bytesToUuid(decodeBase32(OFFICIAL_SUFFIX))).toBe(OFFICIAL_UUID);
  });

  it('任意 16 字节往返一致', () => {
    const bytes = Uint8Array.from(Array.from({ length: 16 }, (_, index) => index * 17 + 3));
    expect(decodeBase32(encodeBase32(bytes))).toEqual(bytes);
  });

  it('非法长度后缀报错', () => {
    expect(() => decodeBase32('abc')).toThrow('26 个字符');
  });

  it('含 I/L/O/U 的后缀被拒绝', () => {
    const bad = ('0' + 'i'.padEnd(25, '0')) as string;
    expect(() => decodeBase32(bad)).toThrow('非法 Base32 字符');
  });

  it('首字符非 0 报错', () => {
    expect(() => decodeBase32('z' + '0'.repeat(25))).toThrow('前导零位');
  });
});

describe('TypeID 编码', () => {
  it('官方向量：user 前缀 + UUID → 官方 TypeID', () => {
    expect(encodeTypeid('user', OFFICIAL_UUID)).toBe(OFFICIAL_TYPEID);
  });

  it('空前缀编码为裸后缀', () => {
    expect(encodeTypeid('', OFFICIAL_UUID)).toBe(OFFICIAL_SUFFIX);
  });

  it('带下划线的合法前缀可编码', () => {
    expect(encodeTypeid('order_item', OFFICIAL_UUID).startsWith('order_item_')).toBe(true);
  });
});

describe('TypeID 解码', () => {
  const decoded = decodeTypeid(OFFICIAL_TYPEID);

  it('还原前缀与 UUID', () => {
    expect(decoded.prefix).toBe('user');
    expect(decoded.uuid).toBe(OFFICIAL_UUID);
  });

  it('识别版本 7、RFC 4122 variant', () => {
    expect(decoded.version).toBe(7);
    expect(decoded.variant).toBe(2);
  });

  it('提取 UUIDv7 毫秒时间戳', () => {
    // 0x01890a5dac96 = 官方向量内嵌时间
    expect(decoded.timestampMs).toBe(0x01890a5dac96);
    expect(decoded.timestampMs).toBeGreaterThan(0);
  });

  it('裸后缀合法且前缀为空串', () => {
    const bare = decodeTypeid(OFFICIAL_SUFFIX);
    expect(bare.prefix).toBe('');
    expect(bare.uuid).toBe(OFFICIAL_UUID);
  });
});

describe('前缀与整体合法性规则', () => {
  it('超长前缀（64 字符）被拒绝', () => {
    expect(() => validatePrefix('a'.repeat(64))).toThrow('不能超过 63');
  });

  it('大写前缀被拒绝', () => {
    expect(() => validatePrefix('User')).toThrow('小写字母');
  });

  it('数字开头的前缀被拒绝', () => {
    expect(() => validatePrefix('1user')).toThrow('小写字母开头');
  });

  it('63 字符前缀合法', () => {
    expect(() => validatePrefix('a'.repeat(63))).not.toThrow();
  });

  it('非法 variant 的 UUID 被拒绝', () => {
    // 第 9 字节最高两位非 10
    const badUuid = '01890a5d-ac96-374b-3cce-b302c716d807';
    expect(() => decodeTypeid(encodeTypeid('x', badUuid))).toThrow('variant');
  });
});

describe('TypeID 生成', () => {
  it('生成结果可被自身解析且后缀恒为 26 字符', () => {
    const id = generateTypeid('user');
    const suffix = id.split('_')[1]!;
    expect(suffix).toHaveLength(26);
    const parsed = decodeTypeid(id);
    expect(parsed.prefix).toBe('user');
    expect(parsed.version).toBe(7);
    expect(parsed.variant).toBe(2);
  });

  it('生成的 v7 时间戳接近当前时间', () => {
    const before = Date.now();
    const parsed = decodeTypeid(generateTypeid('evt'));
    const after = Date.now();
    expect(parsed.timestampMs).toBeGreaterThanOrEqual(before - 1000);
    expect(parsed.timestampMs).toBeLessThanOrEqual(after + 1000);
  });

  it('连续生成的两个 ID 不重复', () => {
    expect(generateTypeid('user')).not.toBe(generateTypeid('user'));
  });
});
