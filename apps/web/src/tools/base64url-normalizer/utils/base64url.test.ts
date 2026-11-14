import { describe, it, expect } from 'vitest';
import {
  encodeBase64,
  decodeBase64,
  toBase64Url,
  toStandardBase64,
  detectVariant,
  normalizeToken,
  normalizeBatch,
} from './base64url';

describe('RFC 4648 §5 固定向量', () => {
  const vectors: Array<[string, string]> = [
    ['', ''],
    ['f', 'Zg'],
    ['fo', 'Zm8'],
    ['foo', 'Zm9v'],
    ['foob', 'Zm9vYg'],
    ['fooba', 'Zm9vYmE'],
    ['foobar', 'Zm9vYmFy'],
  ];

  it('标准编码与 §5 向量一致', () => {
    vectors.forEach(([input, expected]) => {
      expect(encodeBase64(input)).toBe(
        expected + '='.repeat((4 - (expected.length % 4)) % 4),
      );
    });
  });

  it('foobar 标准 Zm9vYmFy 与 URL 形式互转一致', () => {
    const standard = encodeBase64('foobar');
    expect(standard).toBe('Zm9vYmFy');
    expect(toBase64Url(standard)).toBe('Zm9vYmFy');
    expect(toStandardBase64('Zm9vYmFy')).toBe('Zm9vYmFy');
  });

  it('字节级解码往返还原原文（含中文 UTF-8）', () => {
    ['hello world', 'Base64URL 规范化测试 🚀', 'line1\nline2'].forEach((text) => {
      expect(decodeBase64(encodeBase64(text))).toBe(text);
    });
  });
});

describe('字符替换', () => {
  it('+ / 与 - _ 双向替换', () => {
    expect(toBase64Url('++//')).toBe('--__');
    expect(toStandardBase64('--__')).toBe('++//');
    // 真实字节 0xfb 0xef 0xff 的标准 Base64 即 ++//（btoa 按 Latin-1 逐字节编码）
    const standard = btoa(String.fromCharCode(0xfb, 0xef, 0xff));
    expect(standard).toBe('++//');
    expect(toBase64Url(standard)).toBe('--__');
    expect(toStandardBase64('--__')).toBe('++//');
  });
});

describe('填充补齐', () => {
  it('无填充 URL 令牌自动补齐后可解码', () => {
    expect(toStandardBase64('Zg')).toBe('Zg==');
    expect(toStandardBase64('Zm8')).toBe('Zm8=');
    expect(toStandardBase64('Zm9v')).toBe('Zm9v');
    expect(decodeBase64(toStandardBase64('Zg'))).toBe('f');
    expect(decodeBase64(toStandardBase64('Zm8'))).toBe('fo');
  });
});

describe('变体识别', () => {
  it('区分标准与 URL 变体', () => {
    expect(detectVariant('a-b_c')).toBe('url');
    expect(detectVariant('a+b/c')).toBe('standard');
    expect(detectVariant('Zm9vYmFy')).toBe('standard');
    expect(detectVariant('Zg')).toBe('url');
    expect(detectVariant('Zg==')).toBe('standard');
  });

  it('normalizeToken auto 模式输出目标变体并标注', () => {
    const url = normalizeToken('++//', 'auto');
    expect(url.ok).toBe(true);
    expect(url.variant).toBe('standard');
    expect(url.output).toBe('--__');

    const std = normalizeToken('--__', 'auto');
    expect(std.ok).toBe(true);
    expect(std.variant).toBe('url');
    // auto 模式统一规范化为 URL 形式，URL 输入保持不变
    expect(std.output).toBe('--__');
  });

  it('强制模式按指定方向规范化', () => {
    expect(normalizeToken('Zg==', 'to-url').output).toBe('Zg');
    expect(normalizeToken('Zg', 'to-standard').output).toBe('Zg==');
  });
});

describe('非法输入', () => {
  it('非法字符带原因报错且原样保留', () => {
    const star = normalizeToken('Zm9*', 'auto');
    expect(star.ok).toBe(false);
    expect(star.error).toContain('非法字符');
    expect(star.output).toBe('Zm9*');

    const chinese = normalizeToken('Zm9v中文', 'auto');
    expect(chinese.ok).toBe(false);
    expect(chinese.output).toBe('Zm9v中文');
  });

  it('长度非法报错：1 个有效字符 / 标准体非 4 倍数', () => {
    const oneChar = normalizeToken('Z', 'auto');
    expect(oneChar.ok).toBe(false);
    expect(oneChar.error).toContain('长度');

    const badStd = normalizeToken('Zg=', 'auto');
    expect(badStd.ok).toBe(false);
    expect(badStd.error).toContain('4 的倍数');
  });

  it('变体字符混⽤报错', () => {
    const mixedUrl = normalizeToken('a+b-', 'auto');
    expect(mixedUrl.ok).toBe(false);
    expect(mixedUrl.error).toMatch(/不允许/);
  });
});

describe('多行批量', () => {
  it('空行保留、逐行处理并逐行告警', () => {
    const input = ['++//', '', 'Zm9vYmFy', 'bad*token', ''].join('\n');
    const batch = normalizeBatch(input, 'auto');
    expect(batch.lines).toHaveLength(5);
    expect(batch.output.split('\n')).toHaveLength(5);
    expect(batch.output.split('\n')[1]).toBe('');
    expect(batch.output.split('\n')[4]).toBe('');
    expect(batch.successCount).toBe(2);
    expect(batch.failureCount).toBe(1);
    const failed = batch.lines.find((l) => !l.ok);
    expect(failed?.line).toBe(4);
    expect(failed?.output).toBe('bad*token');
  });

  it('CRLF 行尾归一化', () => {
    const batch = normalizeBatch('++//\r\n--__\r\n', 'auto');
    expect(batch.lines).toHaveLength(3);
    expect(batch.failureCount).toBe(0);
    expect(batch.lines[0]?.output).toBe('--__');
    expect(batch.lines[1]?.output).toBe('--__');
  });
});
