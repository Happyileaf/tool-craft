import { describe, expect, it } from 'vitest';
import { executeCapability } from '@tool-craft/core';
import { base64EncodeCapability } from './index';
import { base64DecodeCapability } from '../base64-decode/index';

describe('base64EncodeCapability', () => {
  describe('execute', () => {
    it('已知向量：Hello → SGVsbG8=', () => {
      expect(base64EncodeCapability.execute('Hello', {})).toBe('SGVsbG8=');
    });

    it('纯 ASCII 文本（含 padding 两种长度）', () => {
      expect(base64EncodeCapability.execute('Hello, World!', {})).toBe(
        'SGVsbG8sIFdvcmxkIQ==',
      );
      expect(base64EncodeCapability.execute('Hel', {})).toBe('SGVs');
    });

    it('中文文本编码（UTF-8 三字节）', () => {
      expect(base64EncodeCapability.execute('你好', {})).toBe('5L2g5aW9');
    });

    it('emoji 编码（UTF-8 四字节）', () => {
      expect(base64EncodeCapability.execute('🎉', {})).toBe('8J+OiQ==');
    });

    it('空字符串编码为空字符串', () => {
      expect(base64EncodeCapability.execute('', {})).toBe('');
    });
  });

  describe('executeCapability 端到端', () => {
    it('"你好 🌏" encode → decode 往返一致', async () => {
      const encoded = await executeCapability(base64EncodeCapability, '你好 🌏', {});
      const decoded = await executeCapability(base64DecodeCapability, encoded, {});
      expect(decoded).toBe('你好 🌏');
    });

    it('input 非字符串触发 VALIDATION_ERROR', async () => {
      await expect(executeCapability(base64EncodeCapability, 123, {})).rejects.toMatchObject(
        { code: 'VALIDATION_ERROR' },
      );
    });
  });
});
