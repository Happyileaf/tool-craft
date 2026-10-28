import { describe, expect, it } from 'vitest';
import {
  convertJsonc,
  stripJsonComments,
  stripTrailingCommas,
} from './jsonc';

describe('stripJsonComments', () => {
  it('移除行注释 //', () => {
    const result = stripJsonComments('{"a": 1 // 说明\n}');
    expect(result).toBe('{"a": 1      \n}');
  });

  it('移除行尾无换行的行注释', () => {
    const result = stripJsonComments('{"a": 1 // 末尾}');
    expect(result).toBe('{"a": 1       ');
  });

  it('移除单行与跨行块注释', () => {
    const input = '{"a": /* x */ 1, "b": /* 多行\n注释 */ 2}';
    const result = stripJsonComments(input);
    expect(result).toBe('{"a":         1, "b":      \n      2}');
    expect(result.includes('\n')).toBe(true);
  });

  it('保留字符串内部的注释符号', () => {
    const input = '{"url": "https://example.com", "s": "/* x */ // y"}';
    expect(stripJsonComments(input)).toBe(input);
  });

  it('处理转义引号后不误判字符串结束', () => {
    const input = String.raw`{"a": "he said \"hi\" // not comment", "b": 2}`;
    expect(stripJsonComments(input)).toBe(input);
  });

  it('对未闭合块注释抛出中文错误', () => {
    expect(() => stripJsonComments('{"a": /* oops }')).toThrow(
      /未闭合的块注释/,
    );
  });

  it('单独的斜杠原样保留', () => {
    expect(stripJsonComments('{"a": "1/2"}')).toBe('{"a": "1/2"}');
  });
});

describe('stripTrailingCommas', () => {
  it('移除对象与数组的尾随逗号', () => {
    expect(stripTrailingCommas('{"a": 1,}')).toBe('{"a": 1 }');
    expect(stripTrailingCommas('[1, 2,]')).toBe('[1, 2 ]');
  });

  it('移除带空白和换行的尾随逗号', () => {
    expect(stripTrailingCommas('{"a": 1,\n  "b": 2,\n}')).toBe(
      '{"a": 1,\n  "b": 2 \n}',
    );
  });

  it('不移除字符串内部的尾随逗号形态', () => {
    const input = '{"a": "x,}", "b": ["," ]}';
    expect(stripTrailingCommas(input)).toBe(input);
  });

  it('嵌套结构的尾随逗号全部移除', () => {
    const input = '{"a": [1, {"b": 2,},],}';
    expect(stripTrailingCommas(input)).toBe('{"a": [1, {"b": 2 } ] }');
  });

  it('正常逗号不受影响', () => {
    expect(stripTrailingCommas('{"a": 1, "b": 2}')).toBe('{"a": 1, "b": 2}');
  });
});

describe('convertJsonc', () => {
  it('完整转换带注释与尾随逗号的 JSONC', () => {
    const input = `{
  // 编译选项
  "compilerOptions": {
    "strict": true, /* 严格模式 */
    "target": "ES2020",
  },
  "list": [1, 2, 3,],
}`;
    const result = convertJsonc(input, 2);
    expect(result.success).toBe(true);
    const parsed = JSON.parse(result.output!) as Record<string, unknown>;
    expect(parsed).toEqual({
      compilerOptions: { strict: true, target: 'ES2020' },
      list: [1, 2, 3],
    });
  });

  it('缩进 4 空格生效', () => {
    const result = convertJsonc('{"a": 1,}', 4);
    expect(result.output).toBe('{\n    "a": 1\n}');
  });

  it('minify 模式输出单行', () => {
    const result = convertJsonc('{\n  "a": 1 // x\n}', 0);
    expect(result.success).toBe(true);
    expect(result.output).toBe('{"a":1}');
  });

  it('字符串内的注释符号与尾随逗号不被破坏', () => {
    const input =
      '{"url": "https://a.com/x", "trailing": ",}", "nested": "/* c */"}';
    const result = convertJsonc(input, 0);
    expect(result.success).toBe(true);
    expect(result.output).toBe(
      '{"url":"https://a.com/x","trailing":",}","nested":"/* c */"}',
    );
  });

  it('严格模式合法 JSON 正常通过', () => {
    const result = convertJsonc('[1, 2, 3]', 2);
    expect(result.success).toBe(true);
    expect(result.output).toBe('[\n  1,\n  2,\n  3\n]');
  });

  it('空输入返回无错误的失败态', () => {
    expect(convertJsonc('   \n  ', 2)).toEqual({ success: false });
  });

  it('清洗后仍非法时返回解析错误与 cleaned 文本', () => {
    const result = convertJsonc('{"a": }', 2);
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
    expect(result.cleaned).toBeDefined();
  });

  it('未闭合块注释返回中文错误', () => {
    const result = convertJsonc('{"a": 1 /* oops }', 2);
    expect(result.success).toBe(false);
    expect(result.errorMessage).toMatch(/未闭合的块注释/);
  });

  it('数字与布尔等标量也可转换', () => {
    expect(convertJsonc('42 // 答案', 0).output).toBe('42');
    expect(convertJsonc('true,', 0).success).toBe(false);
  });

  it('转义引号后的行注释不被删除', () => {
    const input = String.raw`{"s": "a \" // keep", "n": 1}`;
    const result = convertJsonc(input, 0);
    expect(result.success).toBe(true);
    expect(result.output).toContain('// keep');
  });
});
