import { describe, expect, it } from 'vitest';
import {
  generateJava,
  isValidJavaIdentifier,
  toJavaClassName,
  toJavaFieldName,
  type JavaGenOptions,
} from './java-gen';

const baseOptions: JavaGenOptions = {
  rootName: 'Response',
  style: 'record',
  useList: true,
  useBigNumbers: false,
  packageName: '',
};

describe('toJavaFieldName', () => {
  it('snake/kebab/dot 键转小驼峰', () => {
    expect(toJavaFieldName('user_id')).toBe('userId');
    expect(toJavaFieldName('user-name')).toBe('userName');
    expect(toJavaFieldName('user.name')).toBe('userName');
  });

  it('处理首字符为数字、空白与非法字符', () => {
    expect(toJavaFieldName('1st')).toBe('n1st');
    expect(toJavaFieldName('   ')).toBe('field');
    expect(toJavaFieldName('foo bar')).toBe('fooBar');
  });

  it('规避 Java 关键字', () => {
    expect(toJavaFieldName('class')).toBe('classField');
    expect(toJavaFieldName('new')).toBe('newField');
  });
});

describe('toJavaClassName', () => {
  it('生成大驼峰类名', () => {
    expect(toJavaClassName('user_info')).toBe('UserInfo');
    expect(toJavaClassName('zip-code')).toBe('ZipCode');
  });

  it('数字开头补 N 前缀', () => {
    expect(toJavaClassName('404_body')).toBe('N404Body');
  });
});

describe('isValidJavaIdentifier', () => {
  it('识别合法与非法标识符', () => {
    expect(isValidJavaIdentifier('userId')).toBe(true);
    expect(isValidJavaIdentifier('1st')).toBe(false);
    expect(isValidJavaIdentifier('class')).toBe(false);
    expect(isValidJavaIdentifier('')).toBe(false);
  });
});

describe('generateJava - record 风格', () => {
  it('基础标量类型与 package/import 头', () => {
    const { code, warnings } = generateJava(
      JSON.stringify({ id: 1, name: 'Alice', vip: true, score: 9.5, tags: ['a'] }),
      baseOptions,
    );
    expect(warnings).toEqual([]);
    expect(code).not.toContain('package ');
    expect(code).toContain('import java.util.List;');
    expect(code).toContain('public record Response(');
    expect(code).toContain('int id');
    expect(code).toContain('String name');
    expect(code).toContain('boolean vip');
    expect(code).toContain('double score');
    expect(code).toContain('List<String> tags');
  });

  it('输出 package 声明', () => {
    const { code } = generateJava('{"a":1}', { ...baseOptions, packageName: 'com.example.dto' });
    expect(code.startsWith('package com.example.dto;\n')).toBe(true);
  });

  it('嵌套对象生成静态内部 record', () => {
    const { code } = generateJava(
      JSON.stringify({ address: { city: 'Shanghai', zip: '200000' } }),
      baseOptions,
    );
    expect(code).toContain('Address address');
    expect(code).toContain('public static record Address(');
    expect(code).toContain('String city');
  });

  it('同型对象数组合并字段', () => {
    const { code, warnings } = generateJava(
      JSON.stringify({
        items: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b', extra: true },
        ],
      }),
      baseOptions,
    );
    expect(warnings).toEqual([]);
    expect(code).toContain('List<Item> items');
    expect(code).toContain('public static record Item(');
    expect(code).toContain('int id');
    expect(code).toContain('Boolean extra');
  });

  it('空数组元素回退 Object 并给出 warning', () => {
    const { code, warnings } = generateJava(JSON.stringify({ items: [] }), baseOptions);
    expect(code).toContain('List<Object> items');
    expect(warnings.some((w) => w.includes('空数组'))).toBe(true);
  });

  it('null 字段：原始类型改用包装类型', () => {
    const { code } = generateJava(JSON.stringify({ count: null, name: 'x' }), baseOptions);
    expect(code).toContain('Object count');
    const { code: code2 } = generateJava(
      JSON.stringify({ items: [{ count: 1 }, { count: null }] }),
      baseOptions,
    );
    expect(code2).toContain('Integer count');
  });

  it('异型数组回退并产生冲突 warning', () => {
    const { code, warnings } = generateJava(JSON.stringify({ mix: [1, 'a'] }), baseOptions);
    expect(code).toContain('List<Object> mix');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('字段名关键字规避', () => {
    const { code } = generateJava(JSON.stringify({ new: 1, class: 'x' }), baseOptions);
    expect(code).toContain('int newField');
    expect(code).toContain('String classField');
  });
});

describe('generateJava - class 风格', () => {
  it('生成字段 + getter/setter', () => {
    const { code } = generateJava(JSON.stringify({ user_id: 7, is_vip: false }), {
      ...baseOptions,
      style: 'class',
    });
    expect(code).toContain('public class Response {');
    expect(code).toContain('private int userId;');
    expect(code).toContain('public int getUserId()');
    expect(code).toContain('public void setUserId(int userId)');
    expect(code).toContain('private boolean isVip;');
    expect(code).toContain('public boolean isVip()');
    expect(code).toContain('public void setVip(boolean isVip)');
  });

  it('嵌套对象生成 static class', () => {
    const { code } = generateJava(JSON.stringify({ addr: { city: 'SH' } }), {
      ...baseOptions,
      style: 'class',
    });
    expect(code).toContain('public static class Addr {');
    expect(code).toContain('public String getCity()');
  });
});

describe('generateJava - 选项', () => {
  it('useList=false 时输出数组类型', () => {
    const { code } = generateJava(JSON.stringify({ tags: ['a'], nums: [1, 2] }), {
      ...baseOptions,
      useList: false,
    });
    expect(code).not.toContain('java.util.List');
    expect(code).toContain('String[] tags');
    expect(code).toContain('int[] nums');
  });

  it('useBigNumbers 时使用 BigInteger/BigDecimal 与 import', () => {
    const big = '9007199254740993';
    const { code } = generateJava(JSON.stringify({ big: Number(big), money: 1.25 }), {
      ...baseOptions,
      useBigNumbers: true,
    });
    expect(code).toContain('BigInteger big');
    expect(code).toContain('BigDecimal money');
    expect(code).toContain('import java.math.BigDecimal;');
    expect(code).toContain('import java.math.BigInteger;');
  });

  it('安全范围外整数默认映射 long', () => {
    const { code } = generateJava(
      JSON.stringify({ big: Number('9007199254740993') }),
      baseOptions,
    );
    expect(code).toContain('long big');
  });
});

describe('generateJava - 边界', () => {
  it('非法 JSON 返回解析错误且 code 为空', () => {
    const result = generateJava('{not json', baseOptions);
    expect(result.code).toBe('');
    expect(result.warnings[0]).toContain('JSON 解析失败');
  });

  it('空输入返回空结果', () => {
    expect(generateJava('   ', baseOptions)).toEqual({ code: '', warnings: [] });
  });

  it('顶层数组包装为 items 字段', () => {
    const { code, warnings } = generateJava(JSON.stringify([{ id: 1 }, { id: 2 }]), baseOptions);
    expect(code).toContain('List<Item> items');
    expect(warnings.some((w) => w.includes('顶层 JSON 为数组'))).toBe(true);
  });

  it('顶层标量包装为 value 字段', () => {
    const { code, warnings } = generateJava('42', baseOptions);
    expect(code).toContain('int value');
    expect(warnings.some((w) => w.includes('标量'))).toBe(true);
  });

  it('根类名非法时自动修正', () => {
    const { code } = generateJava('{"a":1}', { ...baseOptions, rootName: '123 bad' });
    expect(code).toContain('record N123Bad(');
  });

  it('重名嵌套类自动追加序号', () => {
    const { code } = generateJava(
      JSON.stringify({ node: { id: 1, node: { id: 2 } } }),
      baseOptions,
    );
    expect(code).toContain('record Node(');
    expect(code).toContain('record Node2(');
  });
});
