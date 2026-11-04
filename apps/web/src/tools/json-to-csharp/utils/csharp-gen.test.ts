import { describe, expect, it } from 'vitest';
import { generateCSharp, toPascalCase, toPropertyName, typeName, type CSharpGenOptions } from './csharp-gen';

const baseOptions: CSharpGenOptions = {
  rootName: 'Response',
  style: 'record',
  nullableRefTypes: true,
  namespace: '',
};

describe('toPascalCase', () => {
  it('snake/kebab 转 PascalCase', () => {
    expect(toPascalCase('user_id')).toBe('UserId');
    expect(toPascalCase('zip-code')).toBe('ZipCode');
  });

  it('数字开头补 N', () => {
    expect(toPascalCase('404_body')).toBe('N404Body');
  });
});

describe('toPropertyName', () => {
  it('常规键转 PascalCase', () => {
    expect(toPropertyName('user_id')).toBe('UserId');
  });

  it('C# 关键字加 @ 前缀', () => {
    expect(toPropertyName('class')).toBe('@Class');
    expect(toPropertyName('new')).toBe('@New');
  });
});

describe('generateCSharp - record 风格', () => {
  it('标量类型与基础结构', () => {
    const { code, warnings } = generateCSharp(
      JSON.stringify({ id: 1, name: 'Alice', vip: true, score: 9.5, tags: ['a'] }),
      baseOptions,
    );
    expect(warnings).toEqual([]);
    expect(code).toContain('using System.Collections.Generic;');
    expect(code).toContain('#nullable enable');
    expect(code).toContain('public record Response(');
    expect(code).toContain('int Id');
    expect(code).toContain('string Name');
    expect(code).toContain('bool Vip');
    expect(code).toContain('double Score');
    expect(code).toContain('List<string> Tags');
  });

  it('输出 file-scoped namespace', () => {
    const { code } = generateCSharp('{"a":1}', { ...baseOptions, namespace: 'Example.Dtos' });
    expect(code).toContain('namespace Example.Dtos;');
  });

  it('嵌套对象生成 sealed record', () => {
    const { code } = generateCSharp(JSON.stringify({ address: { city: 'Shanghai' } }), baseOptions);
    expect(code).toContain('Address Address');
    expect(code).toContain('public sealed record Address(');
  });

  it('同型对象数组合并字段且缺失字段可空', () => {
    const { code, warnings } = generateCSharp(
      JSON.stringify({
        items: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b', extra: true },
        ],
      }),
      baseOptions,
    );
    expect(warnings).toEqual([]);
    expect(code).toContain('List<Item> Items');
    expect(code).toContain('bool? Extra');
    expect(code).toContain('string Name');
  });

  it('空数组回退 object 并告警', () => {
    const { code, warnings } = generateCSharp(JSON.stringify({ items: [] }), baseOptions);
    expect(code).toContain('List<object> Items');
    expect(warnings.some((w) => w.includes('空数组'))).toBe(true);
  });

  it('null 值字段：引用类型加 ?，值类型加 ?', () => {
    const { code } = generateCSharp(JSON.stringify({ count: null, name: 'x' }), baseOptions);
    expect(code).toContain('object? Count');
    const { code: code2 } = generateCSharp(
      JSON.stringify({ items: [{ count: 1 }, { count: null }] }),
      baseOptions,
    );
    expect(code2).toContain('int? Count');
  });

  it('异型数组回退 object 并告警', () => {
    const { code, warnings } = generateCSharp(JSON.stringify({ mix: [1, 'a'] }), baseOptions);
    expect(code).toContain('List<object> Mix');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('关键字属性名转义', () => {
    const { code } = generateCSharp(JSON.stringify({ new: 1, class: 'x' }), baseOptions);
    expect(code).toContain('int @New');
    expect(code).toContain('string @Class');
  });

  it('关闭 NRT 时引用类型不加 ?', () => {
    const r = generateCSharp(JSON.stringify({ a: 'x', b: null }), {
      ...baseOptions,
      nullableRefTypes: false,
    });
    expect(r.code).not.toContain('#nullable enable');
    expect(r.code).toContain('string A');
    expect(r.code).toContain('object B');
    expect(r.code).not.toContain('string? A');
  });
});

describe('generateCSharp - class 风格', () => {
  it('生成 { get; set; } 属性', () => {
    const { code } = generateCSharp(JSON.stringify({ user_id: 7, is_vip: false }), {
      ...baseOptions,
      style: 'class',
    });
    expect(code).toContain('public class Response');
    expect(code).toContain('public int UserId { get; set; }');
    expect(code).toContain('public bool IsVip { get; set; }');
  });
});

describe('generateCSharp - 边界', () => {
  it('非法 JSON', () => {
    const r = generateCSharp('{bad', baseOptions);
    expect(r.code).toBe('');
    expect(r.warnings[0]).toContain('JSON 解析失败');
  });

  it('空输入', () => {
    expect(generateCSharp('   ', baseOptions)).toEqual({ code: '', warnings: [] });
  });

  it('顶层数组包装为 Items', () => {
    const { code, warnings } = generateCSharp(JSON.stringify([{ id: 1 }]), baseOptions);
    expect(code).toContain('List<Item> Items');
    expect(warnings.some((w) => w.includes('顶层 JSON 为数组'))).toBe(true);
  });

  it('顶层标量包装为 Value', () => {
    const { code, warnings } = generateCSharp('42', baseOptions);
    expect(code).toContain('int Value');
    expect(warnings.some((w) => w.includes('标量'))).toBe(true);
  });

  it('默认根类名', () => {
    const { code } = generateCSharp('{"a":1}', { ...baseOptions, rootName: '' });
    expect(code).toContain('record Root(');
  });

  it('重名嵌套类编号', () => {
    const { code } = generateCSharp(JSON.stringify({ node: { id: 1, node: { id: 2 } } }), baseOptions);
    expect(code).toContain('record Node(');
    expect(code).toContain('record Node2(');
  });

  it('大整数映射 long', () => {
    const { code } = generateCSharp(JSON.stringify({ big: 9007199254740993 }), baseOptions);
    expect(code).toContain('long Big');
  });
});

describe('typeName 可空规则', () => {
  it('值类型与引用类型的可空标注', () => {
    expect(typeName({ kind: 'named', name: 'int' }, true, true)).toBe('int?');
    expect(typeName({ kind: 'named', name: 'string' }, true, true)).toBe('string?');
    expect(typeName({ kind: 'named', name: 'string' }, true, false)).toBe('string');
    expect(typeName({ kind: 'named', name: 'object' }, true, true)).toBe('object?');
    expect(typeName({ kind: 'named', name: 'int' }, false, true)).toBe('int');
  });
});
