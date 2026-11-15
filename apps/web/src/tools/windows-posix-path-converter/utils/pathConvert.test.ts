import { describe, expect, it } from 'vitest';
import { convertPath, convertPathBatch, detectPathKind } from './pathConvert';

describe('detectPathKind', () => {
  it('识别盘符、UNC、POSIX、相对路径与 URL', () => {
    expect(detectPathKind('C:\\Users\\me')).toBe('windows-drive');
    expect(detectPathKind('C:/Users/me')).toBe('windows-drive');
    expect(detectPathKind('\\\\server\\share\\file.txt')).toBe('unc');
    expect(detectPathKind('//server/share/file.txt')).toBe('unc');
    expect(detectPathKind('/home/me/src')).toBe('posix-absolute');
    expect(detectPathKind('./src/utils')).toBe('relative');
    expect(detectPathKind('https://example.com/a/b')).toBe('url');
  });
});

describe('Windows → POSIX', () => {
  it('盘符路径映射到 WSL /mnt 并小写盘符', () => {
    const result = convertPath('C:\\Users\\me\\project', 'win2posix', 'wsl', true);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('/mnt/c/Users/me/project');
  });

  it('混合分隔符同样识别并转换', () => {
    const result = convertPath('C:/Users\\me/project', 'win2posix', 'wsl', true);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('/mnt/c/Users/me/project');
  });

  it('WSL2 风格映射到 /c', () => {
    const result = convertPath('C:\\Users\\me', 'win2posix', 'wsl2', true);
    expect(result.output).toBe('/c/Users/me');
  });

  it('UNC 转 POSIX 双斜杠形式', () => {
    const result = convertPath('\\\\server\\share\\dir\\file.txt', 'win2posix', 'wsl', true);
    expect(result.ok).toBe(true);
    expect(result.kind).toBe('unc');
    expect(result.output).toBe('//server/share/dir/file.txt');
  });

  it('POSIX 绝对路径段归一折叠 ..', () => {
    const on = convertPath('/mnt/c/Users/me/../other', 'win2posix', 'wsl', true);
    expect(on.output).toBe('/mnt/c/Users/other');
    const off = convertPath('/mnt/c/Users/me/../other', 'win2posix', 'wsl', false);
    expect(off.output).toBe('/mnt/c/Users/me/../other');
  });

  it('相对路径仅做分隔符归一并提示', () => {
    const result = convertPath('.\\src\\utils', 'win2posix', 'wsl', true);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('src/utils');
    expect(result.warnings.join('')).toContain('相对路径');
  });

  it('URL 原样返回并提示', () => {
    const result = convertPath('https://example.com/a/b', 'win2posix', 'wsl', true);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('https://example.com/a/b');
    expect(result.warnings.length).toBe(1);
  });
});

describe('POSIX → Windows', () => {
  it('/mnt/c 映射回盘符路径', () => {
    const result = convertPath('/mnt/c/Users/me/project', 'posix2win', 'wsl', true);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('C:\\Users\\me\\project');
  });

  it('WSL2 风格下 /c/... 也映射回盘符', () => {
    const result = convertPath('/c/Users/me', 'posix2win', 'wsl2', true);
    expect(result.output).toBe('C:\\Users\\me');
  });

  it('UNC 转 Windows 反斜杠形式', () => {
    const result = convertPath('//server/share/dir/file.txt', 'posix2win', 'wsl', true);
    expect(result.ok).toBe(true);
    expect(result.output).toBe('\\\\server\\share\\dir\\file.txt');
  });

  it('/mnt/wsl 等非盘符挂载原样返回并告警', () => {
    const result = convertPath('/mnt/wsl/foo', 'posix2win', 'wsl', true);
    expect(result.output).toBe('/mnt/wsl/foo');
    expect(result.warnings.join('')).toContain('无法映射');
  });

  it('普通 POSIX 绝对路径无法映射时原样返回', () => {
    const result = convertPath('/home/me/src', 'posix2win', 'wsl', true);
    expect(result.output).toBe('/home/me/src');
    expect(result.warnings.join('')).toContain('无法确定');
  });

  it('相对路径仅做分隔符归一', () => {
    const result = convertPath('./src/utils', 'posix2win', 'wsl', true);
    expect(result.output).toBe('src\\utils');
    expect(result.warnings.join('')).toContain('相对路径');
  });
});

describe('批量模式', () => {
  it('忽略空行并按行转换', () => {
    const { results, ignoredEmptyLines } = convertPathBatch(
      'C:\\Users\\me\n\n/mnt/c/Users/me\n',
      'win2posix',
      'wsl',
      true,
    );
    expect(ignoredEmptyLines).toBe(2);
    expect(results).toHaveLength(2);
    expect(results[0]?.output).toBe('/mnt/c/Users/me');
    expect(results[1]?.output).toBe('/mnt/c/Users/me');
  });
});
