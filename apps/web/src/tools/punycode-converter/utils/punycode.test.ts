import { describe, it, expect } from 'vitest';
import {
  punycodeEncode,
  punycodeDecode,
  convertDomain,
  convertDomainLines,
  convertRaw,
} from './punycode';

describe('punycodeEncode - RFC 3492 官方向量', () => {
  it('编码含非 ASCII 字符的单词', () => {
    expect(punycodeEncode('münchen')).toBe('mnchen-3ya');
    expect(punycodeEncode('München')).toBe('Mnchen-3ya');
  });

  it('编码简体中文短语', () => {
    expect(punycodeEncode('他们为什么不说中文')).toBe(
      'ihqwcrb4cv8a8dqg056pqjye',
    );
  });

  it('编码繁体中文短语', () => {
    expect(punycodeEncode('他們爲什麽不說中文')).toBe(
      'ihqwctvzc91f659drss3x8bo0yb',
    );
  });

  it('编码日文假名', () => {
    expect(punycodeEncode('ドメイン')).toBe('eckwd4c7c');
  });

  it('编码西里尔字母与中文混合', () => {
    expect(punycodeEncode('ли他们为什么不说中文')).toBe(
      'h1af9087cxdapc7dt5b8exhz93tul6e',
    );
  });

  it('纯 ASCII 输入编码为自身加分隔符', () => {
    expect(punycodeEncode('3-2')).toBe('3-2-');
    expect(punycodeEncode('Majstrom')).toBe('Majstrom-');
  });
});

describe('punycodeDecode - RFC 3492 官方向量', () => {
  it('解码为含非 ASCII 字符的单词', () => {
    expect(punycodeDecode('mnchen-3ya')).toBe('münchen');
    expect(punycodeDecode('Mnchen-3ya')).toBe('München');
  });

  it('解码简体中文短语', () => {
    expect(punycodeDecode('ihqwcrb4cv8a8dqg056pqjye')).toBe(
      '他们为什么不说中文',
    );
  });

  it('解码繁体中文短语', () => {
    expect(punycodeDecode('ihqwctvzc91f659drss3x8bo0yb')).toBe(
      '他們爲什麽不說中文',
    );
  });

  it('编解码往返一致', () => {
    const samples = [
      'münchen',
      '他们为什么不说中文',
      '他們爲什麽不說中文',
      'ドメイン名',
      'ли they 混合 🎉',
      'café.résumé',
    ];
    for (const sample of samples) {
      expect(punycodeDecode(punycodeEncode(sample))).toBe(sample);
    }
  });

  it('非法输入抛出可读错误', () => {
    expect(() => punycodeDecode('xn--!invalid')).toThrow();
    expect(() => punycodeDecode('a-')).not.toThrow();
  });
});

describe('convertDomain - IDNA 域名转换', () => {
  it('Unicode 域名转 ASCII（ACE）', () => {
    expect(convertDomain('中文.中国', 'toAscii')).toBe('xn--fiq228c.xn--fiqs8s');
    expect(convertDomain('münchen.de', 'toAscii')).toBe('xn--mnchen-3ya.de');
    expect(convertDomain('例え.jp', 'toAscii')).toBe('xn--r8jz45g.jp');
  });

  it('纯 ASCII 域名保持不变', () => {
    expect(convertDomain('example.com', 'toAscii')).toBe('example.com');
    expect(convertDomain('sub.example.co.uk', 'toAscii')).toBe(
      'sub.example.co.uk',
    );
  });

  it('ACE 域名转回 Unicode', () => {
    expect(convertDomain('xn--fiq228c.xn--fiqs8s', 'toUnicode')).toBe(
      '中文.中国',
    );
    expect(convertDomain('xn--mnchen-3ya.de', 'toUnicode')).toBe('münchen.de');
  });

  it('兼容全角点作为输入分隔符，输出统一使用 ASCII 点', () => {
    expect(convertDomain('中文。中国', 'toAscii')).toBe('xn--fiq228c.xn--fiqs8s');
    expect(convertDomain('münchen．de', 'toAscii')).toBe('xn--mnchen-3ya.de');
  });

  it('仅转换邮箱 @ 之后的域名部分', () => {
    expect(convertDomain('info@münchen.de', 'toAscii')).toBe(
      'info@xn--mnchen-3ya.de',
    );
    expect(convertDomain('test@中文.中国', 'toAscii')).toBe(
      'test@xn--fiq228c.xn--fiqs8s',
    );
  });

  it('单标签主机名同样可转换', () => {
    expect(convertDomain('münchen', 'toAscii')).toBe('xn--mnchen-3ya');
    expect(convertDomain('xn--mnchen-3ya', 'toUnicode')).toBe('münchen');
  });

  it('非法 xn-- 标签抛出错误而非异常逃逸到 UI', () => {
    expect(() => convertDomain('xn--zzz999zzz.invalid', 'toAscii')).toThrow();
    expect(() => convertDomain('a..b.com', 'toAscii')).toThrow(/空/);
    expect(() => convertDomain('', 'toAscii')).toThrow(/空/);
  });
});

describe('convertDomainLines - 多行批量', () => {
  it('逐行转换并以换行连接', () => {
    const result = convertDomainLines('münchen.de\n中文.中国', 'toAscii');
    expect(result.error).toBeNull();
    expect(result.output).toBe('xn--mnchen-3ya.de\nxn--fiq228c.xn--fiqs8s');
    expect(result.warnings).toEqual([]);
  });

  it('单行出错不影响其他行，错误进入 warnings', () => {
    const result = convertDomainLines(
      'münchen.de\nxn--zzz999zzz.invalid\nexample.com',
      'toAscii',
    );
    expect(result.output).toBe(
      'xn--mnchen-3ya.de\nxn--zzz999zzz.invalid\nexample.com',
    );
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain('第 2 行');
  });

  it('保留空行', () => {
    const result = convertDomainLines('example.com\n\nexample.org', 'toAscii');
    expect(result.output).toBe('example.com\n\nexample.org');
  });
});

describe('convertRaw - 裸 bootstring', () => {
  it('整段文本编解码', () => {
    expect(convertRaw('他们为什么不说中文', 'toAscii')).toEqual({
      output: 'ihqwcrb4cv8a8dqg056pqjye',
      warnings: [],
      error: null,
    });
    expect(convertRaw('ihqwcrb4cv8a8dqg056pqjye', 'toUnicode')).toEqual({
      output: '他们为什么不说中文',
      warnings: [],
      error: null,
    });
  });

  it('空输入返回空结果', () => {
    expect(convertRaw('   ', 'toAscii').output).toBe('');
  });

  it('解码错误以 error 字段返回而非抛出', () => {
    const result = convertRaw('!!!not-punycode!!!', 'toUnicode');
    expect(result.error).not.toBeNull();
    expect(result.output).toBe('');
  });
});
