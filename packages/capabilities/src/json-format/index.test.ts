import { describe, expect, it } from 'vitest';
import { executeCapability } from '@tool-craft/core';
import { jsonFormatCapability } from './index';

describe('jsonFormatCapability', () => {
  describe('execute', () => {
    it('indent 2：默认空格缩进', () => {
      const output = jsonFormatCapability.execute('{"a":1,"b":2}', {
        indent: '2',
        sortKeys: false,
      });
      expect(output).toBe('{\n  "a": 1,\n  "b": 2\n}');
    });

    it('indent 4：4 空格缩进', () => {
      const output = jsonFormatCapability.execute('{"a":1}', { indent: '4', sortKeys: false });
      expect(output).toBe('{\n    "a": 1\n}');
    });

    it('indent tab：制表符缩进', () => {
      const output = jsonFormatCapability.execute('{"a":1}', { indent: 'tab', sortKeys: false });
      expect(output).toBe('{\n\t"a": 1\n}');
    });

    it('sortKeys：递归排序嵌套对象与数组内对象', () => {
      const output = jsonFormatCapability.execute(
        '{"b":{"d":2,"c":1},"a":[{"z":1,"y":2}]}',
        { indent: '2', sortKeys: true },
      );
      expect(output).toBe('{\n  "a": [\n    {\n      "y": 2,\n      "z": 1\n    }\n  ],\n  "b": {\n    "c": 1,\n    "d": 2\n  }\n}');
    });

    it('sortKeys：数组顺序本身不重排', () => {
      const output = jsonFormatCapability.execute('[3,1,2]', { indent: '2', sortKeys: true });
      expect(output).toBe('[\n  3,\n  1,\n  2\n]');
    });

    it('原始字面量直接序列化', () => {
      const output = jsonFormatCapability.execute('42', { indent: '2', sortKeys: false });
      expect(output).toBe('42');
    });
  });

  describe('executeCapability 端到端', () => {
    it('不传参数时默认 indent=2、sortKeys=false', async () => {
      const result = await executeCapability(jsonFormatCapability, '{"a":1}', {});
      expect(result).toBe('{\n  "a": 1\n}');
    });

    it('非法 JSON 包装为 EXECUTION_ERROR 且消息含位置信息', async () => {
      const error = await executeCapability(jsonFormatCapability, '{invalid', {}).catch(
        (caught: unknown) => caught,
      );
      expect(error).toMatchObject({ code: 'EXECUTION_ERROR' });
      expect((error as Error).message).toContain('position 1');
    });

    it('非法 indent 触发 VALIDATION_ERROR', async () => {
      await expect(
        executeCapability(jsonFormatCapability, '{}', { indent: '8' as never }),
      ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    });
  });
});
