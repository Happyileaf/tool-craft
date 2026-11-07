import { describe, it, expect } from 'vitest';
import { cleanPhone, e164ToE123, formatBatch, formatE123, groupDigits, toE164 } from './e123';

describe('cleanPhone 清洗与非法字符', () => {
  it('剥离空格、连字符、括号、点、斜杠', () => {
    const cleaned = cleanPhone('+86 (138) 0013-8000.12');
    expect(cleaned.digits).toBe('861380013800012');
    expect(cleaned.isInternational).toBe(true);
    expect(cleaned.invalidChars).toEqual([]);
  });

  it('识别 00 国际前缀并收集非法字符', () => {
    const cleaned = cleanPhone('00 1 555 abc!');
    expect(cleaned.isInternational).toBe(true);
    expect(cleaned.digits).toBe('1555');
    expect(cleaned.invalidChars).toContain('a');
    expect(cleaned.invalidChars).toContain('!');
  });

  it('本地号码不标记为国际', () => {
    expect(cleanPhone('(042) 123 4567').isInternational).toBe(false);
  });
});

describe('groupDigits 分组', () => {
  it('按 3-3-4 切分 11 位', () => {
    expect(groupDigits('13800138000', [3, 3, 4])).toEqual(['138', '001', '38000']);
  });

  it('不足一组时整体保留', () => {
    expect(groupDigits('12', [3, 3, 4])).toEqual(['12']);
    expect(groupDigits('12345', [3, 3, 4])).toEqual(['123', '45']);
  });
});

describe('formatE123 国际号码', () => {
  it('中国 +86 空格分组（E.123 推荐）', () => {
    expect(formatE123('+8613800138000')).toBe('+86 138 001 38000');
  });

  it('美国 +1 与点号分隔', () => {
    expect(formatE123('+1 555 123 4567', { separator: 'dot' })).toBe('+1.555.123.4567');
  });

  it('连字符分隔与显式国家码长度', () => {
    expect(formatE123('+85291234567', { separator: 'hyphen', countryCodeLength: 3 })).toBe(
      '+852-912-345-67',
    );
  });

  it('00 前缀等价于 +', () => {
    expect(formatE123('0015551234567')).toBe('+1 555 123 4567');
  });
});

describe('formatE123 本地号码', () => {
  it('默认 3-3-4 空格分组', () => {
    expect(formatE123('13800138000')).toBe('138 001 38000');
  });

  it('括号长途区号风格', () => {
    expect(formatE123('0421234567', { localParentheses: true })).toBe('(042) 123 4567');
  });

  it('点号分隔的本地号码', () => {
    expect(formatE123('5551234567', { separator: 'dot' })).toBe('555.123.4567');
  });
});

describe('E.164 双向互转', () => {
  it('可读形式转 E.164 无分隔', () => {
    expect(toE164('+86 138 001 38000')).toBe('+8613800138000');
    expect(toE164('+1 (555) 123-4567')).toBe('+15551234567');
  });

  it('本地号码转纯数字（不臆造国家码）', () => {
    expect(toE164('(042) 123 4567')).toBe('0421234567');
  });

  it('E.164 → E.123 语义别名', () => {
    expect(e164ToE123('+8613800138000')).toBe('+86 138 001 38000');
  });

  it('E.123 → E.164 → E.123 往返一致', () => {
    const sample = '+86 138 001 38000';
    expect(e164ToE123(toE164(sample))).toBe(sample);
  });
});

describe('错误处理与批量', () => {
  it('空号码抛错', () => {
    expect(() => formatE123('   ')).toThrow('为空');
    expect(() => toE164('-')).toThrow('为空');
  });

  it('非法字符抛错并列出字符', () => {
    expect(() => formatE123('+86 138 abcd')).toThrow('非法字符');
  });

  it('非法国家码长度抛错', () => {
    expect(() => formatE123('+86138', { countryCodeLength: 4 })).toThrow('国家码长度');
  });

  it('批量逐行处理并标记行号', () => {
    const result = formatBatch('+8613800138000\n\nbad line!\n5551234567');
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ line: 1, output: '+86 138 001 38000', error: null });
    expect(result[1]!.error).toContain('非法字符');
    expect(result[2]!.output).toBe('555 123 4567');
  });
});
