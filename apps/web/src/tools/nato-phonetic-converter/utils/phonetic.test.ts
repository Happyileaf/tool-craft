import { describe, expect, it } from 'vitest';
import {
  buildSpellGroups,
  decodePhonetic,
  encodePhonetic,
  NATO_TABLE,
} from './phonetic';

describe('NATO_TABLE', () => {
  it('包含 26 个字母与 10 个数字共 36 项', () => {
    expect(Object.keys(NATO_TABLE)).toHaveLength(36);
    expect(NATO_TABLE.A).toBe('Alfa');
    expect(NATO_TABLE.Z).toBe('Zulu');
    expect(NATO_TABLE['9']).toBe('Niner');
  });
});

describe('encodePhonetic', () => {
  it('把小写字母拼写为对应音标单词', () => {
    expect(encodePhonetic('abc')).toEqual({
      output: 'Alfa Bravo Charlie',
      error: null,
    });
  });

  it('大小写不敏感', () => {
    expect(encodePhonetic('SOS').output).toBe('Sierra Oscar Sierra');
    expect(encodePhonetic('sos').output).toBe('Sierra Oscar Sierra');
  });

  it('以斜杠分隔不同源单词', () => {
    expect(encodePhonetic('TRAE 42').output).toBe(
      'Tango Romeo Alfa Echo / Four Two',
    );
  });

  it('折叠连续空白并忽略首尾空白', () => {
    expect(encodePhonetic('  ab   cd ').output).toBe(
      'Alfa Bravo / Charlie Delta',
    );
  });

  it('覆盖全部 26 个字母', () => {
    const result = encodePhonetic('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    expect(result.error).toBeNull();
    expect(result.output?.split(' ')).toHaveLength(26);
    expect(result.output).toContain('X-ray');
    expect(result.output).toContain('Juliett');
  });

  it('覆盖全部数字，9 使用 Niner', () => {
    const result = encodePhonetic('0123456789');
    expect(result.output).toBe(
      'Zero One Two Three Four Five Six Seven Eight Niner',
    );
  });

  it('空字符串返回空输出', () => {
    expect(encodePhonetic('')).toEqual({ output: '', error: null });
    expect(encodePhonetic('   ')).toEqual({ output: '', error: null });
  });

  it('字母数字以外的字符返回错误', () => {
    expect(encodePhonetic('ab!').output).toBeNull();
    expect(encodePhonetic('ab!').error).toContain('!');
    expect(encodePhonetic('A-B').error).toContain('-');
    expect(encodePhonetic('你好').error).toContain('无法拼写');
  });
});

describe('buildSpellGroups', () => {
  it('按单词分组并逐字符给出拼写单元', () => {
    const groups = buildSpellGroups('A9 BC');
    expect(groups).not.toBeInstanceOf(Error);
    const list = groups as Exclude<ReturnType<typeof buildSpellGroups>, Error>;
    expect(list).toHaveLength(2);
    expect(list[0]?.source).toBe('A9');
    expect(list[0]?.tokens).toEqual([
      { char: 'A', word: 'Alfa' },
      { char: '9', word: 'Niner' },
    ]);
    expect(list[1]?.source).toBe('BC');
    expect(list[1]?.tokens[1]).toEqual({ char: 'C', word: 'Charlie' });
  });

  it('空输入得到空数组', () => {
    expect(buildSpellGroups('  ')).toEqual([]);
  });

  it('遇到非法字符返回 Error', () => {
    expect(buildSpellGroups('A.B')).toBeInstanceOf(Error);
  });
});

describe('decodePhonetic', () => {
  it('把音标串还原为大写文本', () => {
    expect(decodePhonetic('Alfa Bravo Charlie')).toEqual({
      output: 'ABC',
      error: null,
    });
  });

  it('以斜杠或多段空白还原单词边界', () => {
    expect(decodePhonetic('Tango Romeo Alfa Echo / Four Two').output).toBe(
      'TRAE 42',
    );
  });

  it('忽略音标单词大小写', () => {
    expect(decodePhonetic('tango ROMEO alfa').output).toBe('TRA');
  });

  it('兼容 Alpha / Juliet / Nine 常见异写', () => {
    expect(decodePhonetic('Alpha Juliet Nine').output).toBe('AJ9');
  });

  it('支持带连字符的 X-ray', () => {
    expect(decodePhonetic('x-ray').output).toBe('X');
  });

  it('无法识别的单词返回错误', () => {
    const result = decodePhonetic('Alfa Bravo Foo');
    expect(result.output).toBeNull();
    expect(result.error).toContain('Foo');
  });

  it('包含非法字符返回错误', () => {
    const result = decodePhonetic('Alfa Bravo!');
    expect(result.output).toBeNull();
    expect(result.error).toContain('音标串');
  });

  it('空输入返回空输出', () => {
    expect(decodePhonetic('')).toEqual({ output: '', error: null });
    expect(decodePhonetic('  ')).toEqual({ output: '', error: null });
  });

  it('与编码互逆（含数字与多个单词）', () => {
    const original = 'HELLO WORLD 2026';
    const encoded = encodePhonetic(original).output ?? '';
    expect(decodePhonetic(encoded).output).toBe(original);
  });
});
