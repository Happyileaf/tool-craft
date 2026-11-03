import { describe, expect, it } from 'vitest';
import {
  PHP_KIND_MARKER,
  PHP_OBJECT_MARKER,
  isPhpArrayMarker,
  parsePhpSerialize,
  serializeToPhp,
} from './php-serialize';

describe('parsePhpSerialize', () => {
  it('解析标量与 null', () => {
    expect(parsePhpSerialize('i:42;').output).toBe(42);
    expect(parsePhpSerialize('i:-7;').output).toBe(-7);
    expect(parsePhpSerialize('d:3.14;').output).toBeCloseTo(3.14);
    expect(parsePhpSerialize('d:NAN;').output).toBeNaN();
    expect(parsePhpSerialize('b:1;').output).toBe(true);
    expect(parsePhpSerialize('b:0;').output).toBe(false);
    expect(parsePhpSerialize('N;').output).toBeNull();
  });

  it('按长度声明解析字符串（长度与内容不一致时给出错误）', () => {
    const ok = parsePhpSerialize('s:5:"hello";');
    expect(ok.error).toBeNull();
    expect(ok.output).toBe('hello');

    // 字符串内含分号与引号，长度声明保证二进制安全
    expect(parsePhpSerialize('s:11:"a;b\"c;d.e.f";').output).toBe('a;b"c;d.e.f');

    const bad = parsePhpSerialize('s:9:"abc";');
    expect(bad.error).toContain('长度');
    expect(bad.output).toBeNull();
  });

  it('解析索引数组并标记为 array', () => {
    const result = parsePhpSerialize('a:3:{i:0;s:1:"a";i:1;i:2;i:2;b:1;}');
    expect(result.error).toBeNull();
    const marker = result.output;
    expect(isPhpArrayMarker(marker)).toBe(true);
    expect((marker as never as Record<string, unknown>)[PHP_KIND_MARKER]).toBe('array');
    expect((marker as never as { data: unknown[] }).data).toEqual(['a', 2, true]);
  });

  it('解析关联数组并标记为 assoc', () => {
    const result = parsePhpSerialize('a:2:{s:3:"age";i:18;s:4:"name";s:3:"Bob";}');
    expect(result.error).toBeNull();
    const marker = result.output as Record<string, unknown>;
    expect(marker[PHP_OBJECT_MARKER]).toBe(true);
    expect(marker[PHP_KIND_MARKER]).toBe('assoc');
    expect(marker.data).toEqual({ age: 18, name: 'Bob' });
  });

  it('非 0..n-1 数字键判定为关联数组', () => {
    const result = parsePhpSerialize('a:2:{i:1;s:1:"a";i:2;s:1:"b";}');
    const marker = result.output as Record<string, unknown>;
    expect(marker[PHP_KIND_MARKER]).toBe('assoc');
    expect(marker.data).toEqual({ 1: 'a', 2: 'b' });
  });

  it('空数组解析为 array 标记', () => {
    const result = parsePhpSerialize('a:0:{}');
    const marker = result.output as Record<string, unknown>;
    expect(marker[PHP_KIND_MARKER]).toBe('array');
    expect(marker.data).toEqual([]);
  });

  it('嵌套数组往返', () => {
    const text = 'a:2:{s:5:"users";a:2:{i:0;s:3:"Amy";i:1;s:3:"Ben";}s:3:"age";i:30;}';
    const parsed = parsePhpSerialize(text);
    expect(parsed.error).toBeNull();
    const again = serializeToPhp(parsed.output);
    expect(again.error).toBeNull();
    expect(again.output).toBe(text);
  });

  it('拒绝对象类型 O: 并给出类名', () => {
    const result = parsePhpSerialize('O:8:"stdClass":0:{}');
    expect(result.error).toContain('对象');
    expect(result.error).toContain('stdClass');
  });

  it('截断与畸形输入给出定位错误', () => {
    expect(parsePhpSerialize('i:12').error).toContain('期望');
    expect(parsePhpSerialize('s:3:"ab";').error).toContain('长度');
    expect(parsePhpSerialize('a:1:{i:0;}').error).toContain('提前结束');
    expect(parsePhpSerialize('b:2;').error).toContain('布尔');
  });

  it('空白输入返回 null 无错误', () => {
    expect(parsePhpSerialize('   ')).toEqual({ output: null, error: null });
  });
});

describe('serializeToPhp', () => {
  it('序列化标量', () => {
    expect(serializeToPhp(null).output).toBe('N;');
    expect(serializeToPhp(true).output).toBe('b:1;');
    expect(serializeToPhp(false).output).toBe('b:0;');
    expect(serializeToPhp(42).output).toBe('i:42;');
    expect(serializeToPhp(-1).output).toBe('i:-1;');
    expect(serializeToPhp(2.5).output).toBe('d:2.5;');
    expect(serializeToPhp('hello').output).toBe('s:5:"hello";');
  });

  it('JS 数组序列化为索引数组', () => {
    expect(serializeToPhp(['a', 2, true]).output).toBe(
      'a:3:{i:0;s:1:"a";i:1;i:2;i:2;b:1;}',
    );
  });

  it('JS 对象序列化为关联数组', () => {
    expect(serializeToPhp({ name: 'Bob', age: 18 }).output).toBe(
      'a:2:{s:4:"name";s:3:"Bob";s:3:"age";i:18;}',
    );
  });

  it('字符串长度按 UTF-16 码元计数（emoji 2 码元）', () => {
    const result = serializeToPhp('a😀');
    expect(result.output).toBe('s:3:"a😀";');
  });

  it('往返：解析后再序列化保持等价', () => {
    const original = 'a:2:{s:1:"k";a:2:{i:0;i:1;i:1;s:3:"two";}s:1:"x";d:1.5;}';
    const parsed = parsePhpSerialize(original);
    expect(serializeToPhp(parsed.output).output).toBe(original);
  });
});
