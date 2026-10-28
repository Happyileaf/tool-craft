import { describe, expect, it } from 'vitest';
import {
  buildMailto,
  createEmptyMailtoData,
  decodeMailtoValue,
  encodeMailtoValue,
  parseMailto,
  splitRecipients,
  validateMailto,
} from './mailto';

describe('encodeMailtoValue', () => {
  it('空格编码为 %20，换行规范化为 %0D%0A，UTF-8 字符按字节编码', () => {
    expect(encodeMailtoValue('Hello World')).toBe('Hello%20World');
    expect(encodeMailtoValue('a\nb')).toBe('a%0D%0Ab');
    expect(encodeMailtoValue('a\r\nb')).toBe('a%0D%0Ab');
    expect(encodeMailtoValue('你好')).toBe('%E4%BD%A0%E5%A5%BD');
  });

  it('encodeAt 控制 @ 是否编码为 %40', () => {
    expect(encodeMailtoValue('b@x.com', false)).toBe('b@x.com');
    expect(encodeMailtoValue('b@x.com', true)).toBe('b%40x.com');
  });
});

describe('decodeMailtoValue', () => {
  it('百分号解码并还原 UTF-8 与换行', () => {
    expect(decodeMailtoValue('Hello%20World')).toBe('Hello World');
    expect(decodeMailtoValue('b%40x.com')).toBe('b@x.com');
    expect(decodeMailtoValue('%E4%BD%A0%E5%A5%BD')).toBe('你好');
    expect(decodeMailtoValue('line1%0D%0Aline2')).toBe('line1\r\nline2');
  });
});

describe('splitRecipients', () => {
  it('支持逗号、分号、中文标点与换行分隔并去除空白', () => {
    expect(splitRecipients('a@x.com, b@x.com；c@x.com')).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
    expect(splitRecipients(' a@x.com\n\nb@x.com ')).toEqual(['a@x.com', 'b@x.com']);
    expect(splitRecipients('  ')).toEqual([]);
  });
});

describe('buildMailto', () => {
  it('生成完整 RFC 6068 链接，cc 中 @ 编码为 %40', () => {
    const link = buildMailto({
      to: 'a@x.com',
      cc: 'b@x.com',
      bcc: '',
      subject: 'Hello World',
      body: '第一行\n第二行',
    });
    expect(link).toBe(
      'mailto:a@x.com?cc=b%40x.com&subject=Hello%20World&body=%E7%AC%AC%E4%B8%80%E8%A1%8C%0D%0A%E7%AC%AC%E4%BA%8C%E8%A1%8C',
    );
  });

  it('多收件人逗号连接，空字段省略，仅有主题时允许无收件人', () => {
    expect(
      buildMailto({ to: 'a@x.com,b@x.com', cc: '', bcc: '', subject: '', body: '' }),
    ).toBe('mailto:a@x.com,b@x.com');
    expect(buildMailto({ ...createEmptyMailtoData(), subject: 'S' })).toBe('mailto:?subject=S');
  });
});

describe('parseMailto', () => {
  it('反向解析回填全部字段', () => {
    const link =
      'mailto:a@x.com?cc=b%40x.com&bcc=c%40x.com&subject=Hello%20World&body=line1%0D%0Aline2';
    const result = parseMailto(link);
    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      to: 'a@x.com',
      cc: 'b@x.com',
      bcc: 'c@x.com',
      subject: 'Hello World',
      body: 'line1\r\nline2',
    });
  });

  it('生成 → 解析往返一致', () => {
    const original = {
      to: 'a@x.com, b@x.com',
      cc: 'c@x.com',
      bcc: 'd@x.com',
      subject: '报价 @ 2026',
      body: '你好，\n请查收附件。',
    };
    const { data, error } = parseMailto(buildMailto(original));
    expect(error).toBeNull();
    expect(data.to).toBe('a@x.com,b@x.com');
    expect(data.cc).toBe('c@x.com');
    expect(data.bcc).toBe('d@x.com');
    expect(data.subject).toBe(original.subject);
    expect(data.body).toBe('你好，\r\n请查收附件。');
  });

  it('非 mailto 链接报错', () => {
    expect(parseMailto('https://example.com').error).toBe('链接必须以 mailto: 开头');
  });
});

describe('validateMailto', () => {
  it('无收件人通过，非法邮箱报错', () => {
    expect(validateMailto(createEmptyMailtoData())).toBeNull();
    expect(
      validateMailto({ ...createEmptyMailtoData(), to: 'a@x.com' }),
    ).toBeNull();
    const invalid = validateMailto({ ...createEmptyMailtoData(), cc: 'not-an-email' });
    expect(invalid).toBe('抄送地址「not-an-email」格式不正确');
  });
});
