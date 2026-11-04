import { describe, expect, it } from 'vitest';
import {
  generateKotlin,
  toCamelCase,
  toPascalCase,
  typeName,
  type KotlinGenOptions,
} from './kotlin-gen';

const baseOptions: KotlinGenOptions = {
  rootName: 'Response',
  propertyNaming: 'preserve',
  nullableTypes: true,
  useList: true,
  packageName: '',
};

describe('toPascalCase', () => {
  it('snake/kebab 转 PascalCase', () => {
    expect(toPascalCase('user_id')).toBe('UserId');
    expect(toPascalCase('zip-code')).toBe('ZipCode');
  });

  it('数字开头补 N', () => {
    expect(toPascalCase('404_body')).toBe('N404Body');
  });

  it('空输入回退 Generated', () => {
    expect(toPascalCase('---')).toBe('Generated');
  });
});

describe('toCamelCase', () => {
  it('snake/kebab 转 camelCase', () => {
    expect(toCamelCase('user_id')).toBe('userId');
    expect(toCamelCase('zip-code')).toBe('zipCode');
  });

  it('硬关键字加反引号', () => {
    expect(toCamelCase('class')).toBe('`class`');
    expect(toCamelCase('is')).toBe('`is`');
  });
});

describe('generateKotlin - 基础类型', () => {
  it('标量类型与基础结构', () => {
    const { code, warnings } = generateKotlin(
      JSON.stringify({ id: 1, name: 'Alice', vip: true, score: 9.5, tags: ['a'] }),
      baseOptions,
    );
    expect(warnings).toEqual([]);
    expect(code).toContain('data class Response(');
    expect(code).toContain('val id: Int,');
    expect(code).toContain('val name: String,');
    expect(code).toContain('val vip: Boolean,');
    expect(code).toContain('val score: Double,');
    expect(code).toContain('val tags: List<String>,');
  });

  it('大整数映射 Long，小整数映射 Int', () => {
    const { code } = generateKotlin(JSON.stringify({ small: 1024, big: 3000000000 }), baseOptions);
    expect(code).toContain('val small: Int,');
    expect(code).toContain('val big: Long,');
  });

  it('数组元素数值类型按 Int/Long/Double 拓宽', () => {
    const { code, warnings } = generateKotlin(
      JSON.stringify({ nums: [1, 3000000000, 1.5] }),
      baseOptions,
    );
    expect(warnings).toEqual([]);
    expect(code).toContain('val nums: List<Double>,');
  });

  it('输出 package 声明', () => {
    const { code } = generateKotlin('{"a":1}', { ...baseOptions, packageName: 'com.example.dto' });
    expect(code.startsWith('package com.example.dto\n\n')).toBe(true);
  });

  it('嵌套对象生成内嵌 data class', () => {
    const { code } = generateKotlin(JSON.stringify({ address: { city: 'Shanghai' } }), baseOptions);
    expect(code).toContain('val address: Address,');
    expect(code).toContain('    data class Address(');
    expect(code).toContain('val city: String');
  });
});

describe('generateKotlin - 数组与合并', () => {
  it('同型对象数组合并字段且缺失字段可空', () => {
    const { code, warnings } = generateKotlin(
      JSON.stringify({
        items: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b', extra: true },
        ],
      }),
      baseOptions,
    );
    expect(warnings).toEqual([]);
    expect(code).toContain('val items: List<Item>,');
    expect(code).toContain('val extra: Boolean? = null');
    expect(code).toContain('val name: String');
    expect(code).not.toContain('Item2');
  });

  it('空数组回退 List<Any> 并告警', () => {
    const { code, warnings } = generateKotlin(JSON.stringify({ items: [] }), baseOptions);
    expect(code).toContain('val items: List<Any>,');
    expect(warnings.some((w) => w.includes('空数组'))).toBe(true);
  });

  it('异型数组回退 Any 并告警', () => {
    const { code, warnings } = generateKotlin(JSON.stringify({ mix: [1, 'a'] }), baseOptions);
    expect(code).toContain('val mix: List<Any>,');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('数组元素中的 null 采用另一侧类型并标记可空', () => {
    const { code, warnings } = generateKotlin(
      JSON.stringify({ items: [{ count: 1 }, { count: null }] }),
      baseOptions,
    );
    expect(warnings).toEqual([]);
    expect(code).toContain('val count: Int? = null');
  });

  it('useList=false 时输出 Array<T>', () => {
    const { code } = generateKotlin(JSON.stringify({ tags: ['a'] }), {
      ...baseOptions,
      useList: false,
    });
    expect(code).toContain('val tags: Array<String>,');
  });
});

describe('generateKotlin - 可空与命名', () => {
  it('null 值字段输出 Any? = null', () => {
    const { code } = generateKotlin(JSON.stringify({ count: null, name: 'x' }), baseOptions);
    expect(code).toContain('val count: Any? = null,');
  });

  it('关闭 nullableTypes 时不输出可空标注', () => {
    const { code } = generateKotlin(JSON.stringify({ a: 'x', b: null }), {
      ...baseOptions,
      nullableTypes: false,
    });
    expect(code).toContain('val a: String,');
    expect(code).toContain('val b: Any,');
    expect(code).not.toContain('? = null');
  });

  it('preserve 模式：非法键转 camelCase 并加 @SerializedName', () => {
    const { code } = generateKotlin(
      JSON.stringify({ 'user-name': 'Alice', user_id: 7 }),
      baseOptions,
    );
    expect(code).toContain('import com.google.gson.annotations.SerializedName');
    expect(code).toContain('@SerializedName("user-name")');
    expect(code).toContain('val userName: String,');
    // 合法的 snake_case 键在 preserve 模式下原样保留、不加注解
    expect(code).toContain('val user_id: Int,');
    expect(code).not.toContain('@SerializedName("user_id")');
  });

  it('preserve 模式：硬关键字加反引号并加 @SerializedName', () => {
    const { code } = generateKotlin(JSON.stringify({ class: 'x', is: true }), baseOptions);
    expect(code).toContain('@SerializedName("class")');
    expect(code).toContain('val `class`: String,');
    expect(code).toContain('@SerializedName("is")');
    expect(code).toContain('val `is`: Boolean,');
  });

  it('camelCase 模式：snake_case 属性转 camelCase 并加注解', () => {
    const { code } = generateKotlin(JSON.stringify({ user_id: 7, city: 'x' }), {
      ...baseOptions,
      propertyNaming: 'camelCase',
    });
    expect(code).toContain('@SerializedName("user_id")');
    expect(code).toContain('val userId: Int,');
    expect(code).toContain('val city: String,');
    expect(code).not.toContain('@SerializedName("city")');
  });

  it('无需重命名时不输出 SerializedName import', () => {
    const { code } = generateKotlin(JSON.stringify({ id: 1, name: 'x' }), baseOptions);
    expect(code).not.toContain('import com.google.gson');
  });
});

describe('generateKotlin - 边界', () => {
  it('非法 JSON', () => {
    const r = generateKotlin('{bad', baseOptions);
    expect(r.code).toBe('');
    expect(r.warnings[0]).toContain('JSON 解析失败');
  });

  it('空输入', () => {
    expect(generateKotlin('   ', baseOptions)).toEqual({ code: '', warnings: [] });
  });

  it('顶层数组包装为 items', () => {
    const { code, warnings } = generateKotlin(JSON.stringify([{ id: 1 }]), baseOptions);
    expect(code).toContain('val items: List<Item>,');
    expect(warnings.some((w) => w.includes('顶层 JSON 为数组'))).toBe(true);
  });

  it('顶层标量包装为 value', () => {
    const { code, warnings } = generateKotlin('42', baseOptions);
    expect(code).toContain('val value: Int,');
    expect(warnings.some((w) => w.includes('标量'))).toBe(true);
  });

  it('默认根类名', () => {
    const { code } = generateKotlin('{"a":1}', { ...baseOptions, rootName: '' });
    expect(code).toContain('data class Root(');
  });

  it('重名嵌套类自动编号', () => {
    const { code } = generateKotlin(
      JSON.stringify({ node: { id: 1, node: { id: 2 } } }),
      baseOptions,
    );
    expect(code).toContain('data class Node(');
    expect(code).toContain('data class Node2(');
  });
});

describe('typeName', () => {
  it('命名类型与可空后缀', () => {
    expect(typeName({ kind: 'named', name: 'String' }, true, false)).toBe('String');
    expect(typeName({ kind: 'named', name: 'String' }, true, true)).toBe('String? = null');
    expect(typeName({ kind: 'named', name: '__null__' }, true, false)).toBe('Any');
  });

  it('List / Array 集合', () => {
    const inner = { kind: 'named', name: 'Int' } as const;
    expect(typeName({ kind: 'list', element: inner }, true, false)).toBe('List<Int>');
    expect(typeName({ kind: 'list', element: inner }, false, false)).toBe('Array<Int>');
    expect(typeName({ kind: 'list', element: inner }, true, true)).toBe('List<Int>? = null');
  });
});
