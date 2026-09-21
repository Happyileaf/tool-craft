import { describe, expect, it } from 'vitest';
import { executeCapability } from '@tool-craft/core';
import { timestampConvertCapability } from './index';

describe('timestampConvertCapability', () => {
  describe('execute', () => {
    it('toTimestamp / seconds：空格分隔日期 → 秒级时间戳', () => {
      const output = timestampConvertCapability.execute('2024-01-01 00:00:00', {
        direction: 'toTimestamp',
        unit: 'seconds',
      });
      expect(output).toBe('1704067200');
    });

    it('toTimestamp / milliseconds：空格分隔日期 → 毫秒级时间戳', () => {
      const output = timestampConvertCapability.execute('2024-01-01 00:00:00', {
        direction: 'toTimestamp',
        unit: 'milliseconds',
      });
      expect(output).toBe('1704067200000');
    });

    it('toTimestamp：ISO 格式（带 Z）同样支持', () => {
      const output = timestampConvertCapability.execute('2024-01-01T00:00:00Z', {
        direction: 'toTimestamp',
        unit: 'seconds',
      });
      expect(output).toBe('1704067200');
    });

    it('toDateTime / seconds：秒级时间戳 → ISO 8601（UTC）', () => {
      const output = timestampConvertCapability.execute('1704067200', {
        direction: 'toDateTime',
        unit: 'seconds',
      });
      expect(output).toBe('2024-01-01T00:00:00.000Z');
    });

    it('toDateTime / milliseconds：毫秒级时间戳 → ISO 8601（UTC）', () => {
      const output = timestampConvertCapability.execute('1704067200000', {
        direction: 'toDateTime',
        unit: 'milliseconds',
      });
      expect(output).toBe('2024-01-01T00:00:00.000Z');
    });

    it('ISO 往返：toTimestamp 与 toDateTime 结果互逆', async () => {
      const timestamp = await timestampConvertCapability.execute('2024-06-15T12:30:45Z', {
        direction: 'toTimestamp',
        unit: 'seconds',
      });
      const iso = await timestampConvertCapability.execute(timestamp, {
        direction: 'toDateTime',
        unit: 'seconds',
      });
      expect(iso).toBe('2024-06-15T12:30:45.000Z');
    });
  });

  describe('executeCapability 端到端', () => {
    it('不传 unit 时默认 seconds', async () => {
      const result = await executeCapability(timestampConvertCapability, '2024-01-01 00:00:00', {
        direction: 'toTimestamp',
      });
      expect(result).toBe('1704067200');
    });

    it('缺少 direction 触发 VALIDATION_ERROR', async () => {
      await expect(
        executeCapability(timestampConvertCapability, '2024-01-01 00:00:00', {}),
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });

    it('非法日期文本包装为 EXECUTION_ERROR 且消息为中文', async () => {
      const error = await executeCapability(
        timestampConvertCapability,
        'not a date',
        { direction: 'toTimestamp', unit: 'seconds' },
      ).catch((caught: unknown) => caught);
      expect(error).toMatchObject({ code: 'EXECUTION_ERROR' });
      expect((error as Error).message).toContain('非法日期时间文本');
    });

    it('非法时间戳文本包装为 EXECUTION_ERROR 且消息为中文', async () => {
      const error = await executeCapability(
        timestampConvertCapability,
        'abc',
        { direction: 'toDateTime', unit: 'seconds' },
      ).catch((caught: unknown) => caught);
      expect(error).toMatchObject({ code: 'EXECUTION_ERROR' });
      expect((error as Error).message).toContain('非法时间戳文本');
    });
  });
});
