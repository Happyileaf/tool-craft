import { describe, expect, it } from 'vitest';
import { generateGitignore, splitRules } from './gitignore';

describe('splitRules', () => {
  it('按行拆分并去除逐行空白，丢弃空行', () => {
    expect(splitRules('a\n  b  \n\n\r\nc\r\n')).toEqual(['a', 'b', 'c']);
    expect(splitRules('')).toEqual([]);
    expect(splitRules('\n  \n')).toEqual([]);
  });
});

describe('generateGitignore', () => {
  it('勾选多个模板：包含各组规则与注释头，组间空行分隔，顺序稳定', () => {
    const output = generateGitignore(['node', 'macos'], '');
    const lines = output.split('\n');
    expect(lines[0]).toBe('# Node.js');
    expect(output).toContain('node_modules/');
    expect(output).toContain('# macOS');
    expect(output).toContain('.DS_Store');
    expect(output).toContain('\n\n# macOS');
    // 未勾选的组不出现
    expect(output).not.toContain('# Python');
    expect(output).not.toContain('__pycache__/');
  });

  it('跨模板重复规则只保留首次出现', () => {
    const output = generateGitignore(['node', 'logs'], '');
    const lines = output.split('\n').filter((line) => line.trim() === 'npm-debug.log*');
    expect(lines).toEqual(['npm-debug.log*']);
  });

  it('自定义规则追加在末尾并去重，空行被规范处理', () => {
    const output = generateGitignore(['node'], '  \nmy-secret/\nnode_modules/\n\n  out/tmp  ');
    expect(output.endsWith('# Custom rules\nmy-secret/\nout/tmp')).toBe(true);
    expect(output).not.toContain('node_modules/\nmy-secret/');
    const customSection = output.slice(output.indexOf('# Custom rules'));
    expect(customSection.match(/node_modules\//g)).toBeNull();
  });

  it('未选择模板且无自定义输入时输出空字符串（空态）', () => {
    expect(generateGitignore([], '')).toBe('');
  });

  it('仅自定义规则时只输出自定义分组', () => {
    const output = generateGitignore([], 'foo/\nbar.txt');
    expect(output).toBe('# Custom rules\nfoo/\nbar.txt');
  });

  it('自定义规则全部重复时不产生空的自定义分组', () => {
    const output = generateGitignore(['node'], 'node_modules/');
    expect(output).not.toContain('# Custom rules');
  });
});
