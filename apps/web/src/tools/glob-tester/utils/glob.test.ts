import { describe, expect, it } from 'vitest';
import {
  globToRegExp,
  globToRegExpLiteral,
  matchGlob,
  matchPaths,
} from './glob';

describe('globToRegExp 基础语法', () => {
  it('* 不跨越路径分隔符 /', () => {
    expect(matchGlob('*.ts', 'index.ts')).toBe(true);
    expect(matchGlob('*.ts', 'src/index.ts')).toBe(false);
    expect(matchGlob('a*b', 'axxxb')).toBe(true);
    expect(matchGlob('a*b', 'a/b')).toBe(false);
  });

  it('? 匹配单个字符且不匹配 /', () => {
    expect(matchGlob('a?c', 'abc')).toBe(true);
    expect(matchGlob('a?c', 'ac')).toBe(false);
    expect(matchGlob('a?c', 'a/c')).toBe(false);
  });

  it('正则元字符被转义，按字面量匹配', () => {
    expect(matchGlob('a.b.c', 'a.b.c')).toBe(true);
    expect(matchGlob('a.b.c', 'axbxc')).toBe(false);
    expect(matchGlob('a+b$c', 'a+b$c')).toBe(true);
    expect(matchGlob('(test)', '(test)')).toBe(true);
    expect(matchGlob('(test)', 'xtestx')).toBe(false);
  });
});

describe('globToRegExp ** 跨段匹配', () => {
  it('** 匹配任意深度路径段', () => {
    expect(matchGlob('src/**/*.ts', 'src/index.ts')).toBe(true);
    expect(matchGlob('src/**/*.ts', 'src/a/b/c.ts')).toBe(true);
    expect(matchGlob('src/**/*.ts', 'lib/a.ts')).toBe(false);
    expect(matchGlob('src/**/*.ts', 'src/a.js')).toBe(false);
  });

  it('开头的 **/ 可匹配零段', () => {
    expect(matchGlob('**/foo', 'foo')).toBe(true);
    expect(matchGlob('**/foo', 'a/foo')).toBe(true);
    expect(matchGlob('**/foo', 'a/b/foo')).toBe(true);
    expect(matchGlob('**/foo', 'foobar')).toBe(false);
  });

  it('结尾的 /** 匹配该目录下任意层级', () => {
    expect(matchGlob('a/**', 'a/b')).toBe(true);
    expect(matchGlob('a/**', 'a/b/c/d')).toBe(true);
    expect(matchGlob('a/**', 'ab/c')).toBe(false);
  });

  it('非段边界的 ** 退化为跨字符匹配', () => {
    expect(matchGlob('a**b', 'axxxb')).toBe(true);
    expect(matchGlob('a**b', 'a/x/b')).toBe(true);
  });
});

describe('globToRegExp 花括号组', () => {
  it('{a,b} 展开为分支', () => {
    expect(matchGlob('*.{ts,tsx}', 'index.ts')).toBe(true);
    expect(matchGlob('*.{ts,tsx}', 'index.tsx')).toBe(true);
    expect(matchGlob('*.{ts,tsx}', 'index.js')).toBe(false);
  });

  it('{a,b} 可出现在路径中间且支持嵌套', () => {
    expect(matchGlob('src/{a,b}/x.ts', 'src/a/x.ts')).toBe(true);
    expect(matchGlob('src/{a,b}/x.ts', 'src/c/x.ts')).toBe(false);
    expect(matchGlob('a{1,{2,3},4}b', 'a3b')).toBe(true);
    expect(matchGlob('a{1,{2,3},4}b', 'a5b')).toBe(false);
  });

  it('未闭合的 { 按字面量处理', () => {
    expect(matchGlob('a{b', 'a{b')).toBe(true);
  });
});

describe('globToRegExp 字符类', () => {
  it('[abc] 与 [a-z] 字符类', () => {
    expect(matchGlob('a[bc]d', 'abd')).toBe(true);
    expect(matchGlob('a[bc]d', 'aed')).toBe(false);
    expect(matchGlob('file[0-9].txt', 'file7.txt')).toBe(true);
    expect(matchGlob('file[0-9].txt', 'filea.txt')).toBe(false);
  });

  it('[!abc] 取反字符类', () => {
    expect(matchGlob('a[!bc]d', 'aed')).toBe(true);
    expect(matchGlob('a[!bc]d', 'abd')).toBe(false);
  });

  it('未闭合的 [ 按字面量处理', () => {
    expect(matchGlob('a[b', 'a[b')).toBe(true);
  });
});

describe('选项与辅助函数', () => {
  it('caseSensitive=false 时忽略大小写', () => {
    expect(matchGlob('*.TS', 'index.ts', { caseSensitive: false })).toBe(true);
    expect(matchGlob('*.TS', 'index.ts')).toBe(false);
  });

  it('globToRegExpLiteral 输出可用的正则字面量', () => {
    expect(globToRegExpLiteral('*.ts')).toBe('/^(?:[^/]*\\.ts)$/');
    const literal = globToRegExpLiteral('*.TS', { caseSensitive: false });
    expect(literal.endsWith('/i')).toBe(true);
    expect(matchGlob('src/**/*.{ts,tsx}', 'src/a/b.ts')).toBe(true);
  });

  it('matchPaths 批量返回每条路径的匹配结果', () => {
    const results = matchPaths('*.ts', ['a.ts', 'b.js', 'c.ts']);
    expect(results).toEqual([
      { path: 'a.ts', matched: true },
      { path: 'b.js', matched: false },
      { path: 'c.ts', matched: true },
    ]);
  });

  it('空模式只匹配空串', () => {
    expect(matchGlob('', '')).toBe(true);
    expect(globToRegExp('').test('a')).toBe(false);
  });
});
