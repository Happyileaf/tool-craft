import { describe, expect, it } from 'vitest';
import { generateSwift, toCamelCase, toPascalCase, typeName, type SwiftGenOptions } from './swift-gen';

const baseOptions: SwiftGenOptions = {
  rootName: 'Response',
  propertyNaming: 'camelCase',
  optionalTypes: true,
  codingKeys: true,
};

describe('toPascalCase / toCamelCase', () => {
  it('PascalCase', () => {
    expect(toPascalCase('user_id')).toBe('UserId');
    expect(toPascalCase('zip-code')).toBe('ZipCode');
    expect(toPascalCase('404')).toBe('N404');
    expect(toPascalCase('---')).toBe('Generated');
  });

  it('camelCase', () => {
    expect(toCamelCase('user_id')).toBe('userId');
    expect(toCamelCase('city')).toBe('city');
  });

  it('关键字反引号', () => {
    expect(toCamelCase('class')).toBe('`class`');
  });
});

describe('generateSwift - 基础类型', () => {
  it('标量映射与 Codable 声明', () => {
    const { code, warnings } = generateSwift(
      JSON.stringify({ id: 1, name: 'Alice', vip: true, score: 9.5, tags: ['a'] }),
      baseOptions,
    );
    expect(warnings).toEqual([]);
    expect(code).toContain('struct Response: Codable {');
    expect(code).toContain('let id: Int');
    expect(code).toContain('let name: String');
    expect(code).toContain('let vip: Bool');
    expect(code).toContain('let score: Double');
    expect(code).toContain('let tags: [String]');
  });

  it('嵌套对象生成独立 struct', () => {
    const { code } = generateSwift(JSON.stringify({ address: { city: 'Shanghai' } }), baseOptions);
    expect(code).toContain('let address: Address');
    expect(code).toContain('struct Address: Codable {');
  });

  it('无键名改写时不输出 CodingKeys', () => {
    const { code } = generateSwift(JSON.stringify({ id: 1, name: 'x' }), baseOptions);
    expect(code).not.toContain('CodingKeys');
  });
});

describe('generateSwift - CodingKeys 与命名', () => {
  it('snake_case 默认 camelCase 并生成 CodingKeys', () => {
    const { code } = generateSwift(JSON.stringify({ user_id: 7, is_vip: true }), baseOptions);
    expect(code).toContain('let userId: Int');
    expect(code).toContain('enum CodingKeys: String, CodingKey {');
    expect(code).toContain('case userId = "user_id"');
    expect(code).toContain('case isVip = "is_vip"');
  });

  it('连字符键在 preserve 模式下改写并加 CodingKeys', () => {
    const { code } = generateSwift(JSON.stringify({ 'user-name': 'Alice' }), {
      ...baseOptions,
      propertyNaming: 'preserve',
    });
    expect(code).toContain('let userName: String');
    expect(code).toContain('case userName = "user-name"');
  });

  it('关闭 CodingKeys 时不生成枚举', () => {
    const { code } = generateSwift(JSON.stringify({ user_id: 7 }), {
      ...baseOptions,
      codingKeys: false,
    });
    expect(code).toContain('let userId: Int');
    expect(code).not.toContain('CodingKeys');
  });

  it('CodingKeys 中保留未改名字段', () => {
    const { code } = generateSwift(
      JSON.stringify({ user_id: 7, city: 'Shanghai' }),
      baseOptions,
    );
    expect(code).toContain('case city');
  });

  it('关键字属性反引号转义', () => {
    const { code } = generateSwift(JSON.stringify({ class: 'x' }), baseOptions);
    expect(code).toContain('case `class` = "class"');
    expect(code).toContain('let `class`: String');
  });
});

describe('generateSwift - 数组与合并', () => {
  it('同型对象数组合并字段且缺失字段可选', () => {
    const { code, warnings } = generateSwift(
      JSON.stringify({
        items: [
          { id: 1, name: 'a' },
          { id: 2, name: 'b', extra: true },
        ],
      }),
      baseOptions,
    );
    expect(warnings).toEqual([]);
    expect(code).toContain('let items: [Item]');
    expect(code).toContain('let extra: Bool?');
    expect(code).toContain('let name: String');
    expect(code).not.toContain('Item2');
  });

  it('空数组回退 [Any] 并告警', () => {
    const { code, warnings } = generateSwift(JSON.stringify({ items: [] }), baseOptions);
    expect(code).toContain('let items: [Any]');
    expect(warnings.some((w) => w.includes('空数组'))).toBe(true);
  });

  it('异型数组回退 Any 并告警', () => {
    const { code, warnings } = generateSwift(JSON.stringify({ mix: [1, 'a'] }), baseOptions);
    expect(code).toContain('let mix: [Any]');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('Int 与 Double 合并为 Double', () => {
    const { code } = generateSwift(JSON.stringify({ nums: [1, 1.5] }), baseOptions);
    expect(code).toContain('let nums: [Double]');
  });

  it('数组元素中的 null 采用另一侧类型并标记可选', () => {
    const { code, warnings } = generateSwift(
      JSON.stringify({ items: [{ count: 1 }, { count: null }] }),
      baseOptions,
    );
    expect(warnings).toEqual([]);
    expect(code).toContain('let count: Int?');
  });
});

describe('generateSwift - 可选与边界', () => {
  it('null 字段输出 Any?', () => {
    const { code } = generateSwift(JSON.stringify({ count: null, name: 'x' }), baseOptions);
    expect(code).toContain('let count: Any?');
  });

  it('关闭可选类型', () => {
    const { code } = generateSwift(JSON.stringify({ a: 'x', b: null }), {
      ...baseOptions,
      optionalTypes: false,
    });
    expect(code).toContain('let a: String');
    expect(code).toContain('let b: Any');
    expect(code).not.toContain('?');
  });

  it('非法 JSON', () => {
    const r = generateSwift('{bad', baseOptions);
    expect(r.code).toBe('');
    expect(r.warnings[0]).toContain('JSON 解析失败');
  });

  it('空输入', () => {
    expect(generateSwift('   ', baseOptions)).toEqual({ code: '', warnings: [] });
  });

  it('顶层数组包装 items', () => {
    const { code, warnings } = generateSwift(JSON.stringify([{ id: 1 }]), baseOptions);
    expect(code).toContain('let items: [Item]');
    expect(warnings.some((w) => w.includes('顶层 JSON 为数组'))).toBe(true);
  });

  it('顶层标量包装 value', () => {
    const { code, warnings } = generateSwift('42', baseOptions);
    expect(code).toContain('let value: Int');
    expect(warnings.some((w) => w.includes('标量'))).toBe(true);
  });

  it('默认根类名', () => {
    const { code } = generateSwift('{"a":1}', { ...baseOptions, rootName: '' });
    expect(code).toContain('struct Root: Codable');
  });

  it('重名嵌套结构体自动编号', () => {
    const { code } = generateSwift(
      JSON.stringify({ node: { id: 1, node: { id: 2 } } }),
      baseOptions,
    );
    expect(code).toContain('struct Node: Codable');
    expect(code).toContain('struct Node2: Codable');
  });
});

describe('typeName', () => {
  it('命名类型与可选后缀', () => {
    expect(typeName({ kind: 'named', name: 'String' }, false)).toBe('String');
    expect(typeName({ kind: 'named', name: 'String' }, true)).toBe('String?');
    expect(typeName({ kind: 'named', name: '__null__' }, false)).toBe('Any');
  });

  it('数组类型', () => {
    const inner = { kind: 'named', name: 'Int' } as const;
    expect(typeName({ kind: 'array', element: inner }, false)).toBe('[Int]');
    expect(typeName({ kind: 'array', element: inner }, true)).toBe('[Int]?');
  });
});
