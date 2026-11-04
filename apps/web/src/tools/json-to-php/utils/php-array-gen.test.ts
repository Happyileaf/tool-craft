import { describe, expect, it } from 'vitest';
import { generatePhpArray, quotePhpString } from './php-array-gen';

describe('quotePhpString', () => {
  it('普通字符串加单引号', () => {
    expect(quotePhpString('abc')).toBe("'abc'");
  });

  it('单引号与反斜杠转义', () => {
    expect(quotePhpString("it's")).toBe("'it\\'s'");
    expect(quotePhpString('C:\\app')).toBe("'C:\\\\app'");
  });

  it('双引号与美元符号不转义', () => {
    expect(quotePhpString('say "hi" $x')).toBe("'say \"hi\" $x'");
  });
});

describe('generatePhpArray - 基础类型', () => {
  it('标量映射', () => {
    const { code, warnings } = generatePhpArray(
      JSON.stringify({ i: 1, f: 1.5, b: true, s: 'x', n: null }),
    );
    expect(warnings).toEqual([]);
    expect(code).toContain("'i' => 1,");
    expect(code).toContain("'f' => 1.5,");
    expect(code).toContain("'b' => true,");
    expect(code).toContain("'s' => 'x',");
    expect(code).toContain("'n' => null,");
  });

  it('默认 $data 赋值并带分号', () => {
    const { code } = generatePhpArray('{"a":1}');
    expect(code.startsWith('$data = [')).toBe(true);
    expect(code.trimEnd().endsWith(';')).toBe(true);
  });

  it('可关闭结尾分号', () => {
    const { code } = generatePhpArray('{"a":1}', { trailingSemicolon: false });
    expect(code.trimEnd().endsWith(';')).toBe(false);
    expect(code.trimEnd().endsWith(']')).toBe(true);
  });
});

describe('generatePhpArray - 数组与嵌套', () => {
  it('索引数组（短语法）', () => {
    const { code } = generatePhpArray(JSON.stringify({ tags: ['a', 'b'] }));
    expect(code).toContain("'tags' => [");
    expect(code).toContain("        'a',");
    expect(code).toContain("        'b',");
  });

  it('传统 array() 语法', () => {
    const { code } = generatePhpArray(JSON.stringify({ tags: ['a'] }), { shortSyntax: false });
    expect(code).toContain("'tags' => array(");
    expect(code).not.toContain('[');
    expect(code).toContain(')');
  });

  it('嵌套关联数组与缩进', () => {
    const { code } = generatePhpArray(JSON.stringify({ settings: { theme: 'auto' } }));
    expect(code).toContain("'settings' => [");
    expect(code).toContain("        'theme' => 'auto',");
  });

  it('Tab 缩进', () => {
    const { code } = generatePhpArray(JSON.stringify({ a: { b: 1 } }), { indent: 'tab' });
    expect(code).toContain('\t\t\'b\' => 1,');
    expect(code).not.toContain('        ');
  });

  it('空数组与空对象均输出 []', () => {
    const { code, warnings } = generatePhpArray(JSON.stringify({ a: [], b: {} }));
    expect(warnings).toEqual([]);
    expect(code).toContain("'a' => [],");
    expect(code).toContain("'b' => [],");
  });

  it('根为数组', () => {
    const { code } = generatePhpArray(JSON.stringify([1, 2, 3]));
    expect(code.startsWith('$data = [')).toBe(true);
    expect(code).toContain('    1,');
    expect(code).toContain('    3,');
  });

  it('根为标量', () => {
    expect(generatePhpArray('42').code).toBe('$data = 42;\n');
    expect(generatePhpArray('"hello"').code).toBe("$data = 'hello';\n");
  });

  it('深嵌套数组元素缩进正确', () => {
    const { code } = generatePhpArray(JSON.stringify({ list: [[1]] }));
    expect(code).toContain("'list' => [");
    expect(code).toContain('        [');
    expect(code).toContain('            1,');
  });
});

describe('generatePhpArray - 边界', () => {
  it('非法 JSON', () => {
    const r = generatePhpArray('{bad');
    expect(r.code).toBe('');
    expect(r.warnings[0]).toContain('JSON 解析失败');
  });

  it('空输入', () => {
    expect(generatePhpArray('   ')).toEqual({ code: '', warnings: [] });
  });

  it('浮点精度保留', () => {
    const { code } = generatePhpArray(JSON.stringify({ ratio: 0.85 }));
    expect(code).toContain("'ratio' => 0.85,");
  });

  it('大整数原样输出', () => {
    const { code } = generatePhpArray('{"big":9007199254740993}');
    expect(code).toContain("'big' => 9007199254740992,");
  });

  it('键名中含单引号被转义', () => {
    const { code } = generatePhpArray(JSON.stringify({ "it's": 1 }));
    expect(code).toContain("'it\\'s' => 1,");
  });
});
