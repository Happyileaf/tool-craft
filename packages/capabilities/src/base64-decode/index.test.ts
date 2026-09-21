import { describe, expect, it } from 'vitest';
import { executeCapability } from '@tool-craft/core';
import { base64DecodeCapability } from './index';

describe('base64DecodeCapability', () => {
  describe('execute', () => {
    it('已知向量：SGVsbG8= → Hello', () => {
      expect(base64DecodeCapability.execute('SGVsbG8=', {})).toBe('Hello');
    });

    it('中文文本解码', () => {
      expect(base64DecodeCapability.execute('5L2g5aW9', {})).toBe('你好');
    });

    it('emoji 解码', () => {
      expect(base64DecodeCapability.execute('8J+OiQ==', {})).toBe('🎉');
    });

    it('无 padding 的 base64 也能解码', () => {
      expect(base64DecodeCapability.execute('SGVsbG8', {})).toBe('Hello');
    });

    it('空字符串解码为空字符串', () => {
      expect(base64DecodeCapability.execute('', {})).toBe('');
    });
  });

  describe('executeCapability 端到端', () => {
    it('通过 executor 调用返回解码文本', async () => {
      const result = await executeCapability(base64DecodeCapability, '5L2g5aW9', {});
      expect(result).toBe('你好');
    });

    it('非法字符输入包装为 EXECUTION_ERROR 且消息含 "非法 base64"', async () => {
      const error = await executeCapability(base64DecodeCapability, '!!!not-base64!!!', {}).catch(
        (caught: unknown) => caught,
      );
      expect(error).toMatchObject({ code: 'EXECUTION_ERROR' });
      expect((error as Error).message).toContain('非法 base64');
    });

    it('非法长度输入（正文长度 mod 4 为 1）包装为 EXECUTION_ERROR', async () => {
      await expect(executeCapability(base64DecodeCapability, 'ABCDE', {})).rejects.toMatchObject({
        code: 'EXECUTION_ERROR',
      });
      await expect(executeCapability(base64DecodeCapability, 'A', {})).rejects.toMatchObject({
        code: 'EXECUTION_ERROR',
      });
    });
  });
});
