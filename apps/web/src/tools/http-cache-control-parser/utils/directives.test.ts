import { describe, expect, it } from 'vitest';
import { findDirective, hasDirective, parseCacheControl } from './directives';

describe('parseCacheControl', () => {
  it('解析带引号与不带引号的 token', () => {
    const result = parseCacheControl('public, max-age="604800", immutable');
    expect(result.directives).toHaveLength(3);
    const maxAge = findDirective(result.directives, 'max-age');
    expect(maxAge?.numericValue).toBe(604800);
    expect(maxAge?.value).toBe('604800');
    expect(hasDirective(result.directives, 'immutable')).toBe(true);
  });

  it('大小写归一化并忽略空白', () => {
    const result = parseCacheControl('  Public ,  MAX-AGE = 60 ');
    expect(result.directives.map((d) => d.name)).toEqual(['public', 'max-age']);
    expect(findDirective(result.directives, 'max-age')?.numericValue).toBe(60);
  });

  it('空串返回空列表', () => {
    expect(parseCacheControl('').directives).toEqual([]);
    expect(parseCacheControl('   ').directives).toEqual([]);
  });

  it('未知指令产生告警但保留', () => {
    const result = parseCacheControl('max-age=60, x-custom-flag');
    const unknown = result.directives.find((d) => d.name === 'x-custom-flag');
    expect(unknown?.known).toBe(false);
    expect(result.warnings.some((w) => w.includes('未知指令'))).toBe(true);
  });

  it('非法数值按 0 处理并告警', () => {
    const result = parseCacheControl('max-age=abc');
    expect(findDirective(result.directives, 'max-age')?.numericValue).toBe(0);
    expect(result.warnings.some((w) => w.includes('不是合法的非负整数秒'))).toBe(true);
  });

  it('负值非法', () => {
    const result = parseCacheControl('max-age=-10');
    expect(findDirective(result.directives, 'max-age')?.numericValue).toBe(0);
  });

  it('重复指令以首次为准并告警', () => {
    const result = parseCacheControl('max-age=60, max-age=600');
    expect(result.warnings.some((w) => w.includes('重复出现'))).toBe(true);
    expect(findDirective(result.directives, 'max-age')?.numericValue).toBe(60);
  });

  it('public 与 private 冲突告警', () => {
    const result = parseCacheControl('public, private, max-age=0');
    expect(result.warnings.some((w) => w.includes('互斥'))).toBe(true);
  });

  it('no-store 与 max-age 冲突告警', () => {
    const result = parseCacheControl('no-store, max-age=60');
    expect(result.warnings.some((w) => w.includes('no-store 优先'))).toBe(true);
  });

  it('请求端模式下 min-fresh/max-stale 为已知指令', () => {
    const result = parseCacheControl('max-stale=30, min-fresh=10', 'request');
    expect(result.directives.every((d) => d.known)).toBe(true);
    expect(findDirective(result.directives, 'max-stale')?.numericValue).toBe(30);
    expect(findDirective(result.directives, 'min-fresh')?.numericValue).toBe(10);
  });

  it('请求端模式下 public 是未知指令', () => {
    const result = parseCacheControl('public', 'request');
    expect(result.directives[0]?.known).toBe(false);
  });

  it('no-cache 带字段列表时保留原始值', () => {
    const result = parseCacheControl('no-cache="set-cookie"');
    const noCache = findDirective(result.directives, 'no-cache');
    expect(noCache?.value).toBe('set-cookie');
    expect(noCache?.numericValue).toBeNull();
  });

  it('s-maxage 与 stale-while-revalidate 正常解析', () => {
    const result = parseCacheControl('s-maxage=3600, stale-while-revalidate=600');
    expect(findDirective(result.directives, 's-maxage')?.numericValue).toBe(3600);
    expect(findDirective(result.directives, 'stale-while-revalidate')?.numericValue).toBe(600);
  });
});
