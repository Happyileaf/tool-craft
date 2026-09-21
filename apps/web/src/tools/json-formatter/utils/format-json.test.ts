import { describe, expect, it } from 'vitest';
import { formatJson } from './format-json';

describe('formatJson', () => {
  it('合法对象格式化为两空格缩进结果', () => {
    const result = formatJson('{"name":"tool","count":1}');
    expect(result.success).toBe(true);
    expect(result.output).toBe('{\n  "name": "tool",\n  "count": 1\n}');
  });

  it('合法数组与数字字面量也可格式化', () => {
    const arrayResult = formatJson('[1,2,3]');
    expect(arrayResult.success).toBe(true);
    expect(arrayResult.output).toBe('[\n  1,\n  2,\n  3\n]');

    const numberResult = formatJson('42');
    expect(numberResult.success).toBe(true);
    expect(numberResult.output).toBe('42');
  });

  it('嵌套对象与数组按层级递进缩进', () => {
    const result = formatJson('{"user":{"name":"a","tags":["x",{"ok":true}]}}');
    expect(result.success).toBe(true);
    expect(result.output).toBe(
      '{\n  "user": {\n    "name": "a",\n    "tags": [\n      "x",\n      {\n        "ok": true\n      }\n    ]\n  }\n}',
    );
  });

  it('缺少引号时返回失败且错误信息为非空中文字符串，不抛异常', () => {
    const result = formatJson('{name:"tool"}');
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
    expect(result.errorMessage).toMatch(/[\u4e00-\u9fa5]/);
  });

  it('多余逗号时返回失败且错误信息为非空中文字符串，不抛异常', () => {
    const result = formatJson('{"a":1,}');
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
    expect(result.errorMessage).toMatch(/[\u4e00-\u9fa5]/);
  });

  it('错误信息尽量包含行列位置线索', () => {
    const result = formatJson('{\n  "a": 1,\n  bad\n}');
    expect(result.success).toBe(false);
    if (result.errorMessage?.includes('错误位置')) {
      expect(result.errorMessage).toMatch(/第 \d+ 行第 \d+ 列/);
    }
  });

  it('空字符串与纯空白返回失败', () => {
    expect(formatJson('').success).toBe(false);
    expect(formatJson('').errorMessage).toBe('请输入 JSON 内容');
    expect(formatJson('   \n\t  ').success).toBe(false);
    expect(formatJson('   \n\t  ').errorMessage).toBe('请输入 JSON 内容');
  });

  it('indent 参数控制每层缩进宽度', () => {
    const result = formatJson('{"a":1}', 4);
    expect(result.success).toBe(true);
    expect(result.output).toBe('{\n    "a": 1\n}');
  });

  it('同一输入连续两次调用输出一致，满足纯函数约定', () => {
    const input = '{"list":[{"id":1},{"id":2}],"ok":true}';
    const first = formatJson(input);
    const second = formatJson(input);
    expect(first.output).toBe(second.output);
    expect(first).toEqual(second);
  });
});
