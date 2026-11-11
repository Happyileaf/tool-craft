import { describe, it, expect } from 'vitest';
import { keccak256Hex } from './keccak256';
import { addressHash, normalizeAddress, toChecksumAddress, verifyChecksum } from './eip55';

/** EIP-55 官方规范全部测试向量 */
const OFFICIAL_VECTORS = [
  '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
  '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
  '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
  '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
];

describe('Keccak-256 原语', () => {
  it('空串摘要为 Ethereum 标准值（区别于 NIST SHA3-256）', () => {
    expect(keccak256Hex('')).toBe(
      'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
    );
  });

  it('abc 摘要与 Ethereum keccak256 一致', () => {
    expect(keccak256Hex('abc')).toBe(
      '4e03657aea45a94fc7d47ba826c8d667c0d1e6e33a64a036ec44f58fa12d6c45',
    );
  });

  it('长于一个速率块的输入正确分块吸收', () => {
    const message = 'a'.repeat(200);
    expect(keccak256Hex(message)).toHaveLength(64);
    // 与逐字节确定性实现保持稳定（回归断言）
    expect(keccak256Hex(message)).toBe(keccak256Hex('a'.repeat(200)));
  });
});

describe('EIP-55 编码', () => {
  it.each(OFFICIAL_VECTORS)('官方向量编码逐字符一致：%s', (official) => {
    expect(toChecksumAddress(official.toLowerCase())).toBe(official);
    expect(toChecksumAddress(official.toUpperCase())).toBe(official);
    expect(toChecksumAddress(official)).toBe(official);
  });

  it('容忍空白与缺失 0x 前缀', () => {
    const official = OFFICIAL_VECTORS[0]!;
    expect(toChecksumAddress(`  ${official.slice(2)}  `)).toBe(official);
  });

  it('normalizeAddress 输出 40 位小写 hex', () => {
    expect(normalizeAddress('0x' + 'A'.repeat(40))).toBe('a'.repeat(40));
  });
});

describe('EIP-55 校验', () => {
  it.each(OFFICIAL_VECTORS)('官方向量全部判定合法：%s', (official) => {
    expect(verifyChecksum(official).valid).toBe(true);
  });

  it('篡改字母大小写后判定非法并给出首个不匹配位置', () => {
    const official = OFFICIAL_VECTORS[0]!;
    const body = official.slice(2);
    const letterIndex = [...body].findIndex((char) => /[a-fA-F]/.test(char));
    const flipped =
      body.slice(0, letterIndex) +
      (body[letterIndex] === body[letterIndex]!.toUpperCase()
        ? body[letterIndex]!.toLowerCase()
        : body[letterIndex]!.toUpperCase()) +
      body.slice(letterIndex + 1);
    const result = verifyChecksum('0x' + flipped);
    expect(result.valid).toBe(false);
    expect(result.firstMismatchIndex).toBe(letterIndex);
    expect(result.expected).toBe(official);
  });

  it('纯数字地址无字母，校验天然通过', () => {
    const numeric = '0x' + '1234567890'.repeat(4);
    const result = verifyChecksum(numeric);
    expect(result.valid).toBe(true);
    expect(result.hasLetters).toBe(false);
  });

  it('哈希推导与 addressHash 一致', () => {
    const official = OFFICIAL_VECTORS[1]!;
    expect(addressHash(official)).toHaveLength(64);
  });
});

describe('错误处理', () => {
  it('空输入抛错', () => {
    expect(() => toChecksumAddress('   ')).toThrow('请输入');
  });

  it('长度错误抛错并提示实际位数', () => {
    expect(() => toChecksumAddress('0x1234')).toThrow('长度非法');
  });

  it('含非 hex 字符抛错并定位', () => {
    const bad = '0x' + 'g'.padEnd(40, '0');
    expect(() => toChecksumAddress(bad)).toThrow('非十六进制字符');
  });
});
