import { describe, expect, it } from 'vitest';
import { describeCanonicalCasing, parseBcp47Tag, parseUnicodeExtension } from './bcp47';

describe('parseBcp47Tag', () => {
  it('解析完整标签 language-script-region-variant', () => {
    const result = parseBcp47Tag('zh-Hans-CN-1994');
    expect(result.valid).toBe(true);
    expect(result.language).toBe('zh');
    expect(result.script).toBe('Hans');
    expect(result.region).toBe('CN');
    expect(result.variants).toEqual(['1994']);
    expect(result.canonical).toBe('zh-Hans-CN-1994');
  });

  it('规范化大小写并解析 extlang', () => {
    const result = parseBcp47Tag('ZH-cmn-Hant-TW');
    expect(result.valid).toBe(true);
    expect(result.language).toBe('zh');
    expect(result.extlangs).toEqual(['cmn']);
    expect(result.script).toBe('Hant');
    expect(result.region).toBe('TW');
  });

  it('解析 u 扩展并区分 attribute 与 keyword', () => {
    const result = parseBcp47Tag('de-DE-u-co-phonebk-ca-gregory');
    expect(result.valid).toBe(true);
    expect(result.unicodeExtension).not.toBeNull();
    expect(result.unicodeExtension?.keywords).toEqual([
      { key: 'co', values: ['phonebk'] },
      { key: 'ca', values: ['gregory'] },
    ]);
  });

  it('解析多扩展与私有使用段', () => {
    const result = parseBcp47Tag('en-US-a-foo-b-bar-x-private-tag');
    expect(result.valid).toBe(true);
    expect(result.extensions.map((item) => item.singleton)).toEqual(['a', 'b']);
    expect(result.privateUse).toEqual(['private', 'tag']);
  });

  it('识别纯私有使用标签', () => {
    const result = parseBcp47Tag('x-whatever');
    expect(result.valid).toBe(true);
    expect(result.language).toBeNull();
    expect(result.privateUse).toEqual(['whatever']);
    expect(result.canonical).toBe('x-whatever');
  });

  it('识别 grandfathered 标签并给出警告', () => {
    const result = parseBcp47Tag('i-klingon');
    expect(result.valid).toBe(true);
    expect(result.grandfathered).toBe('i-klingon');
    expect(result.diagnostics.some((item) => item.level === 'warning')).toBe(true);
  });

  it('拒绝下划线分隔符', () => {
    const result = parseBcp47Tag('zh_Hans_CN');
    expect(result.valid).toBe(false);
    expect(result.diagnostics[0]?.message).toContain('连字符');
  });

  it('拒绝空标签与首尾连字符', () => {
    expect(parseBcp47Tag('   ').valid).toBe(false);
    expect(parseBcp47Tag('-en').valid).toBe(false);
    expect(parseBcp47Tag('en-').valid).toBe(false);
    expect(parseBcp47Tag('en--US').valid).toBe(false);
  });

  it('拒绝非法字符', () => {
    const result = parseBcp47Tag('en US');
    expect(result.valid).toBe(false);
    expect(result.diagnostics[0]?.message).toContain('ASCII');
  });

  it('重复扩展前缀报错', () => {
    const result = parseBcp47Tag('en-a-foo-a-bar');
    expect(result.valid).toBe(false);
    expect(result.diagnostics.some((item) => item.message.includes('重复'))).toBe(true);
  });

  it('扩展前缀缺少内容时报错', () => {
    const result = parseBcp47Tag('en-a');
    expect(result.valid).toBe(false);
  });

  it('数字区域代码被接受', () => {
    const result = parseBcp47Tag('es-419');
    expect(result.valid).toBe(true);
    expect(result.region).toBe('419');
  });

  it('超长标签报错', () => {
    const result = parseBcp47Tag(`en-${'a'.repeat(40)}`);
    expect(result.valid).toBe(false);
  });

  it('未知语言给出 warning 但仍视为合法', () => {
    const result = parseBcp47Tag('xx-YY');
    expect(result.valid).toBe(true);
    expect(result.diagnostics.some((item) => item.level === 'warning')).toBe(true);
  });
});

describe('parseUnicodeExtension', () => {
  it('解析 attributes 与多值 keyword', () => {
    const parsed = parseUnicodeExtension(['attr1', 'nu', 'latn', 'ca', 'islamic', 'civil']);
    expect(parsed.attributes).toEqual(['attr1']);
    expect(parsed.keywords).toEqual([
      { key: 'nu', values: ['latn'] },
      { key: 'ca', values: ['islamic', 'civil'] },
    ]);
  });
});

describe('describeCanonicalCasing', () => {
  it('有规范化结果时返回说明', () => {
    const result = parseBcp47Tag('zh-hans-cn');
    expect(describeCanonicalCasing(result)).toContain('首字母大写');
  });

  it('无结果时返回空字符串', () => {
    const result = parseBcp47Tag('');
    expect(describeCanonicalCasing(result)).toBe('');
  });
});
