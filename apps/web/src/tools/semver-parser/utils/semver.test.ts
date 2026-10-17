import { describe, it, expect } from 'vitest';
import {
  CompareResultEnum,
  checkRange,
  compareParsed,
  compareVersions,
  isValidVersion,
  parseVersion,
} from './semver';

describe('parseVersion', () => {
  it('解析标准三段版本并容忍前导 v 与空白', () => {
    expect(parseVersion('1.2.3')).toEqual({
      major: 1,
      minor: 2,
      patch: 3,
      prerelease: [],
      build: [],
      version: '1.2.3',
    });
    expect(parseVersion('  v2.0.0 \n')).toEqual({
      major: 2,
      minor: 0,
      patch: 0,
      prerelease: [],
      build: [],
      version: '2.0.0',
    });
  });

  it('解析预发布与构建元数据', () => {
    const parsed = parseVersion('1.0.0-alpha.1+build.5');
    expect(parsed?.prerelease).toEqual(['alpha', '1']);
    expect(parsed?.build).toEqual(['build', '5']);
    expect(parsed?.version).toBe('1.0.0-alpha.1');
  });

  it('拒绝非法版本', () => {
    expect(parseVersion('01.0.0')).toBeNull();
    expect(parseVersion('1.0')).toBeNull();
    expect(parseVersion('1.0.0.0')).toBeNull();
    expect(parseVersion('')).toBeNull();
    expect(isValidVersion('1.0.0-alpha.1')).toBe(true);
    expect(isValidVersion('1.0')).toBe(false);
  });
});

describe('compareVersions', () => {
  it('按主次修订号逐级比较', () => {
    expect(compareVersions('2.0.0', '1.9.9')).toBe(CompareResultEnum.GREATER);
    expect(compareVersions('1.2.3', '1.2.4')).toBe(CompareResultEnum.LESS);
    expect(compareVersions('1.2.3', '1.2.3')).toBe(CompareResultEnum.EQUAL);
  });

  it('预发布版本优先级低于正式版本', () => {
    expect(compareVersions('1.0.0-alpha', '1.0.0')).toBe(CompareResultEnum.LESS);
    expect(
      compareVersions('1.0.0-alpha.1', '1.0.0-alpha.2'),
    ).toBe(CompareResultEnum.LESS);
  });

  it('任一版本非法时返回 null', () => {
    expect(compareVersions('1.0', '1.0.0')).toBeNull();
  });

  it('compareParsed 与字符串比较结果一致', () => {
    const a = parseVersion('1.2.3');
    const b = parseVersion('1.2.4');
    expect(a && b && compareParsed(a, b)).toBeLessThan(0);
  });
});

describe('checkRange', () => {
  it('^ 范围命中同一主版本的更高版本', () => {
    expect(checkRange('1.9.9', '^1.2.3').matched).toBe(true);
    expect(checkRange('1.2.2', '^1.2.3').matched).toBe(false);
    expect(checkRange('2.0.0', '^1.2.3').matched).toBe(false);
  });

  it('^ 对 0.x 版本按次版本收紧范围', () => {
    expect(checkRange('0.2.9', '^0.2.3').matched).toBe(true);
    expect(checkRange('0.3.0', '^0.2.3').matched).toBe(false);
    expect(checkRange('0.0.3', '^0.0.3').matched).toBe(true);
    expect(checkRange('0.0.4', '^0.0.3').matched).toBe(false);
  });

  it('~ 范围仅允许修订号递增', () => {
    expect(checkRange('1.2.9', '~1.2.3').matched).toBe(true);
    expect(checkRange('1.3.0', '~1.2.3').matched).toBe(false);
  });

  it('比较符组合（空格表示与）', () => {
    expect(checkRange('1.5.0', '>=1.0.0 <2.0.0').matched).toBe(true);
    expect(checkRange('2.0.0', '>=1.0.0 <2.0.0').matched).toBe(false);
  });

  it('x 通配与精确匹配', () => {
    expect(checkRange('1.4.2', '1.x').matched).toBe(true);
    expect(checkRange('2.0.0', '1.x').matched).toBe(false);
    expect(checkRange('1.2.3', '1.2.3').matched).toBe(true);
    expect(checkRange('1.2.4', '1.2.3').matched).toBe(false);
  });

  it('连字符区间', () => {
    expect(checkRange('1.5.0', '1.2.3 - 2.0.0').matched).toBe(true);
    expect(checkRange('2.0.0', '1.2.3 - 2.0.0').matched).toBe(true);
    expect(checkRange('2.0.1', '1.2.3 - 2.0.0').matched).toBe(false);
  });

  it('或组合', () => {
    expect(checkRange('2.1.0', '1.x || >=2.0.0').matched).toBe(true);
    expect(checkRange('3.0.0', '1.x || >=2.0.0').matched).toBe(true);
    expect(checkRange('0.9.0', '1.x || >=2.0.0').matched).toBe(false);
  });

  it('不含预发布的普通范围不命中预发布版本', () => {
    expect(checkRange('1.3.0-alpha', '^1.2.3').matched).toBe(false);
  });

  it('版本或范围非法时返回错误', () => {
    expect(checkRange('1.0', '^1.0.0').error).toContain('版本号无效');
    expect(checkRange('1.0.0', '>=1.0.0 ||').error).toContain('范围表达式无效');
  });
});
