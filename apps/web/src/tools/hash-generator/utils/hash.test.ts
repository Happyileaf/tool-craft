import { describe, expect, it } from 'vitest';
import { HashAlgorithmEnum } from '../constants';
import { computeHash, computeHmac } from './hash';

describe('computeHash', () => {
  it('SHA-256 对 abc 的摘要与标准向量一致', async () => {
    const results = await computeHash('abc');
    const sha256 = results.find(
      (item) => item.algorithm === HashAlgorithmEnum.SHA256,
    );
    expect(sha256?.value).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('返回四种算法各一条结果', async () => {
    const results = await computeHash('abc');
    expect(results).toHaveLength(4);
    expect(results.map((item) => item.algorithm)).toEqual(
      Object.values(HashAlgorithmEnum),
    );
  });

  it('空字符串仍返回四条有效摘要', async () => {
    const results = await computeHash('');
    const md5 = results.find(
      (item) => item.algorithm === HashAlgorithmEnum.MD5,
    );
    expect(md5?.value).toBe('d41d8cd98f00b204e9800998ecf8427e');
  });

  it('每条结果携带标准位长且无错误标记', async () => {
    const results = await computeHash('abc');
    expect(results.map((item) => item.bits)).toEqual([128, 160, 256, 512]);
    expect(results.every((item) => item.hasError === false)).toBe(true);
  });
});

describe('computeHmac', () => {
  it('HMAC-SHA256 与 RFC 4231 测试用例 1 一致', async () => {
    const secret = '\u000b'.repeat(20);
    const value = await computeHmac(
      'Hi There',
      secret,
      HashAlgorithmEnum.SHA256,
    );
    expect(value).toBe(
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
    );
  });
});
