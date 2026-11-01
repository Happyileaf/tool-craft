import { describe, it, expect } from 'vitest';
import {
  BASE62_ALPHABET,
  KSUID_EPOCH,
  KSUID_LENGTH,
  MAX_ENCODED,
  TIMESTAMP_MAX,
  decodeBase62,
  encodeBase62,
  generateKsuid,
  parseKsuid,
} from './ksuid';

/** 标准测试向量的 16 字节 payload */
const SAMPLE_PAYLOAD_HEX = '05dc86dca18f681a3d17397793335f5d';

/** 标准测试向量的 KSUID（时间戳 1507608047 + 上述 payload 的 BigInt Base62 编码） */
const SAMPLE_KSUID = '0ujtsTH176xYeQcQDXMN9d1aYX7';

/** 标准测试向量的 Unix 秒级时间戳（UTC 2017-10-10 04:00:47） */
const SAMPLE_TIMESTAMP = 1507608047;

/** 比最大合法值大 1 的 27 字符串 */
const OVERFLOW_KSUID = 'aWgEPTl1tmebfsQzFP4bxwgy80W';

/** 把十六进制字符串转成字节 */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

/** 固定 payload 的确定性随机源 */
function fixedPayload(hex: string): () => Uint8Array {
  const bytes = hexToBytes(hex);
  return () => Uint8Array.from(bytes);
}

describe('官方标准测试向量', () => {
  it('解析标准向量得到时间戳 1507608047（UTC 2017-10-10 04:00:47）与 payload', () => {
    const result = parseKsuid(SAMPLE_KSUID);
    expect('error' in result).toBe(false);
    if ('error' in result) {
      throw new Error(result.error);
    }
    expect(result.ksuid).toBe(SAMPLE_KSUID);
    expect(result.timestampSeconds).toBe(SAMPLE_TIMESTAMP);
    expect(result.date).toBe('2017-10-10 04:00:47 UTC');
    expect(result.payloadHex).toBe(SAMPLE_PAYLOAD_HEX);
  });

  it('反向生成：timestamp=1507608047 + payload 必须编码出同一字符串', () => {
    const result = generateKsuid(SAMPLE_TIMESTAMP, fixedPayload(SAMPLE_PAYLOAD_HEX));
    expect(result).toBe(SAMPLE_KSUID);
  });

  it('容忍首尾空白', () => {
    const result = parseKsuid(`  ${SAMPLE_KSUID}\n`);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.timestampSeconds).toBe(SAMPLE_TIMESTAMP);
    }
  });
});

describe('生成', () => {
  it('注入确定性 rng 往返一致：输出 27 字符且仅 Base62 字符，时间戳与 payload 一致', () => {
    const id = generateKsuid(SAMPLE_TIMESTAMP, fixedPayload(SAMPLE_PAYLOAD_HEX));
    expect(typeof id).toBe('string');
    expect(id).toHaveLength(KSUID_LENGTH);
    expect([...(id as string)].every((char) => BASE62_ALPHABET.includes(char))).toBe(true);

    const parsed = parseKsuid(id as string);
    expect('error' in parsed).toBe(false);
    if (!('error' in parsed)) {
      expect(parsed.timestampSeconds).toBe(SAMPLE_TIMESTAMP);
      expect(parsed.payloadHex).toBe(SAMPLE_PAYLOAD_HEX);
    }
  });

  it('时间戳早于纪元返回错误结果', () => {
    const result = generateKsuid(KSUID_EPOCH - 1, fixedPayload(SAMPLE_PAYLOAD_HEX));
    expect(result).toEqual({ error: expect.stringContaining('时间戳') });
  });

  it('时间戳超过 uint32 上限返回错误结果', () => {
    const result = generateKsuid(
      KSUID_EPOCH + TIMESTAMP_MAX + 1,
      fixedPayload(SAMPLE_PAYLOAD_HEX),
    );
    expect(result).toEqual({ error: expect.stringContaining('时间戳') });
  });

  it('非整数时间戳返回错误结果', () => {
    const result = generateKsuid(1507608047.5, fixedPayload(SAMPLE_PAYLOAD_HEX));
    expect(result).toEqual({ error: expect.stringContaining('时间戳') });
  });

  it('payload 不是 16 字节返回错误结果', () => {
    const result = generateKsuid(SAMPLE_TIMESTAMP, () => new Uint8Array(15));
    expect(result).toEqual({ error: expect.stringContaining('16') });
  });

  it('调整时间戳为 0、payload 全零时编码为 27 个 0 并可往返', () => {
    const id = generateKsuid(KSUID_EPOCH, () => new Uint8Array(16));
    expect(id).toBe('0'.repeat(KSUID_LENGTH));
    const parsed = parseKsuid(id as string);
    expect('error' in parsed).toBe(false);
    if (!('error' in parsed)) {
      expect(parsed.timestampSeconds).toBe(KSUID_EPOCH);
      expect(parsed.payloadHex).toBe('00'.repeat(16));
    }
  });
});

describe('边界与非法输入', () => {
  it('最大合法串可解析：调整时间戳为 uint32 max，payload 全 ff', () => {
    const result = parseKsuid(MAX_ENCODED);
    expect('error' in result).toBe(false);
    if (!('error' in result)) {
      expect(result.timestampSeconds).toBe(KSUID_EPOCH + TIMESTAMP_MAX);
      expect(result.payloadHex).toBe('ff'.repeat(16));
    }
  });

  it('比最大值大 1 的 27 字符串报「数值超出 20 字节上限」', () => {
    expect(parseKsuid(OVERFLOW_KSUID)).toEqual({ error: '数值超出 20 字节上限' });
  });

  it('含 -、_、= 报非法字符', () => {
    expect(parseKsuid('0ujsswThIGTUYm2K8FjOOfXtY1-')).toEqual({
      error: expect.stringContaining('非法字符'),
    });
    expect(parseKsuid('0ujsswThIGTUYm2K8FjOOfXtY1_')).toEqual({
      error: expect.stringContaining('非法字符'),
    });
    expect(parseKsuid('0ujsswThIGTUYm2K8FjOOfXtY1=')).toEqual({
      error: expect.stringContaining('非法字符'),
    });
  });

  it('26 / 28 字符报长度错误', () => {
    expect(parseKsuid('0'.repeat(26))).toEqual({
      error: expect.stringContaining('长度必须为 27'),
    });
    expect(parseKsuid('0'.repeat(28))).toEqual({
      error: expect.stringContaining('长度必须为 27'),
    });
  });

  it('空串与纯空白报错', () => {
    expect(parseKsuid('')).toEqual({ error: expect.stringContaining('请输入') });
    expect(parseKsuid('   ')).toEqual({ error: expect.stringContaining('请输入') });
  });
});

describe('Base62 编解码', () => {
  it('20 字节全零编码为 27 个 0', () => {
    expect(encodeBase62(new Uint8Array(20))).toBe('0'.repeat(KSUID_LENGTH));
  });

  it('20 字节全 0xff 编码为最大合法串', () => {
    expect(encodeBase62(new Uint8Array(20).fill(0xff))).toBe(MAX_ENCODED);
  });

  it('标准向量解码后前 4 字节为调整时间戳大端值', () => {
    const decoded = decodeBase62(SAMPLE_KSUID);
    expect(decoded).toBeInstanceOf(Uint8Array);
    const bytes = decoded as Uint8Array;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    expect(view.getUint32(0)).toBe(SAMPLE_TIMESTAMP - KSUID_EPOCH);
  });
});
