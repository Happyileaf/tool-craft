import { describe, it, expect } from 'vitest';
import { convertAll, convertCase, splitWords } from './case';
import { CASE_STYLE_ORDER, CaseStyleEnum } from '../constants';

describe('splitWords', () => {
  it('按非字母数字字符切分', () => {
    expect(splitWords('hello world')).toEqual(['hello', 'world']);
    expect(splitWords('hello-world_test.dot')).toEqual(['hello', 'world', 'test', 'dot']);
  });

  it('在 camelCase / PascalCase 边界处切分', () => {
    expect(splitWords('helloWorld')).toEqual(['hello', 'World']);
    expect(splitWords('HelloWorld')).toEqual(['Hello', 'World']);
  });

  it('连续大写缩写保持在一起并与后随词切分', () => {
    expect(splitWords('HTTPResponse')).toEqual(['HTTP', 'Response']);
    expect(splitWords('getUserID')).toEqual(['get', 'User', 'ID']);
  });

  it('仅含分隔符时返回空数组', () => {
    expect(splitWords('')).toEqual([]);
    expect(splitWords('  --__..  ')).toEqual([]);
  });
});

describe('convertCase', () => {
  it('将 hello world 转换为常见命名风格', () => {
    expect(convertCase('hello world', CaseStyleEnum.CAMEL)).toBe('helloWorld');
    expect(convertCase('hello world', CaseStyleEnum.PASCAL)).toBe('HelloWorld');
    expect(convertCase('hello world', CaseStyleEnum.SNAKE)).toBe('hello_world');
    expect(convertCase('hello world', CaseStyleEnum.KEBAB)).toBe('hello-world');
    expect(convertCase('hello world', CaseStyleEnum.SCREAMING_SNAKE)).toBe('HELLO_WORLD');
    expect(convertCase('hello world', CaseStyleEnum.TITLE)).toBe('Hello World');
  });

  it('把既有 camelCase / PascalCase 输入正确拆分后再转换', () => {
    expect(convertCase('getUserID', CaseStyleEnum.SNAKE)).toBe('get_user_id');
    expect(convertCase('HTTPResponse', CaseStyleEnum.SNAKE)).toBe('http_response');
  });

  it('sentence case 仅首词首字母大写、其余词小写', () => {
    expect(convertCase('hello world', CaseStyleEnum.SENTENCE)).toBe('Hello world');
    expect(convertCase('HELLO WORLD', CaseStyleEnum.SENTENCE)).toBe('Hello world');
  });

  it('dot / lower / upper 风格', () => {
    expect(convertCase('hello world', CaseStyleEnum.DOT)).toBe('hello.world');
    expect(convertCase('Hello World', CaseStyleEnum.LOWER)).toBe('hello world');
    expect(convertCase('hello world', CaseStyleEnum.UPPER)).toBe('HELLO WORLD');
  });

  it('空输入对所有风格均返回空串', () => {
    CASE_STYLE_ORDER.forEach((style) => {
      expect(convertCase('', style)).toBe('');
    });
    expect(convertCase('   ---___...  ', CaseStyleEnum.SNAKE)).toBe('');
  });
});

describe('convertAll', () => {
  it('返回全部风格键', () => {
    const result = convertAll('hello world');
    expect(Object.keys(result).sort()).toEqual([...CASE_STYLE_ORDER].sort());
  });

  it('包含各风格的预期结果', () => {
    const result = convertAll('hello world');
    expect(result[CaseStyleEnum.CAMEL]).toBe('helloWorld');
    expect(result[CaseStyleEnum.SNAKE]).toBe('hello_world');
    expect(result[CaseStyleEnum.SCREAMING_SNAKE]).toBe('HELLO_WORLD');
  });
});
