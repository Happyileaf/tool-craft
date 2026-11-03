import { describe, expect, it } from 'vitest';
import { parseJson5, stringifyJson5 } from './json5';

describe('parseJson5', () => {
  it('解析标准 JSON', () => {
    const result = parseJson5('{"a":1,"b":[true,null]}');
    expect(result.error).toBeNull();
    expect(result.output).toEqual({ a: 1, b: [true, null] });
  });

  it('支持行注释与块注释', () => {
    const text = `{
      // 这是行注释
      "a": 1, /* 块注释 */
      "b": 2,
    }`;
    expect(parseJson5(text).output).toEqual({ a: 1, b: 2 });
  });

  it('未闭合块注释报错', () => {
    expect(parseJson5('{ /* abc ').error).toContain('块注释');
  });

  it('支持单引号字符串与字符串转义', () => {
    const result = parseJson5(`{ s: 'it\\'s ok\\n换行', t: "say \\"hi\\"" }`);
    expect(result.error).toBeNull();
    expect((result.output as Record<string, string>).s).toBe("it's ok\n换行");
    expect((result.output as Record<string, string>).t).toBe('say "hi"');
  });

  it('支持未加引号的标识符键、尾逗号、键名引号混用', () => {
    const result = parseJson5(`{ foo: 1, bar_baz: 2, 'a b': 3, }`);
    expect(result.output).toEqual({ foo: 1, bar_baz: 2, 'a b': 3 });
  });

  it('支持数组尾逗号与稀疏外的常规数组', () => {
    const result = parseJson5(`[1, 2, 3,]`);
    expect(result.output).toEqual([1, 2, 3]);
  });

  it('数字字面量：十六进制 / 前导小数点 / 正号 / 科学计数', () => {
    expect(parseJson5('0xFF').output).toBe(255);
    expect(parseJson5('+.5').output).toBe(0.5);
    expect(parseJson5('-0.25e2').output).toBe(-25);
    expect(parseJson5('1_000').error).not.toBeNull(); // JSON5 支持数字分隔符属于扩展，本实现不支持时应报错而非误解析
  });

  it('数字后紧跟非法字符报错', () => {
    expect(parseJson5('123abc').error).toContain('非法字符');
  });

  it('支持 Infinity / -Infinity / NaN', () => {
    expect(parseJson5('Infinity').output).toBe(Number.POSITIVE_INFINITY);
    expect(parseJson5('-Infinity').output).toBe(Number.NEGATIVE_INFINITY);
    expect(Number.isNaN(parseJson5('NaN').output as number)).toBe(true);
  });

  it('支持行尾反斜杠续行的多行字符串', () => {
    const result = parseJson5(`"hello \\
        world"`);
    expect(result.output).toBe('hello world');
  });

  it('支持 \\x 与 \\u / \\u{} 转义', () => {
    expect(parseJson5("'\\x41'").output).toBe('A');
    expect(parseJson5("'\\u00e9'").output).toBe('é');
    expect(parseJson5("'\\u{1F600}'").output).toBe('😀');
  });

  it('重复键报错', () => {
    expect(parseJson5('{a:1,a:2}').error).toContain('重复键');
  });

  it('畸形输入给出行列号', () => {
    expect(parseJson5('{a:}').error).toContain('第 1 行');
    expect(parseJson5('{\n a: 1,\n b: }\n').error).toContain('第 3 行');
    expect(parseJson5('[1,2').error).toContain('意外结束');
  });

  it('嵌套对象数组往返后可 JSON.stringify', () => {
    const text = `{
      // 用户配置
      name: 'Alice',
      roles: ['admin', 'user'],
      meta: { age: 0x1e, active: true, },
    }`;
    const parsed = parseJson5(text);
    expect(parsed.error).toBeNull();
    expect(() => JSON.stringify(parsed.output)).not.toThrow();
  });
});

describe('stringifyJson5', () => {
  it('默认使用单引号、标识符键不加引号、尾逗号风格可读', () => {
    const out = stringifyJson5({ foo: "it's", 'a b': 1, list: [1, 2] });
    expect(out.error).toBeNull();
    expect(out.output).toContain("foo: 'it\\'s'");
    expect(out.output).toContain("'a b': 1");
    expect(out.output).toContain('list: [');
  });

  it('输出可被 parseJson5 解析回来（NaN/Infinity 除外）', () => {
    const value = { a: 1, b: 'x', c: [true, null, { d: 2 }] };
    const out = stringifyJson5(value);
    expect(parseJson5(out.output).output).toEqual(value);
  });

  it('循环引用报错', () => {
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    expect(stringifyJson5(cyclic).error).toContain('循环引用');
  });
});
