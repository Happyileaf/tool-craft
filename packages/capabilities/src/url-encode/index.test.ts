import { describe, expect, it } from 'vitest';
import { executeCapability } from '@tool-craft/core';
import { urlEncodeCapability } from './index';

describe('urlEncodeCapability', () => {
  describe('execute', () => {
    it('component 范围：空格编码为 %20', () => {
      expect(urlEncodeCapability.execute('hello world', { scope: 'component' })).toBe(
        'hello%20world',
      );
    });

    it('component 范围：URL 保留字符一并编码', () => {
      expect(urlEncodeCapability.execute('https://example.com/a b', { scope: 'component' })).toBe(
        'https%3A%2F%2Fexample.com%2Fa%20b',
      );
    });

    it('component 范围：中文编码', () => {
      expect(urlEncodeCapability.execute('你好', { scope: 'component' })).toBe(
        '%E4%BD%A0%E5%A5%BD',
      );
    });

    it('uri 范围：保留 / 与 ? 等结构字符', () => {
      expect(
        urlEncodeCapability.execute('https://example.com/a b?x=1', { scope: 'uri' }),
      ).toBe('https://example.com/a%20b?x=1');
    });

    it('uri 范围：中文仍编码', () => {
      expect(urlEncodeCapability.execute('你好', { scope: 'uri' })).toBe('%E4%BD%A0%E5%A5%BD');
    });
  });

  describe('executeCapability 端到端', () => {
    it('不传 scope 时默认为 component', async () => {
      const result = await executeCapability(urlEncodeCapability, 'a b', {});
      expect(result).toBe('a%20b');
    });

    it('非法 scope 触发 VALIDATION_ERROR', async () => {
      await expect(
        executeCapability(urlEncodeCapability, 'a b', { scope: 'other' as never }),
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });
  });
});
