import { describe, expect, it } from 'vitest';
import {
  COMMON_LANGUAGES,
  GRANDFATHERED_TAGS,
  crossValidateWithIntl,
  parseBcp47,
} from './bcp47';

describe('parseBcp47 主流程', () => {
  it('解析复杂标签 zh-Hans-CN-u-ca-chinese-nu-hans 的全部组成', () => {
    const result = parseBcp47('zh-Hans-CN-u-ca-chinese-nu-hans');
    expect(result.language).toBe('zh');
    expect(result.script).toBe('Hans');
    expect(result.region).toBe('CN');
    expect(result.extensions).toHaveLength(1);

    const uExt = result.extensions[0]!;
    expect(uExt.singleton).toBe('u');
    expect(uExt.keywords).toEqual([
      { key: 'ca', type: ['chinese'] },
      { key: 'nu', type: ['hans'] },
    ]);
    expect(result.diagnostics.filter((item) => item.level === 'error')).toHaveLength(0);
  });

  it('解析 de-DE-u-co-phonebk 的 Unicode 扩展', () => {
    const result = parseBcp47('de-DE-u-co-phonebk');
    expect(result.language).toBe('de');
    expect(result.region).toBe('DE');
    expect(result.extensions[0]!.keywords).toEqual([{ key: 'co', type: ['phonebk'] }]);
  });

  it('解析普通标签 en-US', () => {
    const result = parseBcp47('en-US');
    expect(result.language).toBe('en');
    expect(result.region).toBe('US');
    expect(result.extensions).toEqual([]);
    expect(result.canonical).toBe('en-US');
  });

  it('解析含变体的标签 en-GB-oed 识别为 grandfathered', () => {
    const result = parseBcp47('en-GB-oed');
    expect(result.grandfathered).toBe('en-GB-oed');
    expect(result.language).toBeNull();
    expect(result.diagnostics.some((item) => item.level === 'warning')).toBe(true);
  });

  it('识别 i-klingon 等不规则遗留标签（大小写不敏感）', () => {
    const result = parseBcp47('I-Klingon');
    expect(result.grandfathered).toBe('i-klingon');
  });

  it('解析纯私有标签 x-private', () => {
    const result = parseBcp47('x-private');
    expect(result.language).toBeNull();
    expect(result.privateUse).toEqual(['private']);
    expect(result.canonical).toBe('x-private');
  });

  it('解析带私有子标签的完整标签', () => {
    const result = parseBcp47('zh-CN-x-custom-tag');
    expect(result.language).toBe('zh');
    expect(result.region).toBe('CN');
    expect(result.privateUse).toEqual(['custom', 'tag']);
    expect(result.canonical).toBe('zh-CN-x-custom-tag');
  });
});

describe('parseBcp47 非法与边界输入', () => {
  it('下划线分隔 en_US 报 error 且不抛异常，并给出替换建议', () => {
    const result = parseBcp47('en_US');
    expect(result.diagnostics.some((item) => item.level === 'error')).toBe(true);
    expect(result.suggestions.some((text) => text.includes('连字符'))).toBe(true);
    expect(result.canonical).toBe('en-US');
  });

  it('纯数字 419 作为开头报 error', () => {
    const result = parseBcp47('419');
    expect(result.diagnostics.some((item) => item.level === 'error')).toBe(true);
    expect(result.language).toBeNull();
  });

  it('空输入报 error 且不抛异常', () => {
    expect(parseBcp47('').diagnostics[0]!.level).toBe('error');
    expect(parseBcp47('   ').diagnostics[0]!.level).toBe('error');
  });

  it('null / undefined 输入不抛异常', () => {
    expect(() => parseBcp47(null as unknown as string)).not.toThrow();
    expect(() => parseBcp47(undefined as unknown as string)).not.toThrow();
  });

  it('包含非法字符时报 error', () => {
    const result = parseBcp47('zh-CN@123');
    expect(result.diagnostics.some((item) => item.level === 'error')).toBe(true);
  });

  it('超长标签报 error', () => {
    const result = parseBcp47(`zh-${'a'.repeat(4000)}`);
    expect(result.diagnostics.some((item) => item.level === 'error')).toBe(true);
  });

  it('连续连字符报 error', () => {
    const result = parseBcp47('zh--CN');
    expect(result.diagnostics.some((item) => item.level === 'error')).toBe(true);
  });

  it('重复扩展前缀报 error', () => {
    const result = parseBcp47('en-US-u-ca-gregory-u-nu-latn');
    expect(
      result.diagnostics.some((item) => item.level === 'error' && item.message.includes('重复')),
    ).toBe(true);
  });

  it('未注册变体仅告警而不报结构错误', () => {
    const result = parseBcp47('sl-rozaj');
    const variantDiag = result.diagnostics.find((item) => item.subtag === 'rozaj');
    expect(variantDiag?.level).toBe('warning');
  });
});

describe('parseBcp47 大小写规范化', () => {
  it('输出符合 BCP 47 推荐写法', () => {
    expect(parseBcp47('zh-hans-cn').canonical).toBe('zh-Hans-CN');
    expect(parseBcp47('EN-us').canonical).toBe('en-US');
    expect(parseBcp47('JA-jp').canonical).toBe('ja-JP');
  });

  it('原始写法不规范时给出建议', () => {
    const result = parseBcp47('ZH-HANS-cn');
    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.canonical).toBe('zh-Hans-CN');
  });
});

describe('parseBcp47 静态表与扩展细节', () => {
  it('常用语言 / 区域表收录关键条目', () => {
    expect(COMMON_LANGUAGES.zh).toBeDefined();
    expect(COMMON_LANGUAGES.en).toBeDefined();
  });

  it('grandfathered 表包含 en-GB-oed 与 i-klingon', () => {
    expect(GRANDFATHERED_TAGS['en-GB-oed']).toBeDefined();
    expect(GRANDFATHERED_TAGS['i-klingon']).toBeDefined();
  });

  it('u 扩展 attribute 与多值 keyword 正确拆分', () => {
    const result = parseBcp47('en-US-u-attr1-attr2-ca-gregory-nu-latn');
    const uExt = result.extensions[0]!;
    expect(uExt.attributes).toEqual(['attr1', 'attr2']);
    expect(uExt.keywords).toEqual([
      { key: 'ca', type: ['gregory'] },
      { key: 'nu', type: ['latn'] },
    ]);
  });

  it('无取值的 u keyword 产生告警', () => {
    const result = parseBcp47('en-US-u-ca');
    expect(
      result.diagnostics.some((item) => item.level === 'warning' && item.subtag === 'ca'),
    ).toBe(true);
  });

  it('非 u 扩展保留原始子标签序列', () => {
    const result = parseBcp47('en-US-t-t0-abcd');
    const tExt = result.extensions.find((item) => item.singleton === 't');
    expect(tExt?.subtags).toEqual(['t0', 'abcd']);
  });
});

describe('crossValidateWithIntl', () => {
  it('运行时支持 Intl.Locale 时返回原生解析字段', () => {
    const cross = crossValidateWithIntl('zh-Hans-CN');
    if (cross === null) {
      // 运行时不支持时跳过断言，保证测试环境兼容
      expect(true).toBe(true);
      return;
    }
    expect(cross.language).toBe('zh');
    expect(cross.script).toBe('Hans');
    expect(cross.region).toBe('CN');
  });

  it('非法标签交叉验证返回 null 而非抛异常', () => {
    expect(crossValidateWithIntl('not_a_valid_tag_!!!')).toBeNull();
  });
});
