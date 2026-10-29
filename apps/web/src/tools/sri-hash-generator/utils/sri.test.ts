import { describe, it, expect } from 'vitest';
import {
  bytesToBase64,
  computeSriHash,
  generateSri,
  parseIntegrity,
  verifySri,
} from './sri';

const EMPTY_SHA256 = 'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=';
const EMPTY_SHA384 =
  'sha384-OLBgp1GsljhM2TJ+sbHjaiH9txEUvgdDTAzHv2P24donTt6/529l+9Ua0vFImLlb';
const EMPTY_SHA512 =
  'sha512-z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg==';
const ABC_SHA256 = 'sha256-ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=';

describe('computeSriHash', () => {
  it('命中空串 SHA-256 公开向量', async () => {
    const value = await computeSriHash(new Uint8Array(0), 'sha256');
    expect(value).toBe(EMPTY_SHA256);
  });

  it('命中 "abc" SHA-256 公开向量', async () => {
    const data = new TextEncoder().encode('abc');
    const value = await computeSriHash(data, 'sha256');
    expect(value).toBe(ABC_SHA256);
  });

  it('命中空串 SHA-384 公开向量', async () => {
    const value = await computeSriHash(new Uint8Array(0), 'sha384');
    expect(value).toBe(EMPTY_SHA384);
  });

  it('按 UTF-8 计算中文摘要且结果带正确算法前缀', async () => {
    const data = new TextEncoder().encode('中文 SRI 测试');
    const value = await computeSriHash(data, 'sha512');
    expect(value.startsWith('sha512-')).toBe(true);
  });
});

describe('generateSri', () => {
  it('默认仅产出 sha256 一条', async () => {
    const results = await generateSri(new TextEncoder().encode('abc'));
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ algorithm: 'sha256', value: ABC_SHA256 });
  });

  it('多算法组合按入参顺序输出，可直接用作 integrity 属性', async () => {
    const results = await generateSri(new Uint8Array(0), [
      'sha256',
      'sha384',
      'sha512',
    ]);
    expect(results.map((item) => item.algorithm)).toEqual([
      'sha256',
      'sha384',
      'sha512',
    ]);
    expect(results[0]!.value).toBe(EMPTY_SHA256);
    expect(results[1]!.value).toBe(EMPTY_SHA384);
    expect(results[2]!.value).toBe(EMPTY_SHA512);
  });
});

describe('bytesToBase64', () => {
  it('标准 Base64 带填充且可往返', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 255]);
    const encoded = bytesToBase64(bytes);
    expect(encoded).toBe('AAEC+vv/');
    expect(new Uint8Array([...atob(encoded)].map((ch) => ch.charCodeAt(0)))).toEqual(
      bytes,
    );
  });
});

describe('parseIntegrity', () => {
  it('解析空白分隔的多条元数据', () => {
    const parsed = parseIntegrity(` ${EMPTY_SHA256}   ${EMPTY_SHA384} `);
    expect(parsed.error).toBeNull();
    expect(parsed.entries).toHaveLength(2);
    expect(parsed.entries[0]!.algorithm).toBe('sha256');
  });

  it('忽略 ? 开头的 option 段', () => {
    const parsed = parseIntegrity(`${EMPTY_SHA256} ?foo=bar`);
    expect(parsed.error).toBeNull();
    expect(parsed.entries).toHaveLength(1);
  });

  it('算法标签大小写归一化', () => {
    const parsed = parseIntegrity(EMPTY_SHA256.replace('sha256', 'SHA256'));
    expect(parsed.error).toBeNull();
    expect(parsed.entries[0]!.algorithm).toBe('sha256');
  });

  it('非法格式给出明确错误', () => {
    expect(parseIntegrity('md5-abc').error).toContain('不支持的算法');
    expect(parseIntegrity('sha256-').error).toContain('缺少');
    expect(parseIntegrity('?foo=bar').error).toContain('未解析出');
    expect(parseIntegrity('plainstring').error).toContain('格式非法');
  });
});

describe('verifySri', () => {
  it('内容与 integrity 匹配时通过', async () => {
    const result = await verifySri(new TextEncoder().encode('abc'), ABC_SHA256);
    expect(result.error).toBeNull();
    expect(result.valid).toBe(true);
    expect(result.entries[0]!).toEqual({ algorithm: 'sha256', matched: true });
  });

  it('多算法组合中任一强摘要匹配即通过', async () => {
    const integrity = `sha256-tamperedbase64value ${ABC_SHA256}`;
    const result = await verifySri(new TextEncoder().encode('abc'), integrity);
    expect(result.valid).toBe(true);
    expect(result.entries.map((item) => item.matched)).toEqual([false, true]);
  });

  it('内容被篡改时不通过', async () => {
    const result = await verifySri(
      new TextEncoder().encode('different content'),
      ABC_SHA256,
    );
    expect(result.valid).toBe(false);
    expect(result.entries[0]!.matched).toBe(false);
  });

  it('非法 integrity 串返回解析错误', async () => {
    const result = await verifySri(new Uint8Array(0), 'sha1-xxxx');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('不支持的算法');
  });
});
