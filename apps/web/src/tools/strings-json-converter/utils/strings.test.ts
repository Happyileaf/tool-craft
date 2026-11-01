import { describe, expect, it } from 'vitest';
import {
  decodeStringsValue,
  encodeStringsValue,
  jsonToStrings,
  parseStrings,
  stringsToJson,
} from './strings';

describe('decodeStringsValue', () => {
  it('解码常见 C 转义', () => {
    expect(decodeStringsValue('a\\nb\\tc\\r\\"\\\\\\0')).toBe('a\nb\tc\r"\\\0');
  });

  it('解码 \\U 四位十六进制与未转义中文', () => {
    expect(decodeStringsValue('\\U4e2d\\U6587')).toBe('中文');
    expect(decodeStringsValue('直接中文')).toBe('直接中文');
  });

  it('解码 \\U 八位码点（emoji 代理对形式）', () => {
    expect(decodeStringsValue('\\U0001F600')).toBe('😀');
  });

  it('非法 \\U 抛中文错误', () => {
    expect(() => decodeStringsValue('\\U12')).toThrow('十六进制');
    expect(() => decodeStringsValue('\\x')).toThrow('不支持的转义');
  });
});

describe('encodeStringsValue', () => {
  it('转义特殊字符', () => {
    expect(encodeStringsValue('a"b\\c\n')).toBe('a\\"b\\\\c\\n');
  });

  it('中文原样、emoji 输出 8 位 \\U 往返', () => {
    expect(encodeStringsValue('中文')).toBe('中文');
    const encoded = encodeStringsValue('a😀b');
    expect(encoded).toBe('a\\U0001f600b');
    expect(decodeStringsValue(encoded)).toBe('a😀b');
  });
});

describe('parseStrings', () => {
  it('解析基础键值、剥离 // 与块注释、容忍空白和跨行', () => {
    const text = `/* 标题注释 */
"greeting" = "你好";

// 登录页
"login.title"
  =
  "登录";
"empty" = "";`;
    const result = parseStrings(text);
    expect(result.entries).toEqual({
      greeting: '你好',
      'login.title': '登录',
      empty: '',
    });
    expect(result.count).toBe(3);
    expect(result.comments).toContain('标题注释');
    expect(result.comments).toContain('登录页');
  });

  it('转义与 emoji 八位 \\U 正确解码', () => {
    const result = parseStrings('"k" = "line1\\nline2\\U0001F600";');
    expect(result.entries.k).toBe('line1\nline2😀');
  });

  it('缺分号报错并带行号', () => {
    expect(() => parseStrings('"a" = "b"')).toThrow('分号');
    expect(() => parseStrings('\n\n"a" = "b"')).toThrow('第 3 行');
  });

  it('未闭合引号报错', () => {
    expect(() => parseStrings('"ok" = "1";\n"broken" = "oops;')).toThrow('未闭合');
  });

  it('值缺少开引号报错', () => {
    expect(() => parseStrings('"a" = b";')).toThrow('开引号');
  });

  it('缺等号报错', () => {
    expect(() => parseStrings('"a"  "b";')).toThrow('= 号');
  });

  it('重复键默认抛错，可配置 first / last', () => {
    const text = '"k" = "1";\n"k" = "2";';
    expect(() => parseStrings(text)).toThrow('重复');
    expect(parseStrings(text, { duplicateKey: 'last' }).entries.k).toBe('2');
    expect(parseStrings(text, { duplicateKey: 'first' }).entries.k).toBe('1');
  });

  it('未闭合块注释报错', () => {
    expect(() => parseStrings('/* never ends')).toThrow('未闭合');
  });

  it('空文本与纯注释返回空对象', () => {
    expect(parseStrings('').entries).toEqual({});
    expect(parseStrings('// only comment\n/* x */').count).toBe(0);
  });
});

describe('stringsToJson', () => {
  it('输出格式化 JSON', () => {
    const json = stringsToJson('"a" = "1";\n"b" = "x\\ny";');
    expect(JSON.parse(json)).toEqual({ a: '1', b: 'x\ny' });
  });
});

describe('jsonToStrings', () => {
  it('生成带缩进的标准 .strings 语法', () => {
    const result = jsonToStrings(JSON.stringify({ greeting: '你好', login: '登录' }));
    expect(result.text).toBe('  "greeting" = "你好";\n  "login" = "登录";');
    expect(result.count).toBe(2);
  });

  it('排序与紧凑选项生效', () => {
    const result = jsonToStrings(JSON.stringify({ b: '1', a: '2' }), {
      sortKeys: true,
      indent: false,
    });
    expect(result.text.split('\n')[0]).toBe('"a" = "2";');
  });

  it('非法 JSON、顶层数组、非字符串值均报中文错误', () => {
    expect(() => jsonToStrings('{bad')).toThrow('JSON 解析失败');
    expect(() => jsonToStrings('[]')).toThrow('顶层必须是对象');
    expect(() => jsonToStrings('{"a":1}')).toThrow('必须是字符串');
  });

  it('特殊字符往返一致', () => {
    const original = { k: 'a"b\\c\n😀' };
    const generated = jsonToStrings(JSON.stringify(original), { indent: false }).text;
    expect(parseStrings(generated).entries).toEqual(original);
  });
});
