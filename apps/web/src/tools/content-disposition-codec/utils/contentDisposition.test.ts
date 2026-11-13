import { describe, expect, it } from 'vitest';

import {
  buildContentDisposition,
  decodeExtValue,
  encodeExtValue,
  parseContentDisposition,
} from './contentDisposition';

describe('parseContentDisposition', () => {
  it('parses a simple attachment with a quoted ASCII filename', () => {
    const result = parseContentDisposition('attachment; filename="report.pdf"');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('attachment');
    expect(result.filename).toBe('report.pdf');
    expect(result.filenameSource).toBe('filename');
  });

  it('parses an RFC 8187 ext-value filename and percent-decodes UTF-8', () => {
    const header = "attachment; filename*=UTF-8''%E6%8A%A5%E5%91%8A.pdf";
    const result = parseContentDisposition(header);
    expect(result.ok).toBe(true);
    expect(result.filename).toBe('报告.pdf');
    expect(result.filenameSource).toBe('filename*');
  });

  it('prefers filename* over filename per RFC 6266 §4.2', () => {
    const header =
      "attachment; filename=\"fallback.pdf\"; filename*=UTF-8''%E6%8A%A5%E5%91%8A.pdf";
    const result = parseContentDisposition(header);
    expect(result.ok).toBe(true);
    expect(result.filename).toBe('报告.pdf');
    expect(result.filenameSource).toBe('filename*');
  });

  it('handles inline disposition and multiple parameters', () => {
    const result = parseContentDisposition('inline; size=1234; name="doc"');
    expect(result.ok).toBe(true);
    expect(result.type).toBe('inline');
    expect(result.params).toHaveLength(2);
  });

  it('falls back to filename when no ext-value is present', () => {
    const result = parseContentDisposition('attachment; filename=data.zip');
    expect(result.filename).toBe('data.zip');
    expect(result.filenameSource).toBe('filename');
  });

  it('reports none when there is no filename parameter', () => {
    const result = parseContentDisposition('attachment');
    expect(result.ok).toBe(true);
    expect(result.filenameSource).toBe('none');
    expect(result.filename).toBeUndefined();
  });

  it('rejects a malformed ext-value missing the two single quotes', () => {
    const result = parseContentDisposition("attachment; filename*=UTF-8report.pdf");
    expect(result.ok).toBe(false);
    expect(result.error).toContain("charset'language'");
  });

  it('rejects an unterminated quoted string', () => {
    const result = parseContentDisposition('attachment; filename="oops');
    expect(result.ok).toBe(false);
    expect(result.error).toContain('引号');
  });

  it('rejects an empty / type-less header', () => {
    expect(parseContentDisposition('').ok).toBe(false);
  });
});

describe('decodeExtValue', () => {
  it('decodes UTF-8 percent-encoded value and exposes charset/language', () => {
    const decoded = decodeExtValue("UTF-8'zh'%E6%8A%A5%E5%91%8A");
    expect(decoded.value).toBe('报告');
    expect(decoded.charset).toBe('utf-8');
    expect(decoded.language).toBe('zh');
  });

  it('rejects an unsupported charset', () => {
    expect(() => decodeExtValue("utf-16''%00A")).toThrow('字符集');
  });
});

describe('encodeExtValue and buildContentDisposition', () => {
  it('percent-encodes a Chinese filename to uppercase UTF-8 bytes', () => {
    expect(encodeExtValue('报告.pdf')).toBe("UTF-8''%E6%8A%A5%E5%91%8A.pdf");
  });

  it('builds a header with both ASCII fallback and ext-value, and round-trips', () => {
    const header = buildContentDisposition({ type: 'attachment', filename: '报告.pdf' });
    expect(header).toContain('filename=');
    expect(header).toContain("filename*=UTF-8''%E6%8A%A5%E5%91%8A.pdf");
    const parsed = parseContentDisposition(header);
    expect(parsed.ok).toBe(true);
    expect(parsed.filename).toBe('报告.pdf');
  });

  it('quotes the ASCII fallback when it contains spaces', () => {
    const header = buildContentDisposition({ type: 'inline', filename: 'my report.pdf' });
    expect(header).toContain('filename="my report.pdf"');
    expect(header.startsWith('inline;')).toBe(true);
  });

  it('replaces non-ASCII characters in the ASCII fallback', () => {
    const header = buildContentDisposition({ type: 'attachment', filename: '报告 final.pdf' });
    expect(header).toContain('filename="__ final.pdf"');
  });

  it('leaves ASCII-only filenames readable in the fallback', () => {
    const header = buildContentDisposition({ type: 'attachment', filename: 'data.zip' });
    expect(header).toContain('filename=data.zip');
  });
});
