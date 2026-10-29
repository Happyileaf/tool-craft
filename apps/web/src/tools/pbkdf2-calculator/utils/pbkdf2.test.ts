import { describe, expect, it } from 'vitest';
import {
  bytesToBase64,
  bytesToHex,
  derivePbkdf2,
  hexToBytes,
  MAX_DKLEN,
  type Pbkdf2Result,
} from './pbkdf2';

/** 断言派生成功并收窄结果类型 */
async function ok(
  promise: Promise<Pbkdf2Result | { error: string }>,
): Promise<Pbkdf2Result> {
  const result = await promise;
  expect('error' in result).toBe(false);
  return result as Pbkdf2Result;
}

describe('derivePbkdf2 - RFC 8018 / PKCS#5 官方向量', () => {
  it('SHA-1 c=1 dkLen=20 匹配 RFC 8018 §B.1 向量 1', async () => {
    const result = await ok(
      derivePbkdf2('password', 'salt', 'text', 1, 'SHA-1', 20),
    );
    expect(result).toEqual({
      dkHex: '0c60c80f961f0e71f3a9b524af6012062fe037a6',
      dkBase64: 'DGDID5YfDnHzqbUkr2ASBi/gN6Y=',
    });
  });

  it('SHA-1 c=2 dkLen=20 匹配 RFC 8018 §B.1 向量 2', async () => {
    const result = await ok(
      derivePbkdf2('password', 'salt', 'text', 2, 'SHA-1', 20),
    );
    expect(result).toEqual({
      dkHex: 'ea6c014dc72d6f8ccd1ed92ace1d41f0d8de8957',
      dkBase64: '6mwBTcctb4zNHtkqzh1B8NjeiVc=',
    });
  });

  it('SHA-1 c=4096 dkLen=20 匹配 RFC 8018 §B.1 向量 3', async () => {
    const result = await ok(
      derivePbkdf2('password', 'salt', 'text', 4096, 'SHA-1', 20),
    );
    expect(result).toEqual({
      dkHex: '4b007901b765489abead49d926f721d065a429c1',
      dkBase64: 'SwB5AbdlSJq+rUnZJvch0GWkKcE=',
    });
  });

  it('SHA-256 c=1/2/4096 dkLen=32 匹配 RFC 7914 §11 向量', async () => {
    const c1 = await ok(
      derivePbkdf2('password', 'salt', 'text', 1, 'SHA-256', 32),
    );
    expect(c1.dkHex).toBe(
      '120fb6cffcf8b32c43e7225256c4f837a86548c92ccc35480805987cb70be17b',
    );

    const c2 = await ok(
      derivePbkdf2('password', 'salt', 'text', 2, 'SHA-256', 32),
    );
    expect(c2.dkHex).toBe(
      'ae4d0c95af6b46d32d0adff928f06dd02a303f8ef3c251dfd6e2d85a95474c43',
    );

    const c4096 = await ok(
      derivePbkdf2('password', 'salt', 'text', 4096, 'SHA-256', 32),
    );
    expect(c4096.dkHex).toBe(
      'c5e478d59288c841aa530db6845c4c8d962893a001ce4e11a4963873aa98134a',
    );
  });

  it('SHA-512 c=1000 dkLen=64 前 16 字节匹配 RFC 7914 §11 向量 6', async () => {
    const result = await ok(
      derivePbkdf2('password', 'salt', 'text', 1000, 'SHA-512', 64),
    );
    expect(result.dkHex.startsWith('afe6c5530785b6cc6b1c6453384731b')).toBe(true);
    expect(result.dkHex.length).toBe(128);
  });

  it('支持自定义 dkLen（截断输出长度）', async () => {
    const result = await ok(
      derivePbkdf2('password', 'salt', 'text', 1, 'SHA-256', 16),
    );
    expect(result.dkHex.length).toBe(32);
    expect(result.dkHex).toBe('120fb6cffcf8b32c43e7225256c4f837');
  });
});

describe('derivePbkdf2 - salt 载体与错误处理', () => {
  it('salt 支持十六进制输入，与等价比特的文本结果一致', async () => {
    const viaHex = await derivePbkdf2(
      'password',
      '73616c74',
      'hex',
      8,
      'SHA-256',
      32,
    );
    const viaText = await derivePbkdf2(
      'password',
      'salt',
      'text',
      8,
      'SHA-256',
      32,
    );
    expect(viaHex).toEqual(viaText);
  });

  it('salt hex 允许 0x 前缀与空白', async () => {
    const a = await derivePbkdf2(
      'password',
      '0x73 61\n6c74',
      'hex',
      4,
      'SHA-256',
      32,
    );
    const b = await derivePbkdf2('password', 'salt', 'text', 4, 'SHA-256', 32);
    expect(a).toEqual(b);
  });

  it('非法 hex salt 返回带 salt 前缀的错误', async () => {
    const result = await derivePbkdf2(
      'password',
      'xyz',
      'hex',
      100,
      'SHA-256',
      32,
    );
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('salt');
    }
  });

  it('迭代次数非正整数报错', async () => {
    const result = await derivePbkdf2('p', 's', 'text', 0, 'SHA-256', 32);
    expect(result).toEqual({ error: '迭代次数需为正整数' });
  });

  it('dkLen 非正整数报错', async () => {
    const result = await derivePbkdf2('p', 's', 'text', 100, 'SHA-256', -1);
    expect(result).toEqual({ error: '派生密钥长度需为正整数（字节）' });
  });

  it('dkLen 超上限报错', async () => {
    const result = await derivePbkdf2(
      'p',
      's',
      'text',
      100,
      'SHA-256',
      MAX_DKLEN + 1,
    );
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error).toContain('上限');
    }
  });
});

describe('编码工具函数', () => {
  it('bytesToHex 正确转换字节序', () => {
    expect(bytesToHex(new Uint8Array([0, 1, 2, 250, 251, 255]))).toBe(
      '000102fafbff',
    );
  });

  it('bytesToBase64 正确转换并可往返', () => {
    const bytes = new Uint8Array([0, 1, 2, 250, 187, 255]);
    expect(bytesToBase64(bytes)).toBe('AAEC+rv/');
  });

  it('hexToBytes 严格校验', () => {
    expect(hexToBytes('0x0A 0b\n0C').bytes).toEqual(
      new Uint8Array([10, 11, 12]),
    );
    expect(hexToBytes('abc').bytes).toBeNull();
    expect(hexToBytes('zz').bytes).toBeNull();
    expect(hexToBytes('').bytes).toEqual(new Uint8Array(0));
  });
});
