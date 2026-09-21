import { describe, expect, it } from 'vitest';
import {
  getJsonStats,
  processJson,
  repairJsonText,
  sortObjectKeys,
} from './json';

describe('sortObjectKeys', () => {
  it('对象键按字母顺序排序', () => {
    const result = sortObjectKeys({ b: 1, a: 2, c: 3 }) as Record<
      string,
      number
    >;
    expect(Object.keys(result)).toEqual(['a', 'b', 'c']);
  });

  it('嵌套对象递归排序且数组元素保持原顺序', () => {
    const result = sortObjectKeys({
      z: { y: 1, x: 2 },
      list: [{ b: 1, a: 2 }, 3],
    }) as { z: Record<string, number>; list: Array<Record<string, number> | number> };
    expect(Object.keys(result.z)).toEqual(['x', 'y']);
    expect(Object.keys(result.list[0] as Record<string, number>)).toEqual([
      'a',
      'b',
    ]);
  });

  it('原始值原样返回', () => {
    expect(sortObjectKeys(42)).toBe(42);
    expect(sortObjectKeys('text')).toBe('text');
    expect(sortObjectKeys(null)).toBe(null);
  });
});

describe('repairJsonText', () => {
  it('单引号替换为双引号', () => {
    expect(repairJsonText("{'a':'b'}")).toBe('{"a":"b"}');
  });

  it('未加双引号的键名补上双引号', () => {
    expect(repairJsonText('{name:"tool"}')).toBe('{"name":"tool"}');
    expect(repairJsonText('{a:1,b:2}')).toBe('{"a":1,"b":2}');
  });

  it('已合规文本不被破坏', () => {
    expect(repairJsonText('{"a": "b"}')).toBe('{"a": "b"}');
  });
});

describe('getJsonStats', () => {
  it('统计单行文本', () => {
    expect(getJsonStats('{"a":1}')).toEqual({ lines: 1, chars: 7, bytes: 7 });
  });

  it('统计多行文本与非 ASCII 字节体积', () => {
    const stats = getJsonStats('{\n  "a": "工具"\n}');
    expect(stats.lines).toBe(3);
    expect(stats.chars).toBe(15);
    expect(stats.bytes).toBe(19);
  });
});

describe('processJson', () => {
  it('两空格缩进格式化对象', () => {
    const result = processJson('{"name":"tool","count":1}', 2, false);
    expect(result.success).toBe(true);
    expect(result.output).toBe('{\n  "name": "tool",\n  "count": 1\n}');
  });

  it('四空格缩进生效', () => {
    const result = processJson('{"a":1}', 4, false);
    expect(result.output).toBe('{\n    "a": 1\n}');
  });

  it('缩进为 0 时单行压缩', () => {
    const result = processJson('{"a": 1, "b": 2}', 0, false);
    expect(result.success).toBe(true);
    expect(result.output).toBe('{"a":1,"b":2}');
  });

  it('开启排序后输出按键名排序', () => {
    const result = processJson('{"b":1,"a":2}', 2, true);
    expect(result.output).toBe('{\n  "a": 2,\n  "b": 1\n}');
  });

  it('空输入返回失败且不带错误信息', () => {
    expect(processJson('', 2, false)).toEqual({ success: false });
    expect(processJson('   \n\t ', 2, false)).toEqual({ success: false });
  });

  it('非法 JSON 返回失败并携带解析器原始错误', () => {
    const result = processJson('{bad}', 2, false);
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });

  it('数字与数组等非对象顶层值也可格式化', () => {
    expect(processJson('42', 2, false).output).toBe('42');
    expect(processJson('[1,2]', 2, false).output).toBe('[\n  1,\n  2\n]');
  });
});
