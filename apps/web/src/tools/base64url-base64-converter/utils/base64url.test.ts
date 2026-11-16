import { describe, it, expect } from 'vitest';
import {
  base64UrlToStandard,
  standardToBase64Url,
  detectVariant,
  convertToken,
  convertLines,
  decodeForVerification,
} from './base64url';

describe('RFC 4648 §5 固定测试向量', () => {
  // RFC 4648 Section 10：标准 Base64 与 Base64URL 对照
  const vectors: Array<{ standard: string; base64url: string }> = [
    { standard: 'Zg==', base64url: 'Zg' },
    { standard: 'Zm8=', base64url: 'Zm8' },
    { standard: 'Zm9v', base64url: 'Zm9v' },
    { standard: 'Zm9vYg==', base64url: 'Zm9vYg' },
    { standard: 'Zm9vYmE=', base64url: 'Zm9vYmE' },
    { standard: 'Zm9vYmFy', base64url: 'Zm9vYmFy' },
  ];

  it('Base64URL → 标准 Base64（含自动补齐填充）', () => {
    for (const { standard, base64url } of vectors) {
      expect(base64UrlToStandard(base64url).output).toBe(standard);
      expect(base64UrlToStandard(base64url).error).toBeNull();
    }
  });

  it('标准 Base64 → Base64URL（去除填充、替换字母表）', () => {
    for (const { standard, base64url } of vectors) {
      expect(standardToBase64Url(standard).output).toBe(base64url);
      expect(standardToBase64Url(standard).error).toBeNull();
    }
  });

  it('双向转换互为逆运算', () => {
    for (const { base64url } of vectors) {
      const roundTrip = standardToBase64Url(base64UrlToStandard(base64url).output);
      expect(roundTrip.output).toBe(base64url);
    }
  });
});

describe('字符替换与 JWT 风格无填充令牌', () => {
  it('替换 - 和 _ 为 + 和 / 并补齐填充', () => {
    // 含 URL-safe 字符的合法 4 字节令牌：`-` → `+`，`_` → `/`，长度已为 4 的倍数无需补填充
    const result = base64UrlToStandard('a-b_');
    expect(result.output).toBe('a+b/');
    expect(result.detected).toBe('base64url');
  });

  it('标准字母表中的 + / 被替换为 - / _', () => {
    const result = standardToBase64Url('a+b/');
    expect(result.output).toBe('a-b_');
  });

  it('处理典型 JWT 片段（无填充、含 -_）', () => {
    const jwtSegment = 'eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0';
    const toStandard = base64UrlToStandard(jwtSegment);
    expect(toStandard.error).toBeNull();
    expect(toStandard.output.endsWith('=') || toStandard.output.length % 4 === 0).toBe(true);
    expect(standardToBase64Url(toStandard.output).output).toBe(jwtSegment);
  });
});

describe('变体识别', () => {
  it('含 - 或 _ 识别为 base64url', () => {
    expect(detectVariant('a-b_c')).toBe('base64url');
    expect(detectVariant('Zm9v')).not.toBe('base64url');
  });

  it('含 + / 或 = 识别为 standard，纯字母数字按 standard 处理', () => {
    expect(detectVariant('a+b/c=')).toBe('standard');
    expect(detectVariant('Zm9v')).toBe('standard');
  });
});

describe('convertToken 自动识别与规范化', () => {
  it('目标为 standard 时补齐填充', () => {
    expect(convertToken('Zg', 'standard').output).toBe('Zg==');
  });

  it('目标为 base64url 时去除填充', () => {
    expect(convertToken('Zg==', 'base64url').output).toBe('Zg');
  });

  it('空输入返回明确错误', () => {
    expect(convertToken('   ', 'standard').error).toMatch(/不能为空/);
  });
});

describe('非法字符定位', () => {
  it('Base64URL 中出现 + 或 = 时报错并给出位置', () => {
    const result = base64UrlToStandard('ab+cd');
    expect(result.error).toMatch(/非法 Base64URL/);
    expect(result.error).toMatch(/位置 3/);
    expect(result.errorOffset).toBe(2);
  });

  it('标准 Base64 中出现 - 时报错', () => {
    const result = standardToBase64Url('ab-cd');
    expect(result.error).toMatch(/非法标准 Base64/);
    expect(result.errorOffset).toBe(2);
  });

  it('长度为 1 的载荷非法', () => {
    expect(base64UrlToStandard('Z').error).not.toBeNull();
    expect(standardToBase64Url('Z').error).not.toBeNull();
  });

  it('填充不在末尾时报错', () => {
    expect(standardToBase64Url('Zg==Zg').error).not.toBeNull();
  });

  it('含填充但长度不是 4 的倍数时报错', () => {
    expect(standardToBase64Url('Zg=').error).not.toBeNull();
  });
});

describe('批量处理', () => {
  it('逐行转换并保留空行', () => {
    const result = convertLines('Zg\n\nZm8', 'standard');
    expect(result.output).toBe('Zg==\n\nZm8=');
    expect(result.warnings).toEqual([]);
  });

  it('非法行原样保留并逐行告警', () => {
    // `*` 不属于任何一种 Base64 字母表，第二行非法
    const result = convertLines('Zg\nab*cd', 'base64url');
    const lines = result.output.split('\n');
    expect(lines[0]).toBe('Zg');
    // 非法行不转换，原样保留
    expect(lines[1]).toBe('ab*cd');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/第 2 行/);
  });
});

describe('字节级解码验证', () => {
  it('RFC 向量解码字节数正确', () => {
    expect(decodeForVerification('Zm9v', 'standard').bytes).toBe(3);
    expect(decodeForVerification('Zg==', 'standard').bytes).toBe(1);
    expect(decodeForVerification('Zm9v', 'base64url').bytes).toBe(3);
  });

  it('输出十六进制预览', () => {
    const result = decodeForVerification('Zm9v', 'standard');
    expect(result.hexPreview).toBe('66 6f 6f');
    expect(result.error).toBeNull();
  });

  it('非法填充组合解码失败', () => {
    // 字符集合法但字节层面自相矛盾的序列
    const result = decodeForVerification('====', 'standard');
    expect(result.error).not.toBeNull();
  });
});
