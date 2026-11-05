import { describe, expect, it } from 'vitest';
import { BINARY_PRESETS, PROJECT_TEMPLATES } from '../constants';
import {
  generateGitattributes,
  isKnownAttribute,
  validateRules,
  type GitAttributeRule,
  type GlobalLinePolicy,
} from './gitattributes';

const rule = (partial: Partial<GitAttributeRule> = {}): GitAttributeRule => ({
  id: 1,
  pattern: '',
  attributes: [],
  enabled: true,
  group: '',
  ...partial,
});

const fromTemplate = (key: string): GitAttributeRule[] => {
  const template = PROJECT_TEMPLATES.find((item) => item.key === key)!;
  return template.rules.map((item, index) => ({ id: index + 1, ...item }));
};

const fromPreset = (key: string): GitAttributeRule[] => {
  const preset = BINARY_PRESETS.find((item) => item.key === key)!;
  return preset.rules.map((item, index) => ({
    id: index + 1,
    pattern: item.pattern,
    attributes: [...item.attributes],
    enabled: true,
    group: '',
  }));
};

describe('generateGitattributes 全局策略', () => {
  it('四种全局换行策略输出正确，none 且无规则时为空字符串', () => {
    expect(generateGitattributes('none', [])).toBe('');
    expect(generateGitattributes('auto', [])).toBe('* text=auto');
    expect(generateGitattributes('auto-lf', [])).toBe('* text=auto eol=lf');
    expect(generateGitattributes('auto-crlf', [])).toBe('* text=auto eol=crlf');
  });

  it('全局策略与首条规则之间以空行分隔', () => {
    const output = generateGitattributes('auto', [
      rule({ id: 1, pattern: '*.sh', attributes: ['text', 'eol=lf'] }),
    ]);
    expect(output).toBe('* text=auto\n\n*.sh text eol=lf');
  });
});

describe('generateGitattributes 规则输出', () => {
  it('停用规则不输出，启用规则按固定属性顺序输出', () => {
    const output = generateGitattributes('auto-lf', [
      rule({ id: 1, pattern: '*.sh', attributes: ['eol=lf', 'text'], enabled: true }),
      rule({ id: 2, pattern: '*.bat', attributes: ['text', 'eol=crlf'], enabled: false }),
    ]);
    expect(output).toBe('* text=auto eol=lf\n\n*.sh text eol=lf');
    expect(output).not.toContain('*.bat');
  });

  it('pattern 首尾空白被裁剪，空 pattern 与无属性规则跳过', () => {
    const output = generateGitattributes('none', [
      rule({ id: 1, pattern: '  *.sh  ', attributes: ['text'] }),
      rule({ id: 2, pattern: '', attributes: ['text'] }),
      rule({ id: 3, pattern: '*.md', attributes: [] }),
    ]);
    expect(output).toBe('*.sh text');
  });

  it('二进制预设输出正确，每条规则一行 binary 属性', () => {
    const output = generateGitattributes('none', fromPreset('images'));
    const lines = output.split('\n');
    expect(lines[0]).toBe('*.png binary');
    expect(lines).toContain('*.jpg binary');
    expect(lines).toContain('*.tiff binary');
    expect(lines.every((line) => line.endsWith(' binary'))).toBe(true);
  });

  it('export-ignore 规则原样输出', () => {
    const output = generateGitattributes('none', [
      rule({ id: 1, pattern: 'dist/', attributes: ['export-ignore'] }),
    ]);
    expect(output).toBe('dist/ export-ignore');
  });

  it('自定义 merge=ours 驱动原样输出且校验通过', () => {
    const rules = [rule({ id: 1, pattern: '*.unity', attributes: ['merge=ours', 'eol=lf'] })];
    expect(validateRules(rules).errors).toEqual([]);
    expect(generateGitattributes('none', rules)).toBe('*.unity eol=lf merge=ours');
  });

  it('linguist-language 带值正常输出，缺值规则被跳过', () => {
    const output = generateGitattributes('none', [
      rule({ id: 1, pattern: '*.ts', attributes: ['linguist-language=TypeScript'] }),
      rule({ id: 2, pattern: '*.map', attributes: ['linguist-language='] }),
    ]);
    expect(output).toBe('*.ts linguist-language=TypeScript');
  });

  it('非法属性规则不输出且不阻断其余规则', () => {
    const output = generateGitattributes('none', [
      rule({ id: 1, pattern: '*.bad', attributes: ['foo=bar'] }),
      rule({ id: 2, pattern: '*.ok', attributes: ['text'] }),
    ]);
    expect(output).toBe('*.ok text');
  });

  it('分组注释与行排序稳定快照：同组相邻合并，切换分组重新输出注释', () => {
    const output = generateGitattributes('auto', [
      rule({ id: 1, pattern: '*.sh', attributes: ['eol=lf', 'text'], group: '换行符' }),
      rule({ id: 2, pattern: '*.png', attributes: ['binary'], group: '二进制' }),
      rule({ id: 3, pattern: '*.bat', attributes: ['eol=crlf', 'text'], group: '换行符' }),
    ]);
    expect(output).toMatchInlineSnapshot(
      '"* text=auto\n\n# === 换行符 ===\n*.sh text eol=lf\n\n# === 二进制 ===\n*.png binary\n\n# === 换行符 ===\n*.bat text eol=crlf"',
    );
    expect(output.split('\n\n')).toHaveLength(4);
  });
});

describe('validateRules 校验', () => {
  it('空 pattern 报错；停用的空规则不报错', () => {
    const result = validateRules([
      rule({ id: 1, pattern: '   ', attributes: ['text'] }),
      rule({ id: 2, pattern: '', attributes: ['text'], enabled: false }),
    ]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('pattern 不能为空');
  });

  it('没有任何属性时报错', () => {
    const result = validateRules([rule({ id: 1, pattern: '*.md', attributes: [] })]);
    expect(result.errors[0]).toContain('至少选择一个属性');
  });

  it('linguist-language= 缺语言名报错，带值不报错', () => {
    const invalid = validateRules([
      rule({ id: 1, pattern: '*.map', attributes: ['linguist-language='] }),
    ]);
    expect(invalid.errors[0]).toContain('linguist-language=');
    expect(invalid.errors[0]).toContain('必须填写取值');

    const valid = validateRules([
      rule({ id: 1, pattern: '*.ts', attributes: ['linguist-language=TypeScript'] }),
    ]);
    expect(valid.errors).toEqual([]);
  });

  it('非法属性与自定义 merge/diff 缺值分别报错', () => {
    const result = validateRules([
      rule({ id: 1, pattern: '*.a', attributes: ['foo=bar'] }),
      rule({ id: 2, pattern: '*.b', attributes: ['merge='] }),
      rule({ id: 3, pattern: '*.c', attributes: ['diff='] }),
    ]);
    expect(result.errors.some((error) => error.includes('非法属性「foo=bar」'))).toBe(true);
    expect(result.errors.some((error) => error.includes('merge=') && error.includes('取值'))).toBe(true);
    expect(result.errors.some((error) => error.includes('diff=') && error.includes('取值'))).toBe(true);
  });
});

describe('常量模板', () => {
  it('Node 模板填充后生成包含全局策略与关键分组行', () => {
    const output = generateGitattributes('auto-lf', fromTemplate('node'));
    expect(output.startsWith('* text=auto eol=lf')).toBe(true);
    expect(output).toContain('# === 换行符 ===');
    expect(output).toContain('*.sh text eol=lf');
    expect(output).toContain('# === Linguist ===');
    expect(output).toContain('node_modules/ linguist-vendored');
    expect(output).toContain('dist/ linguist-generated');
    expect(output).toContain('# === 归档导出 ===');
    expect(output).toContain('.github/ export-ignore');
  });

  it('Unity 模板包含自定义 unityyamlmerge 驱动与二进制资源', () => {
    const output = generateGitattributes('none', fromTemplate('unity'));
    expect(output).toContain('*.unity eol=lf merge=unityyamlmerge');
    expect(output).toContain('*.fbx binary');
    expect(output).toContain('Library/ linguist-generated');
  });

  it('全部二进制预设的每条规则都带 binary 属性', () => {
    for (const preset of BINARY_PRESETS) {
      expect(preset.rules.length).toBeGreaterThan(0);
      expect(preset.rules.every((item) => item.attributes.includes('binary'))).toBe(true);
    }
  });
});

describe('isKnownAttribute', () => {
  it('已知普通属性与带值前缀通过，未知属性与空值前缀不通过', () => {
    expect(isKnownAttribute('binary')).toBe(true);
    expect(isKnownAttribute('-linguist-detectable')).toBe(true);
    expect(isKnownAttribute('linguist-language=Python')).toBe(true);
    expect(isKnownAttribute('merge=ours')).toBe(true);
    expect(isKnownAttribute('linguist-language=')).toBe(false);
    expect(isKnownAttribute('foo=bar')).toBe(false);
  });
});

describe('GlobalLinePolicy 类型覆盖', () => {
  it('类型联合包含四个策略值', () => {
    const policies: GlobalLinePolicy[] = ['none', 'auto', 'auto-lf', 'auto-crlf'];
    expect(policies).toHaveLength(4);
  });
});
