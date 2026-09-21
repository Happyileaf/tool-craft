import { describe, expect, it } from 'vitest';
import { DEFAULT_PATTERN } from '../constants';
import { matchRegex, replaceWithRegex } from './regex-match';

describe('matchRegex', () => {
  it('全局模式返回全部命中与捕获组', () => {
    const result = matchRegex(
      DEFAULT_PATTERN,
      'gi',
      'a@x.com 与 b@y.org',
    );
    expect(result.success).toBe(true);
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0]?.groups[0]).toBe('a');
    expect(result.matches[0]?.index).toBe(0);
  });

  it('非全局模式仅返回首个命中', () => {
    const result = matchRegex('\\d+', '', 'a1 b2');
    expect(result.matches).toHaveLength(1);
    expect(result.matches[0]?.match).toBe('1');
  });

  it('空表达式返回空结果', () => {
    const result = matchRegex('   ', 'g', 'abc');
    expect(result.matches).toHaveLength(0);
  });

  it('零宽匹配不会造成死循环', () => {
    const result = matchRegex('a*', 'g', 'aaa');
    expect(result.success).toBe(true);
    expect(result.matches.length).toBeGreaterThan(0);
  });

  it('非法正则返回语法错误', () => {
    const result = matchRegex('[', 'g', 'abc');
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeTruthy();
  });
});

describe('replaceWithRegex', () => {
  it('全局替换全部命中', () => {
    const result = replaceWithRegex('a1 a2', '\\d', 'g', '#');
    expect(result.output).toBe('a# a#');
  });

  it('支持捕获组引用', () => {
    const result = replaceWithRegex(
      'john@x.com',
      '([a-z]+)@([a-z.]+)',
      '',
      '$2/$1',
    );
    expect(result.output).toBe('x.com/john');
  });
});
