import { describe, expect, it } from 'vitest';
import {
  COPYRIGHT_HOLDER_PLACEHOLDER,
  LICENSES,
  MAX_HOLDER_LENGTH,
  MAX_YEAR,
  MIN_YEAR,
  YEAR_PLACEHOLDER,
} from '../constants';
import { LICENSE_TEMPLATES } from '../licenses';
import {
  generateLicense,
  getLicenseMeta,
  hasPlaceholders,
  isValidCopyrightHolder,
  isValidYear,
} from './generate';

describe('isValidYear', () => {
  it('接受区间内的整数年份', () => {
    expect(isValidYear(2026)).toBe(true);
    expect(isValidYear(MIN_YEAR)).toBe(true);
    expect(isValidYear(MAX_YEAR)).toBe(true);
  });

  it('拒绝区间外年份与非整数', () => {
    expect(isValidYear(MIN_YEAR - 1)).toBe(false);
    expect(isValidYear(MAX_YEAR + 1)).toBe(false);
    expect(isValidYear(2026.5)).toBe(false);
    expect(isValidYear(Number.NaN)).toBe(false);
  });
});

describe('isValidCopyrightHolder', () => {
  it('接受非空且长度合规的名称（自动忽略首尾空白）', () => {
    expect(isValidCopyrightHolder('Alice')).toBe(true);
    expect(isValidCopyrightHolder('  Alice  ')).toBe(true);
    expect(isValidCopyrightHolder('北京某科技有限公司')).toBe(true);
  });

  it('拒绝空白名称与超长名称', () => {
    expect(isValidCopyrightHolder('   ')).toBe(false);
    expect(isValidCopyrightHolder('')).toBe(false);
    expect(isValidCopyrightHolder('a'.repeat(MAX_HOLDER_LENGTH + 1))).toBe(false);
  });
});

describe('hasPlaceholders', () => {
  it('除 Unlicense 外的内置许可证都含占位符', () => {
    for (const meta of LICENSES) {
      expect(hasPlaceholders(meta.id)).toBe(meta.id !== 'Unlicense');
    }
  });

  it('未知 id 返回 false', () => {
    expect(hasPlaceholders('UNKNOWN')).toBe(false);
  });
});

describe('generateLicense', () => {
  it('为 MIT 正确填充年份与著作权人且不残留占位符', () => {
    const output = generateLicense('MIT', 2026, 'Alice');
    expect(output).toContain('Copyright (c) 2026 Alice');
    expect(output).not.toContain(YEAR_PLACEHOLDER);
    expect(output).not.toContain(COPYRIGHT_HOLDER_PLACEHOLDER);
    expect(output.startsWith('MIT License')).toBe(true);
  });

  it('BSD 系列使用逗号风格的版权行', () => {
    const bsd2 = generateLicense('BSD-2-Clause', 2025, 'Bob');
    expect(bsd2).toContain('Copyright (c) 2025, Bob');
    const bsd3 = generateLicense('BSD-3-Clause', 2025, 'Bob');
    expect(bsd3).toContain('Copyright (c) 2025, Bob');
    expect(bsd3).toContain('Neither the name of the copyright holder');
  });

  it('ISC 正确填充并保留免责条款', () => {
    const output = generateLicense('ISC', 2024, 'Carol');
    expect(output).toContain('Copyright (c) 2024, Carol');
    expect(output).toContain('PROVIDED "AS IS"');
  });

  it('Apache-2.0 填充附录占位符并保留正文条款', () => {
    const output = generateLicense('Apache-2.0', 2026, 'Acme Corp');
    expect(output).toContain('Copyright 2026 Acme Corp');
    expect(output).not.toContain('[yyyy]');
    expect(output).not.toContain('[name of copyright owner]');
    expect(output).toContain('Version 2.0, January 2004');
    expect(output).toContain('Grant of Patent License');
  });

  it('GPL-3.0 填充应用声明中的占位符并保留完整条款', () => {
    const output = generateLicense('GPL-3.0', 2026, 'Dora');
    expect(output).toContain('Copyright (C) 2026 Dora');
    expect(output).not.toContain(YEAR_PLACEHOLDER);
    expect(output).not.toContain(COPYRIGHT_HOLDER_PLACEHOLDER);
    expect(output).toContain('Version 3, 29 June 2007');
    expect(output).toContain('END OF TERMS AND CONDITIONS');
  });

  it('Unlicense 无占位符，参数缺失时也原样返回官方文本', () => {
    const output = generateLicense('Unlicense', 0, '   ');
    expect(output).toBe(LICENSE_TEMPLATES.Unlicense);
    expect(output).toContain('public domain');
  });

  it('自动去除著作权人名称首尾空白', () => {
    const output = generateLicense('MIT', 2026, '  Alice  ');
    expect(output).toContain('Copyright (c) 2026 Alice');
  });

  it('未知许可证 id 抛错', () => {
    expect(() => generateLicense('WTFPL', 2026, 'Alice')).toThrow(
      '未知的许可证',
    );
  });

  it('含占位符的许可证拒绝非法年份', () => {
    expect(() => generateLicense('MIT', 1800, 'Alice')).toThrow('年份');
    expect(() => generateLicense('MIT', 2026.1, 'Alice')).toThrow('年份');
  });

  it('含占位符的许可证拒绝空著作权人', () => {
    expect(() => generateLicense('MIT', 2026, '  ')).toThrow('著作权人');
  });

  it('填充不改动模板条款：替换前后仅版权行发生变化', () => {
    const template = LICENSE_TEMPLATES.MIT;
    const output = generateLicense('MIT', 2026, 'Alice');
    const restored = output
      .split('2026')
      .join(YEAR_PLACEHOLDER)
      .split('Alice')
      .join(COPYRIGHT_HOLDER_PLACEHOLDER);
    expect(restored).toBe(template);
  });
});

describe('getLicenseMeta', () => {
  it('按 id 返回元数据', () => {
    expect(getLicenseMeta('MIT')?.spdxName).toBe('MIT License');
    expect(getLicenseMeta('GPL-3.0')?.copyleft).toBe('强');
    expect(getLicenseMeta('Apache-2.0')?.patentGrant).toBe(true);
  });

  it('未知 id 返回 undefined', () => {
    expect(getLicenseMeta('NOPE')).toBeUndefined();
  });
});
